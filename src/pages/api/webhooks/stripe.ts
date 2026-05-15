import type { APIRoute } from 'astro';
import type Stripe from 'stripe';
import prisma from '../../../lib/prisma';
import { createJsonResponse } from '../../../lib/api-response';
import { getStripe, getWebhookSecret, getPublicSiteUrl } from '../../../lib/shop/stripe';
import {
  buildExpirationDate,
  generateToken,
  getDefaultDownloadConfig,
} from '../../../lib/shop/download-tokens';
import { sendOrderDeliveryEmail } from '../../../lib/email';
import { formatPrice, type Currency } from '../../../lib/shop/currency';
import { fromCents } from '../../../lib/shop/order-server';

export const prerender = false;

async function fulfillOrder(orderId: string, session: Stripe.Checkout.Session): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) {
    console.warn('[stripe webhook] order not found:', orderId);
    return;
  }
  if (order.status === 'paid' || order.status === 'delivered') {
    return;
  }

  const paidEmail = session.customer_details?.email?.toLowerCase() ?? order.email;
  const { expirationDays, maxDownloads } = getDefaultDownloadConfig();
  const expiresAt = buildExpirationDate(expirationDays);

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        paidAt: new Date(),
        email: paidEmail,
        stripeSessionId: session.id,
      },
    });

    for (const item of order.items) {
      if (!item.fileKey) continue;
      await tx.download.create({
        data: {
          orderItemId: item.id,
          token: generateToken(),
          expiresAt,
          maxDownloads,
        },
      });
    }
  });

  const downloads = await prisma.download.findMany({
    where: { orderItem: { orderId } },
    include: { orderItem: true },
  });

  const baseUrl = getPublicSiteUrl();
  const currency = order.currency as Currency;
  const totalFormatted = formatPrice(fromCents(order.total), currency, 'es');

  const emailItems = order.items.map((item) => {
    const dl = downloads.find((d) => d.orderItemId === item.id);
    return {
      title: item.productTitle,
      quantity: item.quantity,
      downloadUrl: dl ? `${baseUrl}/api/download/${dl.token}` : `${baseUrl}/tienda`,
    };
  });

  try {
    await sendOrderDeliveryEmail({
      orderId: order.id,
      customerEmail: paidEmail,
      totalFormatted,
      items: emailItems,
      expirationDays,
      maxDownloads,
      shopUrl: `${baseUrl}/tienda`,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'delivered' },
    });
  } catch (err) {
    console.error(`[stripe webhook] failed to send delivery email for order ${order.id}:`, err);
  }
}

async function handleAsyncFailed(session: Stripe.Checkout.Session): Promise<void> {
  const orderId = session.metadata?.orderId ?? session.client_reference_id;
  if (!orderId) return;
  await prisma.order
    .updateMany({ where: { id: orderId, status: 'pending' }, data: { status: 'failed' } })
    .catch((err) => console.error('[stripe webhook] failed to mark order failed:', err));
}

export const POST: APIRoute = async ({ request }) => {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return createJsonResponse({ error: 'Missing stripe-signature header' }, 400);
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(rawBody, signature, getWebhookSecret());
  } catch (err) {
    console.error('[stripe webhook] signature verification failed:', err);
    return createJsonResponse({ error: 'Invalid signature' }, 400);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId ?? session.client_reference_id;
        if (orderId) await fulfillOrder(orderId, session);
        else console.warn('[stripe webhook] session without orderId metadata', session.id);
        break;
      }
      case 'checkout.session.async_payment_failed':
        await handleAsyncFailed(event.data.object as Stripe.Checkout.Session);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[stripe webhook] handler failed for ${event.type}:`, err);
    return createJsonResponse({ error: 'Handler error' }, 500);
  }

  return createJsonResponse({ received: true });
};
