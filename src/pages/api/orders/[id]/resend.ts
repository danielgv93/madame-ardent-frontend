import type { APIRoute } from 'astro';
import prisma from '../../../../lib/prisma';
import { createJsonResponse, withAuth } from '../../../../lib/api-response';
import { sendOrderDeliveryEmail } from '../../../../lib/email';
import {
  buildExpirationDate,
  generateToken,
  getDefaultDownloadConfig,
} from '../../../../lib/shop/download-tokens';
import { getPublicSiteUrl } from '../../../../lib/shop/stripe';
import { formatPrice, type Currency } from '../../../../lib/shop/currency';
import { fromCents } from '../../../../lib/shop/order-server';
import { ORDER_STATUS } from '../../../../lib/constants/order-status';
import { normalizeEmailLang } from '../../../../emails/i18n';

export const prerender = false;

export const POST: APIRoute = withAuth(async ({ params }) => {
  const id = params.id;
  if (typeof id !== 'string' || !id) {
    return createJsonResponse({ error: 'Invalid id' }, 400);
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) {
    return createJsonResponse({ error: 'Order not found' }, 404);
  }
  if (order.status !== ORDER_STATUS.PAID && order.status !== ORDER_STATUS.DELIVERED) {
    return createJsonResponse({ error: 'Order is not paid' }, 409);
  }

  const { expirationDays, maxDownloads } = getDefaultDownloadConfig();
  const expiresAt = buildExpirationDate(expirationDays);

  await prisma.$transaction(async (tx) => {
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
    where: { orderItem: { orderId: order.id } },
    orderBy: { createdAt: 'desc' },
    include: { orderItem: true },
  });

  // Use most recent token per item
  const latestByItem = new Map<string, (typeof downloads)[number]>();
  for (const d of downloads) {
    if (!latestByItem.has(d.orderItemId)) latestByItem.set(d.orderItemId, d);
  }

  const baseUrl = getPublicSiteUrl();
  const currency = order.currency as Currency;
  const lang = normalizeEmailLang(order.lang);
  const totalFormatted = formatPrice(fromCents(order.total), currency, lang);
  const shopUrl = `${baseUrl}${lang === 'en' ? '/en/shop' : '/tienda'}`;

  const emailItems = order.items.map((item) => {
    const dl = latestByItem.get(item.id);
    return {
      title: item.productTitle,
      quantity: item.quantity,
      downloadUrl: dl ? `${baseUrl}/api/download/${dl.token}` : shopUrl,
    };
  });

  try {
    await sendOrderDeliveryEmail({
      orderId: order.id,
      customerEmail: order.email,
      totalFormatted,
      items: emailItems,
      expirationDays,
      maxDownloads,
      shopUrl,
      lang,
    });
    await prisma.order.update({
      where: { id: order.id },
      data: { status: ORDER_STATUS.DELIVERED },
    });
    return createJsonResponse({ ok: true });
  } catch (err) {
    console.error('[POST /api/orders/[id]/resend] failed:', err);
    return createJsonResponse({ error: 'Could not send email' }, 500);
  }
});
