import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface SendVoteNotificationParams {
  recipientPhone: string;
  recipientName: string;
  voterName: string;
  comment: string;
}

export async function sendVoteNotificationSMS({
  recipientPhone,
  recipientName,
  voterName,
  comment,
}: SendVoteNotificationParams): Promise<{ success: boolean; error?: string }> {
  if (!client || !fromPhone) {
    console.warn("Twilio not configured, skipping SMS notification");
    return { success: false, error: "Twilio not configured" };
  }

  try {
    const message = `Opa ${recipientName}! Voce recebeu um voto de ${voterName} com a seguinte justificativa: "${comment}"`;

    await client.messages.create({
      body: message,
      from: fromPhone,
      to: recipientPhone,
    });

    console.log(`SMS sent to ${recipientPhone}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to send SMS:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
