import { NextResponse } from "next/server";
import { db } from "@/db";
import { inviteCodes } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Codigo de convite obrigatorio" },
        { status: 400 }
      );
    }

    // Check if invite code exists and hasn't been used
    const invite = await db
      .select()
      .from(inviteCodes)
      .where(and(eq(inviteCodes.code, code.toUpperCase()), isNull(inviteCodes.usedBy)))
      .limit(1);

    if (invite.length === 0) {
      return NextResponse.json(
        { error: "Codigo invalido ou ja utilizado" },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Error verifying invite:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
