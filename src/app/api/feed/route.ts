import { NextResponse } from "next/server";
import { db } from "@/db";
import { votes, profiles } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const currentYear = new Date().getFullYear();

    // Create aliases for the profiles table
    const voters = db
      .select({
        id: profiles.id,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .as("voters");

    const candidates = db
      .select({
        id: profiles.id,
        name: profiles.name,
        avatarUrl: profiles.avatarUrl,
      })
      .from(profiles)
      .as("candidates");

    // Get recent votes with voter and candidate info
    const feed = await db
      .select({
        id: votes.id,
        createdAt: votes.createdAt,
        voter: {
          id: sql<string>`voters.id`,
          name: sql<string>`voters.name`,
          avatarUrl: sql<string | null>`voters.avatar_url`,
        },
        candidate: {
          id: sql<string>`candidates.id`,
          name: sql<string>`candidates.name`,
          avatarUrl: sql<string | null>`candidates.avatar_url`,
        },
      })
      .from(votes)
      .innerJoin(voters, eq(votes.voterId, sql`voters.id`))
      .innerJoin(candidates, eq(votes.candidateId, sql`candidates.id`))
      .where(eq(votes.year, currentYear))
      .orderBy(desc(votes.createdAt))
      .limit(limit);

    return NextResponse.json(feed);
  } catch (error) {
    console.error("Error fetching feed:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
