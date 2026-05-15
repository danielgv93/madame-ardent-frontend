import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { getPublicSiteUrl } from '../lib/shop/stripe';

export const prerender = false;

const STATIC_ROUTES: Array<{ es: string; en: string; changefreq: string; priority: string }> = [
  { es: '/', en: '/en', changefreq: 'weekly', priority: '1.0' },
  { es: '/sobre-mi', en: '/en/about-me', changefreq: 'monthly', priority: '0.7' },
  { es: '/servicios', en: '/en/services', changefreq: 'monthly', priority: '0.8' },
  { es: '/servicios/ilustracion', en: '/en/services/illustration', changefreq: 'monthly', priority: '0.6' },
  { es: '/servicios/mapas', en: '/en/services/maps', changefreq: 'monthly', priority: '0.6' },
  { es: '/servicios/maquetacion-interior', en: '/en/services/interior-layout', changefreq: 'monthly', priority: '0.6' },
  { es: '/servicios/pack-360', en: '/en/services/pack-360', changefreq: 'monthly', priority: '0.6' },
  { es: '/servicios/portadas', en: '/en/services/book-covers', changefreq: 'monthly', priority: '0.6' },
  { es: '/portfolio', en: '/en/portfolio', changefreq: 'monthly', priority: '0.7' },
  { es: '/tienda', en: '/en/shop', changefreq: 'weekly', priority: '0.9' },
  { es: '/contacto', en: '/en/contact', changefreq: 'yearly', priority: '0.5' },
];

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc: string, alternates: { hreflang: string; href: string }[], changefreq: string, priority: string, lastmod?: string): string {
  const alts = alternates
    .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${xmlEscape(a.href)}" />`)
    .join('\n');
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ''}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
${alts}
  </url>`;
}

export const GET: APIRoute = async () => {
  const base = getPublicSiteUrl();
  const products = await getCollection('products', ({ data }) => data.active);

  const entries: string[] = [];

  for (const route of STATIC_ROUTES) {
    const esUrl = `${base}${route.es}`;
    const enUrl = `${base}${route.en}`;
    const alternates = [
      { hreflang: 'es', href: esUrl },
      { hreflang: 'en', href: enUrl },
    ];
    entries.push(urlEntry(esUrl, alternates, route.changefreq, route.priority));
    entries.push(urlEntry(enUrl, alternates, route.changefreq, route.priority));
  }

  for (const p of products) {
    const esUrl = `${base}/tienda/${p.id}`;
    const enUrl = `${base}/en/shop/${p.id}`;
    const alternates = [
      { hreflang: 'es', href: esUrl },
      { hreflang: 'en', href: enUrl },
    ];
    const lastmod = p.data.createdAt instanceof Date ? p.data.createdAt.toISOString().split('T')[0] : undefined;
    entries.push(urlEntry(esUrl, alternates, 'weekly', '0.8', lastmod));
    entries.push(urlEntry(enUrl, alternates, 'weekly', '0.8', lastmod));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
