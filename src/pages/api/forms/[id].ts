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
        const { status, note } = body;

        const hasStatus = status !== undefined;
        const hasNote = note !== undefined;

        if (!hasStatus && !hasNote) {
            return createJsonResponse(
                { error: "No se proporcionaron datos para actualizar" },
                400
            );
        }

        if (hasStatus && !VALID_FORM_STATUS.includes(status)) {
            return createJsonResponse(
                { error: `Estado inválido. Debe ser: ${VALID_FORM_STATUS.join(', ')}` },
                400
            );
        }

        if (hasNote && note !== null && typeof note !== "string") {
            return createJsonResponse(
                { error: "La nota debe ser texto" },
                400
            );
        }

        const existingForm = await prisma.form.findUnique({
            where: { id: formId }
        });

        if (!existingForm) {
            return createJsonResponse({ error: "Formulario no encontrado" }, 404);
        }

        const updateData: Record<string, unknown> = {};

        if (hasStatus) {
            updateData.status = status;

            if (status === FORM_STATUS.REPLIED && existingForm.status !== FORM_STATUS.REPLIED) {
                updateData.respondedAt = new Date();
            } else if (status !== FORM_STATUS.REPLIED && existingForm.status === FORM_STATUS.REPLIED) {
                updateData.respondedAt = null;
            }
        }

        if (hasNote) {
            const trimmed = typeof note === "string" ? note.trim() : "";
            updateData.note = trimmed.length > 0 ? trimmed : null;
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
