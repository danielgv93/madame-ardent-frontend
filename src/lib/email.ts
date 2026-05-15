import nodemailer from 'nodemailer';
import { render } from 'react-email';
import type { ContactFormInput } from '../types/index.js';
import ContactNotification from '../emails/ContactNotification';
import ContactConfirmation from '../emails/ContactConfirmation';
import ReplyEmail from '../emails/ReplyEmail';
import OrderDelivery, { type OrderDeliveryProps } from '../emails/OrderDelivery';
import { emailMessages, type EmailLang } from '../emails/i18n';

interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

function getSmtpConfig(): SmtpConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
  };
}

function getRecipientEmail(): string {
  return process.env.RECIPIENT_EMAIL || '';
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

export async function buildReplyEmailHtml(
  bodyHtml: string,
  originalMessage: string,
  lang: EmailLang,
): Promise<string> {
  return render(ReplyEmail({ bodyHtml, originalMessage, lang }));
}

export async function sendContactFormConfirmation(data: ContactFormInput, lang: EmailLang): Promise<void> {
  const html = await render(ContactConfirmation({ data, lang }));
  await sendEmail({
    to: data.email,
    subject: emailMessages(lang).contactConfirmation.subject,
    html,
    fromName: 'Madame Ardent',
  });
}

export async function sendOrderDeliveryEmail(props: OrderDeliveryProps): Promise<void> {
  const html = await render(OrderDelivery(props));
  await sendEmail({
    to: props.customerEmail,
    subject: emailMessages(props.lang).orderDelivery.subject,
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
