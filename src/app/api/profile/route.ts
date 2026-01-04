import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
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

    const { name, phone, isAdmin } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nome e telefone sao obrigatorios" },
        { status: 400 }
      );
    }

    // Upsert profile (create or update)
    await db
      .insert(profiles)
      .values({
        id: user.id,
        name,
        phone,
        isAdmin: isAdmin || false,
      })
      .onConflictDoUpdate({
        target: profiles.id,
        set: { name, phone, isAdmin: isAdmin || false },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error creating profile:", error);
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

    const profile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (profile.length === 0) {
      return NextResponse.json({ error: "Perfil nao encontrado" }, { status: 404 });
    }

    return NextResponse.json(profile[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
