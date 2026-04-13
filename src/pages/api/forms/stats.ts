import type {APIRoute} from "astro";
import prisma from "../../../lib/prisma.ts";
import { createJsonResponse } from "../../../lib/api-response.ts";

export const GET: APIRoute = async () => {
    try {
        const totalCount = await prisma.form.count();

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const [thisWeekCount, pendingCount] = await Promise.all([
            prisma.form.count({
                where: {
                    createdAt: {
                        gte: oneWeekAgo
                    }
                }
            }),
            prisma.form.count({
                where: {
                    status: "pending"
                }
            })
        ]);

        return createJsonResponse({
            total: totalCount,
            thisWeek: thisWeekCount,
            pending: pendingCount
        });
    } catch (error) {
        console.error("Error getting form stats:", error);
        return createJsonResponse({ error: "Error interno del servidor" }, 500);
    }
};
