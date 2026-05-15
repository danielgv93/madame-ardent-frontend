import type { Lang } from '../../i18n/ui';

export const SUPPORTED_CURRENCIES = ['EUR', 'USD'] as const;
export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY_BY_LANG: Record<Lang, Currency> = {
  es: 'EUR',
  en: 'USD',
};

const localeByLang: Record<Lang, string> = {
  es: 'es-ES',
  en: 'en-US',
};

export function formatPrice(amount: number, currency: Currency, lang: Lang): string {
  return new Intl.NumberFormat(localeByLang[lang], {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function isCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}
