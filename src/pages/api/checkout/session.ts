import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { createJsonResponse } from '../../../lib/api-response';
import { getStripe, getPublicSiteUrl } from '../../../lib/shop/stripe';

export const prerender = false;

interface CreateSessionBody {
  orderId?: unknown;
  lang?: unknown;
}

export const POST: APIRoute = async ({ request }) => {
  let body: CreateSessionBody;
  try {
    body = (await request.json()) as CreateSessionBody;
  } catch {
    return createJsonResponse({ error: 'Invalid JSON' }, 400);
  }

  const orderId = typeof body.orderId === 'string' ? body.orderId : null;
  const lang = body.lang === 'en' ? 'en' : 'es';
  if (!orderId) {
    return createJsonResponse({ error: 'orderId is required' }, 400);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order) {
    return createJsonResponse({ error: 'Order not found' }, 404);
  }
  if (order.status !== 'pending') {
    return createJsonResponse({ error: 'Order is not pending' }, 409);
  }
  if (order.items.length === 0) {
    return createJsonResponse({ error: 'Order has no items' }, 400);
  }

  const baseUrl = getPublicSiteUrl();
  const successPath = lang === 'es' ? '/tienda/gracias' : '/en/shop/thank-you';
  const cancelPath = lang === 'es' ? '/tienda/carrito' : '/en/shop/cart';

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      currency: order.currency.toLowerCase(),
      customer_email: order.email,
      client_reference_id: order.id,
      line_items: order.items.map((item) => ({
        price_data: {
          currency: order.currency.toLowerCase(),
          unit_amount: item.unitPrice,
          product_data: {
            name: item.productTitle,
            metadata: { slug: item.productSlug },
          },
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: order.id,
      },
      success_url: `${baseUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${cancelPath}`,
      locale: lang === 'es' ? 'es' : 'en',
      payment_intent_data: {
        metadata: { orderId: order.id },
      },
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    if (!session.url) {
      return createJsonResponse({ error: 'Stripe did not return a URL' }, 500);
    }

    return createJsonResponse({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[POST /api/checkout/session] failed:', err);
    return createJsonResponse({ error: 'Could not create checkout session' }, 500);
  }
};
