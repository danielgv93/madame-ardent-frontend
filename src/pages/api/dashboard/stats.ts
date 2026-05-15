import type { APIRoute } from "astro";
import prisma from "../../../lib/prisma.ts";
import { createJsonResponse, withAuth } from "../../../lib/api-response.ts";
import { FORM_STATUS } from "../../../lib/constants/form-status.ts";
import { ORDER_STATUS } from "../../../lib/constants/order-status.ts";

export const prerender = false;

const RECENT_LIMIT = 5;

/**
 * Combined dashboard statistics: contact forms and shop orders.
 * Powers the DashboardStats component on /dashboard.
 */
export const GET: APIRoute = withAuth(async () => {
    try {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const paidStatuses = [ORDER_STATUS.PAID, ORDER_STATUS.DELIVERED];

        const [
            formsTotal,
            formsWeek,
            formGroups,
            ordersTotal,
            ordersWeek,
            orderGroups,
            monthRevenue,
            totalRevenue,
            recentForms,
            recentOrders,
        ] = await Promise.all([
            prisma.form.count(),
            prisma.form.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.form.groupBy({ by: ["status"], _count: true }),
            prisma.order.count(),
            prisma.order.count({ where: { createdAt: { gte: weekAgo } } }),
            prisma.order.groupBy({ by: ["status"], _count: true }),
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: { in: paidStatuses }, paidAt: { gte: monthStart } },
            }),
            prisma.order.aggregate({
                _sum: { total: true },
                where: { status: { in: paidStatuses } },
            }),
            prisma.form.findMany({
                orderBy: { createdAt: "desc" },
                take: RECENT_LIMIT,
                select: { id: true, name: true, email: true, status: true, createdAt: true },
            }),
            prisma.order.findMany({
                orderBy: { createdAt: "desc" },
                take: RECENT_LIMIT,
                select: { id: true, email: true, status: true, total: true, currency: true, createdAt: true },
            }),
        ]);

        const formCount = (status: string): number =>
            formGroups.find((g) => g.status === status)?._count ?? 0;
        const orderCount = (status: string): number =>
            orderGroups.find((g) => g.status === status)?._count ?? 0;

        return createJsonResponse({
            forms: {
                total: formsTotal,
                thisWeek: formsWeek,
                pending: formCount(FORM_STATUS.PENDING),
                read: formCount(FORM_STATUS.READ),
                replied: formCount(FORM_STATUS.REPLIED),
            },
            orders: {
                total: ordersTotal,
                thisWeek: ordersWeek,
                pending: orderCount(ORDER_STATUS.PENDING),
                paid: orderCount(ORDER_STATUS.PAID),
                delivered: orderCount(ORDER_STATUS.DELIVERED),
                failed: orderCount(ORDER_STATUS.FAILED),
                refunded: orderCount(ORDER_STATUS.REFUNDED),
                monthRevenueCents: monthRevenue._sum.total ?? 0,
                totalRevenueCents: totalRevenue._sum.total ?? 0,
            },
            recent: {
                forms: recentForms,
                orders: recentOrders,
            },
        });
    } catch (error) {
        console.error("Error getting dashboard stats:", error);
        return createJsonResponse({ error: "Error interno del servidor" }, 500);
    }
});
