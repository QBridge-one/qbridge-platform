import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const TO_EMAIL = process.env.CONTACT_FORM_TO_EMAIL ?? "contact@qbridge.one";
const FROM_EMAIL = process.env.ZOHO_SMTP_USER ?? "contact@qbridge.one";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, message } = body;

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    const user = process.env.ZOHO_SMTP_USER?.trim();
    const pass = process.env.ZOHO_SMTP_PASS?.trim();

    if (!user || !pass) {
      return NextResponse.json(
        { error: "Email service not configured. Add ZOHO_SMTP_USER and ZOHO_SMTP_PASS to .env." },
        { status: 500 }
      );
    }

    const host = process.env.ZOHO_SMTP_HOST ?? "smtppro.zohocloud.ca";
    const transporter = nodemailer.createTransport({
      host,
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject: `QBridge Contact: ${name}${company ? ` (${company})` : ""}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ""}
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
