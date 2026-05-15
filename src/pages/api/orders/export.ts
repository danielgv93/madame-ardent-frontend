import type { APIRoute } from 'astro';
import type { Prisma } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { createJsonResponse, withAuth } from '../../../lib/api-response';
import { VALID_ORDER_STATUS } from '../../../lib/constants/order-status';
import { SUPPORTED_CURRENCIES } from '../../../lib/shop/currency';
import { fromCents } from '../../../lib/shop/order-server';

export const prerender = false;

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export const GET: APIRoute = withAuth(async ({ url }) => {
  try {
    const params = url.searchParams;
    const status = params.get('status');
    const currency = params.get('currency');
    const dateFrom = params.get('dateFrom');
    const dateTo = params.get('dateTo');

    const where: Prisma.OrderWhereInput = {};
    if (status && VALID_ORDER_STATUS.includes(status as (typeof VALID_ORDER_STATUS)[number])) {
      where.status = status;
    }
    if (currency && (SUPPORTED_CURRENCIES as readonly string[]).includes(currency)) {
      where.currency = currency;
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (!isNaN(d.getTime())) (where.createdAt as Record<string, Date>).gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (!isNaN(d.getTime())) {
          d.setDate(d.getDate() + 1);
          (where.createdAt as Record<string, Date>).lt = d;
        }
      }
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    const headers = [
      'ID', 'Email', 'Estado', 'Moneda', 'Subtotal', 'Total',
      'Items', 'Stripe Session', 'Pagado', 'Reembolsado', 'Creado',
    ];

    const rows = orders.map((o) => [
      o.id,
      escapeCSV(o.email),
      escapeCSV(o.status),
      escapeCSV(o.currency),
      fromCents(o.subtotal).toFixed(2),
      fromCents(o.total).toFixed(2),
      escapeCSV(o.items.map((i) => `${i.quantity}x ${i.productTitle}`).join(' | ')),
      escapeCSV(o.stripeSessionId ?? ''),
      o.paidAt ? o.paidAt.toISOString() : '',
      o.refundedAt ? o.refundedAt.toISOString() : '',
      o.createdAt.toISOString(),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const filename = `pedidos-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[GET /api/orders/export] failed:', err);
    return createJsonResponse({ error: 'Internal error' }, 500);
  }
});
