import { getCollection } from 'astro:content';
import type { Currency } from './currency';
import { SUPPORTED_CURRENCIES, toCents, fromCents } from './currency';

export { toCents, fromCents };

export interface OrderItemInput {
  slug: string;
  quantity: number;
}

export interface ValidatedOrderItem {
  slug: string;
  title: string;
  unitPriceCents: number;
  quantity: number;
  fileKey: string | null;
}

export interface ValidatedOrder {
  items: ValidatedOrderItem[];
  currency: Currency;
  subtotalCents: number;
  totalCents: number;
}

export class OrderValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'OrderValidationError';
  }
}

const MAX_QTY_PER_ITEM = 20;
const MAX_DISTINCT_ITEMS = 50;

export function isValidCurrency(value: unknown): value is Currency {
  return typeof value === 'string' && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export async function validateOrder(
  rawItems: unknown,
  rawCurrency: unknown,
): Promise<ValidatedOrder> {
  if (!isValidCurrency(rawCurrency)) {
    throw new OrderValidationError('Invalid currency', 'invalid_currency');
  }
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    throw new OrderValidationError('Cart is empty', 'empty_cart');
  }
  if (rawItems.length > MAX_DISTINCT_ITEMS) {
    throw new OrderValidationError('Too many items', 'too_many_items');
  }

  const normalized: OrderItemInput[] = [];
  const seenSlugs = new Set<string>();
  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') {
      throw new OrderValidationError('Malformed item', 'malformed_item');
    }
    const slug = (raw as { slug?: unknown }).slug;
    const quantity = (raw as { quantity?: unknown }).quantity;
    if (typeof slug !== 'string' || !slug.length) {
      throw new OrderValidationError('Item missing slug', 'missing_slug');
    }
    if (typeof quantity !== 'number' || !Number.isFinite(quantity) || quantity <= 0) {
      throw new OrderValidationError(`Invalid quantity for "${slug}"`, 'invalid_quantity');
    }
    const qty = Math.floor(quantity);
    if (qty > MAX_QTY_PER_ITEM) {
      throw new OrderValidationError(`Quantity too high for "${slug}"`, 'quantity_too_high');
    }
    if (seenSlugs.has(slug)) {
      throw new OrderValidationError(`Duplicate slug "${slug}"`, 'duplicate_slug');
    }
    seenSlugs.add(slug);
    normalized.push({ slug, quantity: qty });
  }

  const collection = await getCollection('products', ({ data }) => data.active);
  const bySlug = new Map(collection.map((p) => [p.id, p]));

  const validatedItems: ValidatedOrderItem[] = [];
  let subtotalCents = 0;

  for (const item of normalized) {
    const product = bySlug.get(item.slug);
    if (!product) {
      throw new OrderValidationError(`Product not available: "${item.slug}"`, 'product_unavailable');
    }
    const priceForCurrency = product.data.price[rawCurrency];
    if (typeof priceForCurrency !== 'number') {
      throw new OrderValidationError(`No price in ${rawCurrency} for "${item.slug}"`, 'missing_price');
    }
    const unitPriceCents = toCents(priceForCurrency);
    subtotalCents += unitPriceCents * item.quantity;
    validatedItems.push({
      slug: item.slug,
      title: product.data.title,
      unitPriceCents,
      quantity: item.quantity,
      fileKey: product.data.fileKey ?? null,
    });
  }

  return {
    items: validatedItems,
    currency: rawCurrency,
    subtotalCents,
    totalCents: subtotalCents,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new OrderValidationError('Email is required', 'missing_email');
  }
  const trimmed = value.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed) || trimmed.length > 254) {
    throw new OrderValidationError('Invalid email', 'invalid_email');
  }
  return trimmed;
}
