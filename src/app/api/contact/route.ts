import nodemailer from "nodemailer";
import { links } from "@/config";
import { clientIp, tooMany } from "@/lib/rateLimit";
import { readSecret } from "@/lib/secrets";

const limits = { name: 100, email: 200, subject: 200, message: 5000 };
function text(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  if (tooMany("contact", clientIp(request), 3, 60 * 60 * 1000)) return Response.json({ error: "Too many messages. Try again later." }, { status: 429 });

  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid request." }, { status: 400 });
  if (body.website) return Response.json({ ok: true });

  const name = text(body.name, limits.name);
  const email = text(body.email, limits.email);
  const subject = text(body.subject, limits.subject) || "New message";
  const message = text(body.message, limits.message);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please fill in name, a valid email and a message." }, { status: 400 });
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, CONTACT_TO } = process.env;
  const SMTP_PASS = readSecret("SMTP_PASS");
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return Response.json({ error: "Contact form is not configured yet." }, { status: 503 });
  }

  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transport.sendMail({
      from: `"${name.replace(/["\r\n]/g, "")} via felix-pfeiffer.com" <${SMTP_USER}>`,
      to: CONTACT_TO ?? links.email,
      replyTo: email,
      subject: `[Portfolio] ${subject}`.replace(/[\r\n]/g, " "),
      text: `From: ${name} <${email}>\n\n${message}`,
    });
  } catch {
    return Response.json({ error: "Could not send the message. Please try again." }, { status: 502 });
  }
  return Response.json({ ok: true });
}
