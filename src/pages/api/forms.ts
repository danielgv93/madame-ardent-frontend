import type { APIRoute } from "astro";
import prisma from "../../lib/prisma.ts";

interface FormData {
    name: string;
    user: string;
    email: string;
    country: string;
    services: string;
    message: string;
}

interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
}
type SortOrder = 'asc' | 'desc'
interface SortParams {
    sortBy: string;
    sortOrder: SortOrder;
}

interface PaginationResponse {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const DEFAULT_SORT_BY = 'createdAt';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';
const MAX_LIMIT = 100;

const SORTABLE_FIELDS = {
    name: 'name',
    createdAt: 'createdAt',
    status: 'status',
    respondedAt: 'respondedAt'
} as const;

const REQUIRED_FIELDS: (keyof FormData)[] = ['name', 'user', 'email', 'country', 'services', 'message'];

const createJsonResponse = (data: any, status = 200) => {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "Content-Type": "application/json" }
    });
};

const parseQueryParams = (searchParams: URLSearchParams): PaginationParams & SortParams => {
    const page = Math.max(1, parseInt(searchParams.get('page') || String(DEFAULT_PAGE)));
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT))));
    const skip = (page - 1) * limit;
    
    const sortBy = searchParams.get('sortBy') || DEFAULT_SORT_BY;
    const sortOrder = (searchParams.get('sortOrder') === 'asc' ? 'asc' : DEFAULT_SORT_ORDER) as SortOrder;

    return { page, limit, skip, sortBy, sortOrder };
};

const validateSortField = (sortBy: string): string => {
    return SORTABLE_FIELDS[sortBy as keyof typeof SORTABLE_FIELDS] || DEFAULT_SORT_BY;
};

const validateFormData = (data: any): { isValid: boolean; missingFields: string[] } => {
    const missingFields = REQUIRED_FIELDS.filter(field => !data[field]?.trim());
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
};

const sanitizeFormData = (data: any): FormData => {
    return {
        name: String(data.name || '').trim(),
        user: String(data.user || '').trim(),
        email: String(data.email || '').trim().toLowerCase(),
        country: String(data.country || '').trim(),
        services: String(data.services || '').trim(),
        message: String(data.message || '').trim()
    };
};

const createPaginationResponse = (
    page: number, 
    totalCount: number, 
    limit: number
): PaginationResponse => {
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
    };
};

export const GET: APIRoute = async ({ url }) => {
    try {
        const searchParams = new URL(url).searchParams;
        const { page, limit, skip, sortBy, sortOrder } = parseQueryParams(searchParams);
        
        const dbField = validateSortField(sortBy);

        const [forms, totalCount] = await Promise.all([
            prisma.form.findMany({
                skip,
                take: limit,
                orderBy: {
                    [dbField]: sortOrder
                }
            }),
            prisma.form.count()
        ]);

        const pagination = createPaginationResponse(page, totalCount, limit);

        return createJsonResponse({
            forms,
            pagination
        });
    } catch (error) {
        console.error("Error fetching forms:", error);
        return createJsonResponse(
            { error: "Error al obtener los formularios" }, 
            500
        );
    }
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const sanitizedData = sanitizeFormData(body);
        const validation = validateFormData(sanitizedData);

        if (!validation.isValid) {
            return createJsonResponse(
                { 
                    error: "Faltan campos requeridos", 
                    missingFields: validation.missingFields 
                }, 
                400
            );
        }

        const form = await prisma.form.create({
            data: sanitizedData
        });

        return createJsonResponse(form, 201);
    } catch (error) {
        console.error("Error creating form:", error);
        
        if (error instanceof SyntaxError) {
            return createJsonResponse(
                { error: "Formato de datos inválido" }, 
                400
            );
        }

        return createJsonResponse(
            { error: "Error interno del servidor" }, 
            500
        );
    }
};