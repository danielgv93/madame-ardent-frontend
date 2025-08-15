import type {APIRoute} from "astro";
import prisma from "../../../lib/prisma.ts";

export const GET: APIRoute = async () => {
    try {
        // Get total count
        const totalCount = await prisma.form.count();
        
        // Get forms from this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const thisWeekCount = await prisma.form.count({
            where: {
                createdAt: {
                    gte: oneWeekAgo
                }
            }
        });
        
        // Get pending forms count
        const pendingCount = await prisma.form.count({
            where: {
                status: "pending"
            }
        });

        const stats = {
            total: totalCount,
            thisWeek: thisWeekCount,
            pending: pendingCount
        };

        return new Response(JSON.stringify(stats), {
            headers: {"Content-Type": "application/json"},
        });
    } catch (error) {
        console.error("Error getting form stats:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};