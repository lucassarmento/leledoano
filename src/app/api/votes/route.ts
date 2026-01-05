import { NextResponse } from "next/server";
import { db } from "@/db";
import { votes, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { sendVoteNotificationSMS } from "@/lib/sms";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Nao autenticado" }, { status: 401 });
    }

    const { candidateId, comment } = await request.json();

    if (!candidateId) {
      return NextResponse.json(
        { error: "Candidato obrigatorio" },
        { status: 400 }
      );
    }

    // Validate comment length if provided
    if (comment && comment.length > 500) {
      return NextResponse.json(
        { error: "Comentario muito longo (max 500 caracteres)" },
        { status: 400 }
      );
    }

    // Verify voter has a profile
    const voterProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (voterProfile.length === 0) {
      return NextResponse.json(
        { error: "Perfil nao encontrado" },
        { status: 400 }
      );
    }

    // Verify candidate exists
    const candidateProfile = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, candidateId))
      .limit(1);

    if (candidateProfile.length === 0) {
      return NextResponse.json(
        { error: "Candidato nao encontrado" },
        { status: 400 }
      );
    }

    // Create vote
    const [newVote] = await db
      .insert(votes)
      .values({
        voterId: user.id,
        candidateId,
        comment: comment || null,
      })
      .returning();

    // Send SMS notification if vote has a comment
    if (comment && candidateProfile[0].phone) {
      sendVoteNotificationSMS({
        recipientPhone: candidateProfile[0].phone,
        recipientName: candidateProfile[0].name,
        voterName: voterProfile[0].name,
        comment,
      }).catch((err) => {
        // Log error but don't fail the vote
        console.error("Failed to send vote notification SMS:", err);
      });
    }

    return NextResponse.json({
      success: true,
      vote: newVote,
      voter: voterProfile[0],
      candidate: candidateProfile[0],
    });
  } catch (error) {
    console.error("Error creating vote:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
