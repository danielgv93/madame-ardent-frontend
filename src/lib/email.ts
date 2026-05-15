import nodemailer from 'nodemailer';
import { render } from 'react-email';
import type { ContactFormInput } from '../types/index.js';
import ContactNotification from '../emails/ContactNotification';
import ContactConfirmation from '../emails/ContactConfirmation';
import ReplyEmail from '../emails/ReplyEmail';
import OrderDelivery, { type OrderDeliveryProps } from '../emails/OrderDelivery';

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

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  fromName?: string;
}

export async function sendEmail({ to, subject, html, replyTo, fromName = 'Madame Ardent' }: SendEmailParams): Promise<void> {
  const smtpConfig = getSmtpConfig();
  if (!smtpConfig.user || !smtpConfig.password) {
    console.error(
      `[email] SMTP configuration missing — host=${smtpConfig.host} port=${smtpConfig.port} user=${smtpConfig.user ? 'set' : 'EMPTY'} password=${smtpConfig.password ? 'set' : 'EMPTY'}`,
    );
    throw new Error('SMTP configuration missing (SMTP_USER / SMTP_PASSWORD)');
  }

  const transporter = createTransporter();

  console.info(`[email] sending mail to=${to} subject="${subject}" via ${smtpConfig.host}:${smtpConfig.port}`);
  const info = await transporter.sendMail({
    from: `"${fromName}" <${smtpConfig.user}>`,
    to,
    subject,
    html,
    ...(replyTo ? { replyTo } : {}),
  });
  console.info(`[email] sent messageId=${info.messageId} response="${info.response}" accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)}`);
}

export async function buildReplyEmailHtml(bodyHtml: string, originalMessage: string): Promise<string> {
  return render(ReplyEmail({ bodyHtml, originalMessage }));
}

export async function sendContactFormConfirmation(data: ContactFormInput): Promise<void> {
  const html = await render(ContactConfirmation({ data }));
  await sendEmail({
    to: data.email,
    subject: 'Hemos recibido tu solicitud — Madame Ardent',
    html,
    fromName: 'Madame Ardent',
  });
}

export async function sendOrderDeliveryEmail(props: OrderDeliveryProps): Promise<void> {
  const html = await render(OrderDelivery(props));
  await sendEmail({
    to: props.customerEmail,
    subject: 'Tu pedido está listo — Madame Ardent',
    html,
    fromName: 'Madame Ardent',
  });
}

export async function sendContactFormNotification(data: ContactFormInput): Promise<void> {
  const recipientEmail = getRecipientEmail();
  if (!recipientEmail) {
    console.warn('RECIPIENT_EMAIL missing. Skipping notification email.');
    return;
  }

  try {
    const html = await render(ContactNotification({ data }));
    await sendEmail({
      to: recipientEmail,
      subject: `Nueva solicitud: ${data.services} — ${data.name}`,
      html,
      replyTo: data.email,
      fromName: 'Madame Ardent - Contacto',
    });
  } catch (error) {
    console.warn('Skipping notification email:', (error as Error).message);
  }
}
