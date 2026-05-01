import nodemailer from 'nodemailer';
import type { ContactFormData } from '../types/index.js';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

function getSmtpConfig(): SmtpConfig {
  return {
    host: import.meta.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(import.meta.env.SMTP_PORT || '587'),
    user: import.meta.env.SMTP_USER || '',
    password: import.meta.env.SMTP_PASSWORD || '',
  };
}

function getRecipientEmail(): string {
  return import.meta.env.RECIPIENT_EMAIL || '';
}

function createTransporter() {
  const config = getSmtpConfig();
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

function buildContactNotificationHtml(data: ContactFormData): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px;">
      <div style="background-color: #ffffff; border-radius: 8px; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h1 style="color: #6b21a8; margin-top: 0; border-bottom: 2px solid #e9d5ff; padding-bottom: 10px;">
          Nueva solicitud de contacto
        </h1>
        <p style="color: #666; font-size: 14px;">
          Recibido el ${new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 13px; width: 140px;">Nombre</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${escapeHtml(data.name)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 13px;">Usuario</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${escapeHtml(data.user)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 13px;">Email</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
              <a href="mailto:${escapeHtml(data.email)}" style="color: #6b21a8;">${escapeHtml(data.email)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 13px;">País</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${escapeHtml(data.country)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee; color: #999; font-size: 13px;">Servicio</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">
              <span style="background-color: #f3e8ff; color: #6b21a8; padding: 4px 10px; border-radius: 12px; font-size: 13px;">
                ${escapeHtml(data.services)}
              </span>
            </td>
          </tr>
        </table>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #e9d5ff;">
          <p style="color: #999; font-size: 13px; margin-bottom: 5px;">Mensaje:</p>
          <p style="background-color: #f9f5ff; padding: 15px; border-radius: 6px; line-height: 1.6; color: #333;">
            ${escapeHtml(data.message).replace(/\n/g, '<br>')}
          </p>
        </div>
        <div style="margin-top: 25px; text-align: center;">
          <a href="${import.meta.env.SITE_URL || 'https://madame-ardent.com'}/dashboard/forms"
             style="background-color: #6b21a8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
            Ver en el panel
          </a>
        </div>
      </div>
      <p style="text-align: center; color: #999; font-size: 12px; margin-top: 15px;">
        Este email se generó automáticamente desde el formulario de contacto de Madame Ardent.
      </p>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

export async function sendContactFormNotification(data: ContactFormData): Promise<void> {
  const recipientEmail = getRecipientEmail();
  const smtpConfig = getSmtpConfig();
  if (!recipientEmail || !smtpConfig.user || !smtpConfig.password) {
    console.warn('Email configuration missing. Skipping notification email.');
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Madame Ardent - Contacto" <${smtpConfig.user}>`,
    to: recipientEmail,
    subject: `Nueva solicitud: ${data.services} — ${data.name}`,
    html: buildContactNotificationHtml(data),
    replyTo: data.email,
  });
}
