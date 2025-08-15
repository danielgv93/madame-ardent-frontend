import type {APIRoute} from "astro";
import prisma from "../../lib/prisma.ts";

export const GET: APIRoute = async ({ url }) => {
    const searchParams = new URL(url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Parámetros de ordenamiento
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Mapear campos del frontend a campos de la base de datos
    const fieldMapping: Record<string, string> = {
        'name': 'name',
        'createdAt': 'createdAt',
        'status': 'status',
        'respondedAt': 'respondedAt'
    };

    const dbField = fieldMapping[sortBy] || 'createdAt';
    const dbOrder = sortOrder === 'asc' ? 'asc' : 'desc';

    const [forms, totalCount] = await Promise.all([
        prisma.form.findMany({
            skip,
            take: limit,
            orderBy: {
                [dbField]: dbOrder
            }
        }),
        prisma.form.count()
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const response = {
        forms,
        pagination: {
            currentPage: page,
            totalPages,
            totalCount,
            limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        }
    };

    return new Response(JSON.stringify(response), {
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