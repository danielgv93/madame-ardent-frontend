import type { Currency } from './currency';

export interface ProductSummary {
  slug: string;
  title: string;
  shortDescription: string;
  price: Record<Currency, number>;
  image: string;
  category: string;
}
