import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles, inviteCodes } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST() {
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

    // Generate unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, code))
        .limit(1);

      if (existing.length === 0) break;
      code = generateCode();
      attempts++;
    }

    // Create invite code
    const [invite] = await db
      .insert(inviteCodes)
      .values({ code })
      .returning();

    return NextResponse.json(invite);
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET() {
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

    // Get all unused invite codes
    const codes = await db
      .select()
      .from(inviteCodes)
      .where(isNull(inviteCodes.usedBy))
      .orderBy(inviteCodes.createdAt);

    return NextResponse.json(codes);
  } catch (error) {
    console.error("Error fetching invites:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
