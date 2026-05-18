// ============================================================
// lib/adapters/email/console.adapter.ts
// EmailPort that logs to stdout. Active in dev when RESEND_API_KEY
// is missing — lets the notification dispatcher run end-to-end
// without burning real sends.
// ============================================================

import "server-only";

import type { EmailMessage, EmailPort, EmailSendResult } from "../../ports/email.port";

class ConsoleEmailAdapter implements EmailPort {
  async send(message: EmailMessage): Promise<EmailSendResult> {
    const to = Array.isArray(message.to) ? message.to.join(", ") : message.to;
    // One line so it's easy to grep in dev logs; full HTML follows
    // on subsequent lines for visual confirmation.
    console.log(
      `[email:console] from=${message.from ?? "(default)"} to=${to} subject=${JSON.stringify(message.subject)}`,
    );
    if (message.text) console.log(message.text);
    else console.log(message.html);
    return { id: "" };
  }
}

export const consoleEmailAdapter = new ConsoleEmailAdapter();
