import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Telefone obrigatorio" },
        { status: 400 }
      );
    }

    // Check if phone is in allowed list (postgres-js returns array directly)
    const result = await db.execute(
      sql`SELECT * FROM allowed_phones WHERE phone = ${phone} LIMIT 1`
    );

    const rows = Array.isArray(result) ? result : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Telefone nao autorizado. Fale com o admin." },
        { status: 403 }
      );
    }

    const allowedPhone = rows[0] as { name: string; is_admin: boolean };

    return NextResponse.json({
      valid: true,
      name: allowedPhone.name,
      isAdmin: allowedPhone.is_admin,
    });
  } catch (error) {
    console.error("Error verifying phone:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
