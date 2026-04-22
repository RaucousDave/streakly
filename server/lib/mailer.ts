import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  console.log("Attempting to send email to", to);
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "Streakly <onboarding@resend.dev>",
    to,
    subject,
    html,
  });

  if (data) console.log("Resend Success ID:", data.id);
  if (error) {
    console.error("[Resend error]", error);
    throw new Error(error.message);
  }

  return data;
}
