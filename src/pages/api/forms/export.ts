import type { APIRoute } from "astro";
import prisma from "../../../lib/prisma.ts";
import { authenticateRequest } from "../../../lib/auth.ts";

export const GET: APIRoute = async ({ request, url }) => {
    // Authenticate the request
    const user = await authenticateRequest(request);
    //if (!user) {
    //    return new Response(JSON.stringify({ error: "No autorizado" }), {
    //        status: 401,
    //        headers: { "Content-Type": "application/json" },
    //    });
    //}

    try {
        // Get query parameters for filtering
        const searchParams = url.searchParams;
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const status = searchParams.get('status');

        // Build the where clause for filtering
        const where: any = {};

        // Date filtering
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                // Add one day to include the full day
                const endDate = new Date(dateTo);
                endDate.setDate(endDate.getDate() + 1);
                where.createdAt.lt = endDate;
            }
        }

        // Note: Since status is not in the database schema, we'll handle it post-query
        // if needed for future implementation

        // Fetch forms with filtering
        const forms = await prisma.form.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Additional status filtering
        let filteredForms = forms;
        if (status && status !== '') {
            filteredForms = forms.filter(form => form.status === status);
        }

        // Generate CSV content
        const csvHeaders = [
            'ID',
            'Nombre',
            'Usuario',
            'Email', 
            'País',
            'Servicios',
            'Mensaje',
            'Estado',
            'Fecha de Creación',
            'Fecha de Respuesta'
        ];

        const csvRows = filteredForms.map(form => [
            form.id,
            escapeCSV(form.name),
            escapeCSV(form.user),
            escapeCSV(form.email),
            escapeCSV(form.country),
            escapeCSV(form.services),
            escapeCSV(form.message),
            escapeCSV(form.status || 'pending'),
            form.createdAt.toISOString(),
            form.respondedAt ? form.respondedAt.toISOString() : ''
        ]);

        // Build CSV content
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');

        // Generate filename with current date
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
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};

// Helper function to escape CSV values
function escapeCSV(value: string): string {
    if (value === null || value === undefined) {
        return '';
    }
    
    // Convert to string and escape quotes
    const stringValue = String(value);
    
    // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
}