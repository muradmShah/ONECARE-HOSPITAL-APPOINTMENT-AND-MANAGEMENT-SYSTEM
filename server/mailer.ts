import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import { db } from './db.ts';

export type EmailCategory =
  | 'invite'
  | 'confirmation'
  | 'cancellation'
  | 'rejection'
  | 'reschedule'
  | 'reminder';

export interface OutgoingEmailInput {
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  category: EmailCategory;
  eventKey?: string;
  actionPath?: string;
}

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_HOST.trim());
}

export async function sendClinicEmail(
  input: OutgoingEmailInput
): Promise<{ sent: boolean; deduplicated: boolean }> {
  if (input.eventKey) {
    const existing = db
      .prepare('SELECT id FROM email_outbox WHERE event_key = ?')
      .get(input.eventKey) as { id: string } | undefined;
    if (existing) {
      return { sent: false, deduplicated: true };
    }
  }

  let deliveryStatus: 'sent' | 'queued_preview' = 'queued_preview';

  if (isSmtpConfigured()) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT || 587) === 465,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'RaahHealth Clinic <noreply@raahhealth.local>',
        to: input.recipientEmail,
        subject: input.subject,
        text: input.body,
      });
      deliveryStatus = 'sent';
    } catch (err) {
      console.error('SMTP dispatch failed, recorded in preview outbox:', err);
      deliveryStatus = 'queued_preview';
    }
  }

  try {
    db.prepare(
      `INSERT INTO email_outbox (
        id, recipient_email, recipient_name, subject, body,
        category, event_key, delivery_status, action_path, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `mail-${crypto.randomUUID()}`,
      input.recipientEmail,
      input.recipientName,
      input.subject,
      input.body,
      input.category,
      input.eventKey ?? null,
      deliveryStatus,
      input.actionPath ?? '',
      new Date().toISOString()
    );
  } catch (err) {
    if (String(err).includes('UNIQUE constraint failed')) {
      return { sent: false, deduplicated: true };
    }
    throw err;
  }

  return { sent: true, deduplicated: false };
}
