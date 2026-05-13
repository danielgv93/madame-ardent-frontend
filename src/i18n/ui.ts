import es from './es.json';
import en from './en.json';

export const languages = {
  es: 'Español',
  en: 'English',
} as const;

export const defaultLang = 'es' as const;

export type Lang = keyof typeof languages;

export const ui = { es, en } as const;

export type UI = typeof es;
