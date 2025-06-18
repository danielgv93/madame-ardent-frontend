import type {APIRoute} from "astro";
import prisma from "../../lib/prisma.ts";

export const GET: APIRoute = async () => {
    const forms = await prisma.form.findMany();
    return new Response(JSON.stringify(forms), {
        headers: {"Content-Type": "application/json"},
    });
};