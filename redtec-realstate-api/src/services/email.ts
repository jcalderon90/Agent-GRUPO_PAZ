import { Resend } from 'resend';
import { env } from '../config/env.js';

// Resend es opcional — solo inicializar si la key está configurada
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!resend) {
    console.warn('[EMAIL] RESEND_API_KEY not configured, skipping email');
    return false;
  }

  try {
    await resend.emails.send({
      from: options.from ?? `RedTec <${env.RESEND_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err);
    return false;
  }
}

// Template base con branding RedTec — usado por el login centralizado multi-tenant
export function buildEmailTemplate(title: string, body: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="margin:0; padding:0; background:#0E0E10;">
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #0E0E10; color: #F6F4F0; border-radius: 16px;">
        <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 11px; color: #C17A3A; font-weight: 700; margin: 0 0 16px;">RedTec</p>
        <h1 style="font-size: 20px; font-weight: 800; margin: 0 0 16px; color: #F6F4F0;">${title}</h1>
        <div style="font-size: 14px; line-height: 1.6; color: #cfcfd4;">${body}</div>
        <p style="margin-top: 32px; font-size: 11px; color: #555;">Powered by RedTec Systems</p>
      </div>
    </body>
    </html>
  `;
}
