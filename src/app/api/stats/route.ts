import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { votes, profiles } from "@/db/schema";
import { sql, eq, desc, gte } from "drizzle-orm";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all profiles
  const allProfiles = await db.select().from(profiles);
  const profileMap = new Map(allProfiles.map((p) => [p.id, p]));

  // Get all votes with details (including comment for weighted scoring)
  const allVotes = await db
    .select({
      id: votes.id,
      voterId: votes.voterId,
      candidateId: votes.candidateId,
      createdAt: votes.createdAt,
      comment: votes.comment,
    })
    .from(votes)
    .orderBy(desc(votes.createdAt));

  // Helper function to get vote weight (5 for comments, 1 for no comment)
  const getVoteWeight = (vote: { comment: string | null }) => vote.comment ? 5 : 1;

  // 1. Vote Distribution (for pie chart) - weighted by comments
  const voteCounts = new Map<string, number>();
  allVotes.forEach((vote) => {
    const current = voteCounts.get(vote.candidateId) || 0;
    voteCounts.set(vote.candidateId, current + getVoteWeight(vote));
  });

  const voteDistribution = Array.from(voteCounts.entries())
    .map(([candidateId, count]) => ({
      name: profileMap.get(candidateId)?.name || "Unknown",
      votes: count,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 6); // Top 6 for pie chart

  // 2. Votes Over Time (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const votesOverTime = new Map<string, Map<string, number>>();
  const dateSet = new Set<string>();

  allVotes
    .filter((v) => v.createdAt && new Date(v.createdAt) >= thirtyDaysAgo)
    .forEach((vote) => {
      const date = new Date(vote.createdAt!).toISOString().split("T")[0];
      const candidateName = profileMap.get(vote.candidateId)?.name || "Unknown";
      dateSet.add(date);

      if (!votesOverTime.has(date)) {
        votesOverTime.set(date, new Map());
      }
      const dayVotes = votesOverTime.get(date)!;
      dayVotes.set(candidateName, (dayVotes.get(candidateName) || 0) + getVoteWeight(vote));
    });

  // Get top 5 candidates for the line chart
  const top5Candidates = Array.from(voteCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => profileMap.get(id)?.name || "Unknown");

  const votesOverTimeData = Array.from(dateSet)
    .sort()
    .map((date) => {
      const dayVotes = votesOverTime.get(date) || new Map();
      const entry: Record<string, string | number> = { date };
      top5Candidates.forEach((name) => {
        entry[name] = dayVotes.get(name) || 0;
      });
      return entry;
    });

  // 3. Top Voters (who casts the most votes) - weighted by comments
  const voterCounts = new Map<string, number>();
  allVotes.forEach((vote) => {
    const current = voterCounts.get(vote.voterId) || 0;
    voterCounts.set(vote.voterId, current + getVoteWeight(vote));
  });

  const topVoters = Array.from(voterCounts.entries())
    .map(([voterId, count]) => ({
      name: profileMap.get(voterId)?.name || "Unknown",
      votes: count,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10);

  // 4. Who Votes For Who (matrix) - weighted by comments
  const voteMatrix: Record<string, Record<string, number>> = {};
  allVotes.forEach((vote) => {
    const voterName = profileMap.get(vote.voterId)?.name || "Unknown";
    const candidateName = profileMap.get(vote.candidateId)?.name || "Unknown";

    if (!voteMatrix[voterName]) {
      voteMatrix[voterName] = {};
    }
    voteMatrix[voterName][candidateName] =
      (voteMatrix[voterName][candidateName] || 0) + getVoteWeight(vote);
  });

  // Convert to array format for heatmap
  const whoVotesForWho: { voter: string; candidate: string; count: number }[] = [];
  Object.entries(voteMatrix).forEach(([voter, candidates]) => {
    Object.entries(candidates).forEach(([candidate, count]) => {
      whoVotesForWho.push({ voter, candidate, count });
    });
  });

  // 5. Daily Activity (votes per day of week) - weighted by comments
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  allVotes.forEach((vote) => {
    if (vote.createdAt) {
      const day = new Date(vote.createdAt).getDay();
      dayOfWeekCounts[day] += getVoteWeight(vote);
    }
  });

  const dailyActivity = dayNames.map((name, index) => ({
    day: name,
    votes: dayOfWeekCounts[index],
  }));

  // 6. Hot Streak (last 7 days top recipients) - weighted by comments
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentVoteCounts = new Map<string, number>();
  allVotes
    .filter((v) => v.createdAt && new Date(v.createdAt) >= sevenDaysAgo)
    .forEach((vote) => {
      const current = recentVoteCounts.get(vote.candidateId) || 0;
      recentVoteCounts.set(vote.candidateId, current + getVoteWeight(vote));
    });

  const hotStreak = Array.from(recentVoteCounts.entries())
    .map(([candidateId, count]) => ({
      name: profileMap.get(candidateId)?.name || "Unknown",
      votes: count,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

  // 7. Leaderboard Race (cumulative votes over time by timestamp) - weighted
  // Get top 8 candidates for the race chart
  const top8CandidateIds = Array.from(voteCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id]) => id);

  const top8CandidateNames = top8CandidateIds.map(
    (id) => profileMap.get(id)?.name || "Unknown"
  );

  // Get avatar URLs for top 8 candidates (for chart display)
  const top8CandidateAvatars = top8CandidateIds.map(
    (id) => profileMap.get(id)?.avatarUrl || null
  );

  // Sort all votes by timestamp (oldest first) for cumulative calculation
  const sortedVotes = [...allVotes]
    .filter((v) => v.createdAt)
    .sort((a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime());

  // Build cumulative data by timestamp - each vote creates a data point
  const cumulativeTotals = new Map<string, number>();

  // Initialize totals for all top candidates at 0
  top8CandidateIds.forEach((id) => cumulativeTotals.set(id, 0));

  // Create initial data point with all zeros
  const leaderboardRaceData: Record<string, string | number>[] = [];

  // Add a starting point before first vote (if there are votes)
  if (sortedVotes.length > 0) {
    const firstVoteTime = new Date(sortedVotes[0].createdAt!).getTime() - 1000;
    const startEntry: Record<string, string | number> = {
      timestamp: firstVoteTime
    };
    top8CandidateIds.forEach((id, index) => {
      startEntry[top8CandidateNames[index]] = 0;
    });
    leaderboardRaceData.push(startEntry);
  }

  sortedVotes.forEach((vote) => {
    const timestamp = new Date(vote.createdAt!).getTime();

    // Update cumulative total for this candidate (if in top 8)
    if (top8CandidateIds.includes(vote.candidateId)) {
      const current = cumulativeTotals.get(vote.candidateId) || 0;
      cumulativeTotals.set(vote.candidateId, current + getVoteWeight(vote));
    }

    // Create data point with current cumulative state for ALL candidates
    const entry: Record<string, string | number> = { timestamp };
    top8CandidateIds.forEach((id, index) => {
      entry[top8CandidateNames[index]] = cumulativeTotals.get(id) || 0;
    });
    leaderboardRaceData.push(entry);
  });

  return NextResponse.json({
    voteDistribution,
    votesOverTime: votesOverTimeData,
    topVoters,
    whoVotesForWho,
    dailyActivity,
    hotStreak,
    top5Candidates,
    leaderboardRace: leaderboardRaceData,
    leaderboardRaceCandidates: top8CandidateNames,
    leaderboardRaceAvatars: top8CandidateAvatars,
  });
}
