import type { ReactNode } from 'react';
import { theme } from './theme';

export type EmailLang = 'es' | 'en';

export function normalizeEmailLang(value: unknown): EmailLang {
  return value === 'en' ? 'en' : 'es';
}

interface LayoutStrings {
  htmlLang: string;
  tagline: string;
  footer: string;
}

interface ContactConfirmationStrings {
  subject: string;
  preview: (name: string) => string;
  eyebrow: string;
  heading: (name: string) => string;
  intro: (email: string) => ReactNode;
  requestEyebrow: string;
  fieldService: string;
  fieldBudget: string;
  messageEyebrow: string;
  outro: string;
}

interface OrderDeliveryStrings {
  subject: string;
  preview: string;
  eyebrow: string;
  heading: string;
  intro: string;
  referenceLabel: string;
  downloadButton: string;
  totalLabel: string;
  expiryNote: (days: number, max: number) => ReactNode;
  helpNote: (shopUrl: string) => ReactNode;
}

interface ReplyStrings {
  preview: string;
  originalMessageEyebrow: string;
}

interface EmailMessages {
  layout: LayoutStrings;
  contactConfirmation: ContactConfirmationStrings;
  orderDelivery: OrderDeliveryStrings;
  reply: ReplyStrings;
}

const es: EmailMessages = {
  layout: {
    htmlLang: 'es',
    tagline: 'Diseño editorial',
    footer: 'Madame Ardent — Diseño editorial para novelas.',
  },
  contactConfirmation: {
    subject: 'Hemos recibido tu solicitud — Madame Ardent',
    preview: (name) => `Recibimos tu mensaje, ${name}. Te respondemos en breve.`,
    eyebrow: 'Confirmación',
    heading: (name) => `Gracias, ${name}.`,
    intro: (email) => (
      <>
        Recibí tu solicitud y la revisaré con detenimiento. En breve te
        responderé al correo <strong>{email}</strong> con los próximos pasos.
      </>
    ),
    requestEyebrow: 'Tu solicitud',
    fieldService: 'Servicio',
    fieldBudget: 'Presupuesto',
    messageEyebrow: 'Tu mensaje',
    outro: 'Si necesitas añadir algo más, responde directamente a este correo.',
  },
  orderDelivery: {
    subject: 'Tu pedido está listo — Madame Ardent',
    preview: 'Tu pedido está listo. Descarga tus archivos.',
    eyebrow: 'Tu pedido',
    heading: '¡Gracias por tu compra!',
    intro:
      'Hemos recibido tu pago correctamente. A continuación tienes los enlaces de descarga para los productos que has comprado.',
    referenceLabel: 'Referencia',
    downloadButton: 'Descargar',
    totalLabel: 'Total pagado',
    expiryNote: (days, max) => (
      <>
        Los enlaces son válidos durante <strong>{days} días</strong> y permiten
        un máximo de <strong>{max} descargas</strong> por producto. Guarda los
        archivos en un lugar seguro tras descargarlos.
      </>
    ),
    helpNote: (shopUrl) => (
      <>
        ¿Algún problema con tu descarga? Responde directamente a este correo y te
        ayudo en cuanto pueda. También puedes seguir explorando recursos en{' '}
        <a href={shopUrl} style={{ color: theme.colors.primary }}>
          la tienda
        </a>
        .
      </>
    ),
  },
  reply: {
    preview: 'Respuesta de Madame Ardent',
    originalMessageEyebrow: 'Mensaje original',
  },
};

const en: EmailMessages = {
  layout: {
    htmlLang: 'en',
    tagline: 'Editorial design',
    footer: 'Madame Ardent — Editorial design for novels.',
  },
  contactConfirmation: {
    subject: "We've received your request — Madame Ardent",
    preview: (name) => `We received your message, ${name}. We'll get back to you shortly.`,
    eyebrow: 'Confirmation',
    heading: (name) => `Thank you, ${name}.`,
    intro: (email) => (
      <>
        I've received your request and will review it carefully. I'll reply
        shortly to <strong>{email}</strong> with the next steps.
      </>
    ),
    requestEyebrow: 'Your request',
    fieldService: 'Service',
    fieldBudget: 'Budget',
    messageEyebrow: 'Your message',
    outro: 'If you need to add anything else, just reply directly to this email.',
  },
  orderDelivery: {
    subject: 'Your order is ready — Madame Ardent',
    preview: 'Your order is ready. Download your files.',
    eyebrow: 'Your order',
    heading: 'Thank you for your purchase!',
    intro:
      'We have received your payment successfully. Below are the download links for the products you purchased.',
    referenceLabel: 'Reference',
    downloadButton: 'Download',
    totalLabel: 'Total paid',
    expiryNote: (days, max) => (
      <>
        The links are valid for <strong>{days} days</strong> and allow a maximum
        of <strong>{max} downloads</strong> per product. Save the files
        somewhere safe once you've downloaded them.
      </>
    ),
    helpNote: (shopUrl) => (
      <>
        Any trouble with your download? Reply directly to this email and I'll
        help you as soon as I can. You can also keep exploring resources in{' '}
        <a href={shopUrl} style={{ color: theme.colors.primary }}>
          the shop
        </a>
        .
      </>
    ),
  },
  reply: {
    preview: 'A reply from Madame Ardent',
    originalMessageEyebrow: 'Original message',
  },
};

const messages: Record<EmailLang, EmailMessages> = { es, en };

export function emailMessages(lang: EmailLang): EmailMessages {
  return messages[lang];
}
