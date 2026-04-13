import type { APIRoute } from "astro";
import prisma from "../../../lib/prisma.ts";
import { withAuth, createJsonResponse } from "../../../lib/api-response.ts";
import { FORM_STATUS } from "../../../lib/constants/form-status.ts";

function escapeCSV(value: unknown): string {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

export const GET: APIRoute = withAuth(async ({ url }) => {
    try {
        const searchParams = url.searchParams;
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const status = searchParams.get('status');

        const where: Record<string, unknown> = {};

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setDate(endDate.getDate() + 1);
                (where.createdAt as Record<string, Date>).lt = endDate;
            }
        }

        if (status) {
            where.status = status;
        }

        const forms = await prisma.form.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        const csvHeaders = [
            'ID', 'Nombre', 'Usuario', 'Email', 'País',
            'Servicios', 'Mensaje', 'Estado',
            'Fecha de Creación', 'Fecha de Respuesta'
        ];

        const csvRows = forms.map(form => [
            form.id,
            escapeCSV(form.name),
            escapeCSV(form.user),
            escapeCSV(form.email),
            escapeCSV(form.country),
            escapeCSV(form.services),
            escapeCSV(form.message),
            escapeCSV(form.status || FORM_STATUS.PENDING),
            form.createdAt.toISOString(),
            form.respondedAt ? form.respondedAt.toISOString() : ''
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');

        const currentDate = new Date().toISOString().split('T')[0];
        const filename = `formularios-${currentDate}.csv`;

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'no-cache'
            }
        });

    } catch (error) {
        console.error("Error exporting forms:", error);
        return createJsonResponse({ error: "Error interno del servidor" }, 500);
    }
});
