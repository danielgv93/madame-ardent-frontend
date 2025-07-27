import type {APIRoute} from "astro";
import prisma from "../../lib/prisma.ts";

export const GET: APIRoute = async () => {
    const forms = await prisma.form.findMany();
    return new Response(JSON.stringify(forms), {
        headers: {"Content-Type": "application/json"},
    });
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { name, user, email, country, services, message } = body;

        if (!name || !user || !email || !country || !services || !message) {
            return new Response(JSON.stringify({ error: "Todos los campos son requeridos" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const form = await prisma.form.create({
            data: {
                name,
                user,
                email,
                country,
                services,
                message,
            },
        });

        return new Response(JSON.stringify(form), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Error creating form:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};