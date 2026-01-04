import { NextResponse } from "next/server";
import { db } from "@/db";
import { votes, profiles } from "@/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const currentYear = new Date().getFullYear();

    // Get participant profile
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);

    if (!profile) {
      return NextResponse.json(
        { error: "Participante nao encontrado" },
        { status: 404 }
      );
    }

    // Get votes received count
    const [votesReceivedResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(votes)
      .where(and(eq(votes.candidateId, id), eq(votes.year, currentYear)));
    const votesReceived = votesReceivedResult?.count || 0;

    // Get votes given count
    const [votesGivenResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(votes)
      .where(and(eq(votes.voterId, id), eq(votes.year, currentYear)));
    const votesGiven = votesGivenResult?.count || 0;

    // Get votes this week
    const [votesThisWeekResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(votes)
      .where(
        and(
          eq(votes.candidateId, id),
          eq(votes.year, currentYear),
          sql`${votes.createdAt} >= NOW() - INTERVAL '7 days'`
        )
      );
    const votesThisWeek = votesThisWeekResult?.count || 0;

    // Get current rank
    const leaderboard = await db
      .select({
        id: profiles.id,
        voteCount: sql<number>`COALESCE(COUNT(${votes.id}), 0)::int`,
      })
      .from(profiles)
      .leftJoin(
        votes,
        sql`${votes.candidateId} = ${profiles.id} AND ${votes.year} = ${currentYear}`
      )
      .groupBy(profiles.id)
      .orderBy(desc(sql`COALESCE(COUNT(${votes.id}), 0)`));

    const rank = leaderboard.findIndex((p) => p.id === id) + 1;

    // Get who votes for this person (top haters)
    const topHaters = await db
      .select({
        oderId: profiles.id,
        voterName: profiles.name,
        voterAvatar: profiles.avatarUrl,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(votes)
      .innerJoin(profiles, eq(votes.voterId, profiles.id))
      .where(and(eq(votes.candidateId, id), eq(votes.year, currentYear)))
      .groupBy(profiles.id, profiles.name, profiles.avatarUrl)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // Get who this person votes for (targets)
    const topTargets = await db
      .select({
        targetId: profiles.id,
        targetName: profiles.name,
        targetAvatar: profiles.avatarUrl,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(votes)
      .innerJoin(profiles, eq(votes.candidateId, profiles.id))
      .where(and(eq(votes.voterId, id), eq(votes.year, currentYear)))
      .groupBy(profiles.id, profiles.name, profiles.avatarUrl)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(10);

    // Get recent activity (votes involving this person)
    const recentActivity = await db.query.votes.findMany({
      where: and(
        eq(votes.year, currentYear),
        sql`(${votes.voterId} = ${id} OR ${votes.candidateId} = ${id})`
      ),
      orderBy: desc(votes.createdAt),
      limit: 20,
      with: {
        voter: true,
        candidate: true,
      },
    });

    // Get mutual rivalries (people who vote for each other)
    const mutualRivalries = await db.execute(sql`
      WITH my_votes AS (
        SELECT candidate_id, COUNT(*) as given
        FROM votes
        WHERE voter_id = ${id} AND year = ${currentYear}
        GROUP BY candidate_id
      ),
      votes_on_me AS (
        SELECT voter_id, COUNT(*) as received
        FROM votes
        WHERE candidate_id = ${id} AND year = ${currentYear}
        GROUP BY voter_id
      )
      SELECT
        p.id,
        p.name,
        p.avatar_url,
        COALESCE(mv.given, 0)::int as votes_given,
        COALESCE(vom.received, 0)::int as votes_received,
        (COALESCE(mv.given, 0) + COALESCE(vom.received, 0))::int as total
      FROM profiles p
      LEFT JOIN my_votes mv ON mv.candidate_id = p.id
      LEFT JOIN votes_on_me vom ON vom.voter_id = p.id
      WHERE (mv.given > 0 AND vom.received > 0)
      ORDER BY total DESC
      LIMIT 5
    `);

    // Get most active voting day
    const mostActiveDay = await db.execute(sql`
      SELECT
        TO_CHAR(created_at, 'Day') as day_name,
        COUNT(*) as count
      FROM votes
      WHERE (voter_id = ${id} OR candidate_id = ${id}) AND year = ${currentYear}
      GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
      ORDER BY count DESC
      LIMIT 1
    `);

    // Get total comments received
    const [commentsReceivedResult] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(votes)
      .where(
        and(
          eq(votes.candidateId, id),
          eq(votes.year, currentYear),
          sql`${votes.comment} IS NOT NULL`
        )
      );
    const commentsReceived = commentsReceivedResult?.count || 0;

    return NextResponse.json({
      profile: {
        id: profile.id,
        name: profile.name,
        avatarUrl: profile.avatarUrl,
      },
      stats: {
        votesReceived,
        votesGiven,
        votesThisWeek,
        rank,
        totalParticipants: leaderboard.length,
        commentsReceived,
      },
      topHaters: topHaters.map((h) => ({
        id: h.oderId,
        name: h.voterName,
        avatarUrl: h.voterAvatar,
        count: h.count,
      })),
      topTargets: topTargets.map((t) => ({
        id: t.targetId,
        name: t.targetName,
        avatarUrl: t.targetAvatar,
        count: t.count,
      })),
      recentActivity: recentActivity.map((v) => ({
        id: v.id,
        createdAt: v.createdAt.toISOString(),
        comment: v.comment,
        type: v.voterId === id ? "given" : "received",
        voter: {
          id: v.voter.id,
          name: v.voter.name,
          avatarUrl: v.voter.avatarUrl,
        },
        candidate: {
          id: v.candidate.id,
          name: v.candidate.name,
          avatarUrl: v.candidate.avatarUrl,
        },
      })),
      mutualRivalries: ((mutualRivalries as unknown as { rows: unknown[] }).rows || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        avatarUrl: r.avatar_url,
        votesGiven: r.votes_given,
        votesReceived: r.votes_received,
        total: r.total,
      })),
      funStats: {
        mostActiveDay: ((mostActiveDay as unknown as { rows: unknown[] }).rows?.[0] as any)?.day_name?.trim() || null,
      },
    });
  } catch (error) {
    console.error("Error fetching participant:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
