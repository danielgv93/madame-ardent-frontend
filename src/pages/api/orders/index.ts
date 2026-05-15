import type { APIRoute } from 'astro';
import type { Prisma } from '@prisma/client';
import prisma from '../../../lib/prisma';
import { createJsonResponse, withAuth } from '../../../lib/api-response';
import { OrderValidationError, validateEmail, validateOrder } from '../../../lib/shop/order-server';
import { VALID_ORDER_STATUS } from '../../../lib/constants/order-status';
import { SUPPORTED_CURRENCIES } from '../../../lib/shop/currency';
import { normalizeEmailLang } from '../../../emails/i18n';

export const prerender = false;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const SORTABLE_FIELDS = new Set(['createdAt', 'total', 'status', 'paidAt']);

export const GET: APIRoute = withAuth(async ({ url }) => {
  const params = url.searchParams;
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(params.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));
  const skip = (page - 1) * limit;

  const sortByRaw = params.get('sortBy') ?? 'createdAt';
  const sortBy = SORTABLE_FIELDS.has(sortByRaw) ? sortByRaw : 'createdAt';
  const sortOrder = params.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  const status = params.get('status');
  const email = params.get('email');
  const currency = params.get('currency');
  const dateFrom = params.get('dateFrom');
  const dateTo = params.get('dateTo');

  const where: Prisma.OrderWhereInput = {};
  if (status && VALID_ORDER_STATUS.includes(status as (typeof VALID_ORDER_STATUS)[number])) {
    where.status = status;
  }
  if (email) {
    where.email = { contains: email.toLowerCase() };
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

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
      include: { items: { select: { productSlug: true, productTitle: true, quantity: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return createJsonResponse({
    orders,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

interface CreateOrderBody {
  email?: unknown;
  currency?: unknown;
  items?: unknown;
  lang?: unknown;
}

export const POST: APIRoute = async ({ request }) => {
  let body: CreateOrderBody;
  try {
    body = (await request.json()) as CreateOrderBody;
  } catch {
    return createJsonResponse({ error: 'Invalid JSON' }, 400);
  }

  try {
    const email = validateEmail(body.email);
    const validated = await validateOrder(body.items, body.currency);
    const lang = normalizeEmailLang(body.lang);

    const order = await prisma.order.create({
      data: {
        email,
        status: 'pending',
        lang,
        currency: validated.currency,
        subtotal: validated.subtotalCents,
        total: validated.totalCents,
        items: {
          create: validated.items.map((item) => ({
            productSlug: item.slug,
            productTitle: item.title,
            unitPrice: item.unitPriceCents,
            quantity: item.quantity,
            currency: validated.currency,
            fileKey: item.fileKey,
          })),
        },
      },
      select: {
        id: true,
        status: true,
        currency: true,
        subtotal: true,
        total: true,
        createdAt: true,
      },
    });

    return createJsonResponse({ order }, 201);
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return createJsonResponse({ error: err.message, code: err.code }, 400);
    }
    console.error('[POST /api/orders] failed:', err);
    return createJsonResponse({ error: 'Internal error' }, 500);
  }
};
