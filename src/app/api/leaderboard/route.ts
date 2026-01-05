import { NextResponse } from "next/server";
import { db } from "@/db";
import { votes, profiles } from "@/db/schema";
import { sql, desc } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const currentYear = new Date().getFullYear();

    // Get all profiles with their vote counts for the current year
    // Votes with comments are worth 5 points, without comments worth 1 point
    const leaderboard = await db
      .select({
        id: profiles.id,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
        voteCount: sql<number>`COALESCE(SUM(CASE WHEN ${votes.comment} IS NOT NULL THEN 5 ELSE 1 END), 0)::int`.as(
          "vote_count"
        ),
      })
      .from(profiles)
      .leftJoin(
        votes,
        sql`${votes.candidateId} = ${profiles.id} AND ${votes.year} = ${currentYear}`
      )
      .groupBy(profiles.id)
      .orderBy(desc(sql`vote_count`), profiles.name);

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
