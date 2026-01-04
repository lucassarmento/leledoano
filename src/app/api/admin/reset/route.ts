import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, votes, winners } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    // Check if user is admin
    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile.length === 0 || !profile[0].isAdmin) {
      return NextResponse.json({ error: "Nao autorizado" }, { status: 403 });
    }

    const { year } = await request.json();
    const targetYear = year || new Date().getFullYear();

    // Get the winner (most votes)
    const leaderboard = await db
      .select({
        userId: profiles.id,
        voteCount: sql<number>`COUNT(${votes.id})::int`.as("vote_count"),
      })
      .from(profiles)
      .leftJoin(
        votes,
        sql`${votes.candidateId} = ${profiles.id} AND ${votes.year} = ${targetYear}`
      )
      .groupBy(profiles.id)
      .orderBy(desc(sql`vote_count`))
      .limit(1);

    if (leaderboard.length > 0 && leaderboard[0].voteCount > 0) {
      // Archive the winner
      await db.insert(winners).values({
        userId: leaderboard[0].userId,
        year: targetYear,
        totalVotes: leaderboard[0].voteCount,
      });
    }

    // Delete all votes for the year
    await db.delete(votes).where(eq(votes.year, targetYear));

    return NextResponse.json({
      success: true,
      winner: leaderboard[0] || null,
      year: targetYear,
    });
  } catch (error) {
    console.error("Error resetting year:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
