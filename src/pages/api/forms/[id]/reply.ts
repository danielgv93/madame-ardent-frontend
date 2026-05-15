import type { APIRoute } from "astro";
import prisma from "../../../../lib/prisma.ts";
import { withAuth, createJsonResponse } from "../../../../lib/api-response.ts";
import { sendEmail, buildReplyEmailHtml } from "../../../../lib/email.ts";
import { normalizeEmailLang } from "../../../../emails/i18n.tsx";
import { FORM_STATUS } from "../../../../lib/constants/form-status.ts";

export const POST: APIRoute = withAuth(async ({ request, params }) => {
    try {
        const formId = params.id;

        if (!formId) {
            return createJsonResponse({ error: "ID de formulario requerido" }, 400);
        }

        const body = await request.json();
        const subject: string = (body?.subject || '').trim();
        const html: string = (body?.html || '').trim();

        if (!subject) {
            return createJsonResponse({ error: "El asunto es requerido" }, 400);
        }

        const plain = html.replace(/<[^>]*>/g, '').trim();
        if (!plain) {
            return createJsonResponse({ error: "El mensaje no puede estar vacío" }, 400);
        }

        const form = await prisma.form.findUnique({ where: { id: formId } });
        if (!form) {
            return createJsonResponse({ error: "Formulario no encontrado" }, 404);
        }

        await sendEmail({
            to: form.email,
            subject,
            html: await buildReplyEmailHtml(html, form.message, normalizeEmailLang(form.lang)),
            fromName: 'Madame Ardent',
        });

        const updatedForm = await prisma.form.update({
            where: { id: formId },
            data: {
                status: FORM_STATUS.REPLIED,
                respondedAt: new Date(),
            },
        });

        return createJsonResponse({ success: true, form: updatedForm });

    } catch (error) {
        console.error("Error sending reply:", error);
        return createJsonResponse({ error: "Error al enviar la respuesta" }, 500);
    }
});
