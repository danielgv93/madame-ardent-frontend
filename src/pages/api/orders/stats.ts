import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { createJsonResponse, withAuth } from '../../../lib/api-response';
import { ORDER_STATUS } from '../../../lib/constants/order-status';

export const prerender = false;

export const GET: APIRoute = withAuth(async () => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, pending, delivered, weekCount, revenueAgg, monthRevenueAgg] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: ORDER_STATUS.PENDING } }),
    prisma.order.count({ where: { status: ORDER_STATUS.DELIVERED } }),
    prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.DELIVERED] } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        status: { in: [ORDER_STATUS.PAID, ORDER_STATUS.DELIVERED] },
        paidAt: { gte: monthStart },
      },
    }),
  ]);

  return createJsonResponse({
    stats: {
      total,
      pending,
      delivered,
      weekCount,
      totalRevenueCents: revenueAgg._sum.total ?? 0,
      monthRevenueCents: monthRevenueAgg._sum.total ?? 0,
    },
  });
});
