import type {APIRoute} from "astro";
import prisma from "../../lib/prisma.ts";
import {authenticateRequest} from "../../lib/auth.ts";

export const prerender = false;

export const GET: APIRoute = async ({request}) => {
    const user = authenticateRequest(request);
    console.log(request)
    
    if (!user) {
        return new Response(JSON.stringify({error: "Unauthorized"}), {
            status: 401,
            headers: {"Content-Type": "application/json"},
        });
    }
    
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true
        }
    });
    
    return new Response(JSON.stringify(users), {
        headers: {"Content-Type": "application/json"},
    });
};