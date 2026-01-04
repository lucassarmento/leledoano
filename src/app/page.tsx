import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, votes } from "@/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import { HomePage } from "./home";

async function getLeaderboard() {
  const currentYear = new Date().getFullYear();

  return db
    .select({
      id: profiles.id,
      name: profiles.name,
      avatarUrl: profiles.avatarUrl,
      voteCount: sql<number>`COALESCE(COUNT(${votes.id}), 0)::int`.as(
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
}

async function getFeed() {
  const currentYear = new Date().getFullYear();

  return db.query.votes.findMany({
    where: eq(votes.year, currentYear),
    orderBy: desc(votes.createdAt),
    limit: 20,
    with: {
      voter: true,
      candidate: true,
    },
  });
}

async function getProfile(userId: string) {
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return result[0] || null;
}

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);

  // If user is authenticated but has no profile, create it from allowed_phones
  if (!profile) {
    // Get user's phone from Supabase auth
    const phone = user.phone;
    if (phone) {
      // Check allowed_phones for this user's info
      const allowedResult = await db.execute(
        sql`SELECT * FROM allowed_phones WHERE phone = ${phone} LIMIT 1`
      );
      const allowed = Array.isArray(allowedResult) ? allowedResult[0] : null;

      if (allowed) {
        // Auto-create profile from allowed_phones data
        await db.insert(profiles).values({
          id: user.id,
          name: (allowed as { name: string }).name,
          phone: phone,
          isAdmin: (allowed as { is_admin: boolean }).is_admin || false,
        }).onConflictDoNothing();

        // Refresh to load the new profile
        redirect("/");
      }
    }

    // If we still can't create a profile, sign out
    await supabase.auth.signOut();
    redirect("/login");
  }

  const [leaderboard, feed] = await Promise.all([getLeaderboard(), getFeed()]);

  const formattedFeed = feed.map((vote) => ({
    id: vote.id,
    createdAt: vote.createdAt.toISOString(),
    voter: {
      id: vote.voter.id,
      name: vote.voter.name,
      avatarUrl: vote.voter.avatarUrl,
    },
    candidate: {
      id: vote.candidate.id,
      name: vote.candidate.name,
      avatarUrl: vote.candidate.avatarUrl,
    },
  }));

  return (
    <HomePage
      leaderboard={leaderboard}
      feed={formattedFeed}
      currentUser={profile}
    />
  );
}
