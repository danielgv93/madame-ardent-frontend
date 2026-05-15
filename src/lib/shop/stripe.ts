import Stripe from 'stripe';

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  cached = new Stripe(secret, {
    apiVersion: '2025-09-30.clover',
    typescript: true,
  });
  return cached;
}

export function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  return secret;
}

export function getPublicSiteUrl(): string {
  const url = process.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';
  return url.replace(/\/$/, '');
}
