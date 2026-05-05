/**
 * Shared SMTP transporter — single source of truth for all email sending.
 *
 * Reads configuration from environment variables:
 *   SMTP_HOST         — mail server hostname (e.g. smtp.gmail.com)
 *   SMTP_PORT         — port number (465 = SSL/TLS, 587 = STARTTLS, 25 = plain)
 *   SMTP_USER         — login username (usually the full email address)
 *   SMTP_PASS         — login password or App Password
 *   SMTP_FROM_EMAIL   — the From address on all outgoing emails
 *   SMTP_SKIP_SSL_VERIFY — set to "true" to disable TLS cert verification
 *                          (only for self-signed certs; not recommended in production)
 */
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
export const SMTP_FROM_EMAIL =
  process.env.SMTP_FROM_EMAIL || "noreply@printcartel.co.za";
const SKIP_SSL = process.env.SMTP_SKIP_SSL_VERIFY === "true";

// Port 465 uses implicit TLS (secure: true).
// All other ports use STARTTLS / plain (secure: false).
const useSecure = SMTP_PORT === 465;

let _transporter: nodemailer.Transporter | null = null;

export function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: useSecure,
      auth:
        SMTP_USER && SMTP_PASS
          ? { user: SMTP_USER, pass: SMTP_PASS }
          : undefined,
      tls: {
        // Allow self-signed certs when explicitly opted in
        rejectUnauthorized: !SKIP_SSL,
      },
    });
  }
  return _transporter;
}

/** Reset the cached transporter (useful after env var changes in tests). */
export function resetTransporter(): void {
  _transporter = null;
}

/**
 * Convenience wrapper — send an email and return true on success.
 * Errors are logged but not re-thrown so callers can treat email as best-effort.
 */
export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: nodemailer.SendMailOptions["attachments"];
}): Promise<boolean> {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn("[mailer] SMTP credentials not configured — email not sent");
    return false;
  }
  try {
    const result = await getTransporter().sendMail({
      from: SMTP_FROM_EMAIL,
      ...options,
    });
    console.log(`[mailer] ✓ Email sent to ${options.to}`, result.messageId);
    return true;
  } catch (error) {
    console.error("[mailer] ✗ Email send failed:", error);
    return false;
  }
}

/**
 * Test the SMTP connection without sending an email.
 * Returns { ok: true } on success or { ok: false, error: string } on failure.
 */
export async function testSmtpConnection(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  try {
    await getTransporter().verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
