import type { APIRoute } from "astro";
import prisma from "../../../lib/prisma.ts";
import { withAuth, createJsonResponse } from "../../../lib/api-response.ts";
import { FORM_STATUS, VALID_FORM_STATUS } from "../../../lib/constants/form-status.ts";

export const PATCH: APIRoute = withAuth(async ({ request, params }) => {
    try {
        const formId = params.id;

        if (!formId) {
            return createJsonResponse({ error: "ID de formulario requerido" }, 400);
        }

        const body = await request.json();
        const { status } = body;

        if (!status || !VALID_FORM_STATUS.includes(status)) {
            return createJsonResponse(
                { error: `Estado inválido. Debe ser: ${VALID_FORM_STATUS.join(', ')}` },
                400
            );
        }

        const existingForm = await prisma.form.findUnique({
            where: { id: formId }
        });

        if (!existingForm) {
            return createJsonResponse({ error: "Formulario no encontrado" }, 404);
        }

        const updateData: Record<string, unknown> = { status };

        if (status === FORM_STATUS.REPLIED && existingForm.status !== FORM_STATUS.REPLIED) {
            updateData.respondedAt = new Date();
        } else if (status !== FORM_STATUS.REPLIED && existingForm.status === FORM_STATUS.REPLIED) {
            updateData.respondedAt = null;
        }

        const updatedForm = await prisma.form.update({
            where: { id: formId },
            data: updateData
        });

        return createJsonResponse({
            success: true,
            form: updatedForm
        });

    } catch (error) {
        console.error("Error updating form status:", error);
        return createJsonResponse({ error: "Error interno del servidor" }, 500);
    }
});
