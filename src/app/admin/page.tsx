import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { profiles, winners } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { AdminPanel } from "./admin-panel";

async function getProfile(userId: string) {
  const result = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return result[0] || null;
}

async function getAllowedPhones() {
  const result = await db.execute(
    sql`SELECT * FROM allowed_phones ORDER BY created_at DESC`
  );
  // Result can be array or object with rows property depending on driver
  if (Array.isArray(result)) {
    return result;
  }
  return (result as unknown as { rows: unknown[] }).rows || [];
}

async function getPastWinners() {
  return db.query.winners.findMany({
    orderBy: desc(winners.year),
    with: {
      user: true,
    },
  });
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfile(user.id);

  if (!profile || !profile.isAdmin) {
    redirect("/");
  }

  const [allowedPhones, pastWinners] = await Promise.all([
    getAllowedPhones(),
    getPastWinners(),
  ]);

  const formattedWinners = pastWinners.map((w) => ({
    id: w.id,
    year: w.year,
    totalVotes: w.totalVotes,
    user: {
      id: w.user.id,
      name: w.user.name,
      avatarUrl: w.user.avatarUrl,
    },
  }));

  return (
    <AdminPanel
      allowedPhones={allowedPhones as { id: string; phone: string; name: string; is_admin: boolean }[]}
      pastWinners={formattedWinners}
    />
  );
}
