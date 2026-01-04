import { NextResponse } from "next/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
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

    const { phone, name } = await request.json();

    if (!phone || !name) {
      return NextResponse.json(
        { error: "Telefone e nome sao obrigatorios" },
        { status: 400 }
      );
    }

    // Add to allowed phones
    const result = await db.execute(
      sql`INSERT INTO allowed_phones (phone, name) VALUES (${phone}, ${name}) RETURNING *`
    );

    const rows = Array.isArray(result) ? result : (result as unknown as { rows: unknown[] }).rows || [];
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error("Error adding phone:", error);
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

    // Get all allowed phones
    const result = await db.execute(
      sql`SELECT * FROM allowed_phones ORDER BY created_at DESC`
    );

    const rows = Array.isArray(result) ? result : (result as unknown as { rows: unknown[] }).rows || [];
    return NextResponse.json(rows);
  } catch (error) {
    console.error("Error fetching phones:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
