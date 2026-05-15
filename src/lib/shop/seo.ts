import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../../i18n/ui';

interface BuildProductJsonLdArgs {
  product: CollectionEntry<'products'>;
  url: string;
  lang: Lang;
}

const CURRENCY_BY_LANG: Record<Lang, 'EUR' | 'USD'> = {
  es: 'EUR',
  en: 'USD',
};

export function buildProductJsonLd({
  product,
  url,
  lang,
}: BuildProductJsonLdArgs): Record<string, unknown> {
  const base = new URL(url);
  const currency = CURRENCY_BY_LANG[lang];
  const price = product.data.price[currency];
  const images = product.data.images.map((src) => new URL(src, base).toString());

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.data.title,
    description: product.data.shortDescription,
    image: images,
    sku: product.id,
    category: product.data.category,
    brand: {
      '@type': 'Brand',
      name: 'Madame Ardent',
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: currency,
      price: price.toFixed(2),
      availability: product.data.active
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}
