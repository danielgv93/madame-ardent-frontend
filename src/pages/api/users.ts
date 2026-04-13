import type {APIRoute} from "astro";
import prisma from "../../lib/prisma.ts";
import { withAuth, createJsonResponse } from "../../lib/api-response.ts";

export const prerender = false;

export const GET: APIRoute = withAuth(async () => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true
        }
    });

    return createJsonResponse(users);
});
