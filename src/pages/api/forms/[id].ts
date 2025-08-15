import type { APIRoute } from "astro";
import prisma from "../../../lib/prisma.ts";
import { authenticateRequest } from "../../../lib/auth.ts";

export const PATCH: APIRoute = async ({ request, params }) => {
    // Authenticate the request
    const user = await authenticateRequest(request);
    //if (!user) {
    //    return new Response(JSON.stringify({ error: "No autorizado" }), {
    //        status: 401,
    //        headers: { "Content-Type": "application/json" },
    //    });
    //}

    try {
        const formId = params.id;
        
        if (!formId) {
            return new Response(JSON.stringify({ error: "ID de formulario requerido" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Parse request body
        const body = await request.json();
        const { status } = body;

        // Validate status
        const validStatuses = ['pending', 'read', 'replied'];
        if (!status || !validStatuses.includes(status)) {
            return new Response(JSON.stringify({ error: "Estado inválido. Debe ser: pending, read, replied" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Check if form exists
        const existingForm = await prisma.form.findUnique({
            where: { id: formId }
        });

        if (!existingForm) {
            return new Response(JSON.stringify({ error: "Formulario no encontrado" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Prepare update data
        const updateData: any = { status };
        
        // If changing to replied status, set respondedAt date
        if (status === 'replied' && existingForm.status !== 'replied') {
            updateData.respondedAt = new Date();
        }
        // If changing from replied to another status, clear respondedAt
        else if (status !== 'replied' && existingForm.status === 'replied') {
            updateData.respondedAt = null;
        }

        // Update the form
        const updatedForm = await prisma.form.update({
            where: { id: formId },
            data: updateData
        });

        return new Response(JSON.stringify({
            success: true,
            form: updatedForm
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error updating form status:", error);
        return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
};