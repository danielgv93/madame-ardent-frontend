import { ui, defaultLang, type Lang, type UI } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, maybeLang] = url.pathname.split('/');
  if (maybeLang in ui) return maybeLang as Lang;
  return defaultLang;
}

type DeepValue<T, K extends string> = K extends `${infer A}.${infer B}`
  ? A extends keyof T
    ? DeepValue<T[A], B>
    : never
  : K extends keyof T
    ? T[K]
    : never;

type Paths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends object
    ? T[K] extends readonly unknown[]
      ? `${Prefix}${K}`
      : `${Prefix}${K}` | Paths<T[K], `${Prefix}${K}.`>
    : `${Prefix}${K}`;
}[keyof T & string];

export type TKey = Paths<UI>;

export function useTranslations(lang: Lang) {
  const dict = ui[lang];
  return function t<K extends TKey>(key: K): DeepValue<UI, K> {
    const parts = key.split('.');
    let value: unknown = dict;
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = (value as Record<string, unknown>)[part];
      } else {
        return key as unknown as DeepValue<UI, K>;
      }
    }
    return value as DeepValue<UI, K>;
  };
}

const routeMap: Record<string, { es: string; en: string }> = {
  home: { es: '/', en: '/en/' },
  portfolio: { es: '/portfolio', en: '/en/portfolio' },
  about: { es: '/sobre-mi', en: '/en/about-me' },
  contact: { es: '/contacto', en: '/en/contact' },
  services: { es: '/servicios', en: '/en/services' },
  pack360: { es: '/servicios/pack-360', en: '/en/services/pack-360' },
  covers: { es: '/servicios/portadas', en: '/en/services/book-covers' },
  interiorLayout: { es: '/servicios/maquetacion-interior', en: '/en/services/interior-layout' },
  illustration: { es: '/servicios/ilustracion', en: '/en/services/illustration' },
  maps: { es: '/servicios/mapas', en: '/en/services/maps' },
  coverCreator: { es: '/creador-de-portadas', en: '/en/cover-creator' },
};

export type RouteKey = keyof typeof routeMap;

export function localizedRoute(key: RouteKey, lang: Lang): string {
  return routeMap[key][lang];
}

function normalizePath(p: string): string {
  if (p === '/' || p === '/en' || p === '/en/') return p === '/' ? '/' : '/en/';
  return p.replace(/\/$/, '');
}

export function getAlternateUrl(currentUrl: URL, targetLang: Lang): string {
  const path = normalizePath(currentUrl.pathname);
  for (const entry of Object.values(routeMap)) {
    if (normalizePath(entry.es) === path || normalizePath(entry.en) === path) {
      return entry[targetLang];
    }
  }
  return targetLang === 'es' ? '/' : '/en/';
}
