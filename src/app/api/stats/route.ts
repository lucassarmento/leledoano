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

  // Get all votes with details
  const allVotes = await db
    .select({
      id: votes.id,
      voterId: votes.voterId,
      candidateId: votes.candidateId,
      createdAt: votes.createdAt,
    })
    .from(votes)
    .orderBy(desc(votes.createdAt));

  // 1. Vote Distribution (for pie chart)
  const voteCounts = new Map<string, number>();
  allVotes.forEach((vote) => {
    const current = voteCounts.get(vote.candidateId) || 0;
    voteCounts.set(vote.candidateId, current + 1);
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
      dayVotes.set(candidateName, (dayVotes.get(candidateName) || 0) + 1);
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

  // 3. Top Voters (who casts the most votes)
  const voterCounts = new Map<string, number>();
  allVotes.forEach((vote) => {
    const current = voterCounts.get(vote.voterId) || 0;
    voterCounts.set(vote.voterId, current + 1);
  });

  const topVoters = Array.from(voterCounts.entries())
    .map(([voterId, count]) => ({
      name: profileMap.get(voterId)?.name || "Unknown",
      votes: count,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 10);

  // 4. Who Votes For Who (matrix)
  const voteMatrix: Record<string, Record<string, number>> = {};
  allVotes.forEach((vote) => {
    const voterName = profileMap.get(vote.voterId)?.name || "Unknown";
    const candidateName = profileMap.get(vote.candidateId)?.name || "Unknown";

    if (!voteMatrix[voterName]) {
      voteMatrix[voterName] = {};
    }
    voteMatrix[voterName][candidateName] =
      (voteMatrix[voterName][candidateName] || 0) + 1;
  });

  // Convert to array format for heatmap
  const whoVotesForWho: { voter: string; candidate: string; count: number }[] = [];
  Object.entries(voteMatrix).forEach(([voter, candidates]) => {
    Object.entries(candidates).forEach(([candidate, count]) => {
      whoVotesForWho.push({ voter, candidate, count });
    });
  });

  // 5. Daily Activity (votes per day of week)
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

  allVotes.forEach((vote) => {
    if (vote.createdAt) {
      const day = new Date(vote.createdAt).getDay();
      dayOfWeekCounts[day]++;
    }
  });

  const dailyActivity = dayNames.map((name, index) => ({
    day: name,
    votes: dayOfWeekCounts[index],
  }));

  // 6. Hot Streak (last 7 days top recipients)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentVoteCounts = new Map<string, number>();
  allVotes
    .filter((v) => v.createdAt && new Date(v.createdAt) >= sevenDaysAgo)
    .forEach((vote) => {
      const current = recentVoteCounts.get(vote.candidateId) || 0;
      recentVoteCounts.set(vote.candidateId, current + 1);
    });

  const hotStreak = Array.from(recentVoteCounts.entries())
    .map(([candidateId, count]) => ({
      name: profileMap.get(candidateId)?.name || "Unknown",
      votes: count,
    }))
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 5);

  return NextResponse.json({
    voteDistribution,
    votesOverTime: votesOverTimeData,
    topVoters,
    whoVotesForWho,
    dailyActivity,
    hotStreak,
    top5Candidates,
  });
}
