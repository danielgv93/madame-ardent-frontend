import type { APIRoute } from "astro";
import bcrypt from "bcrypt";
import prisma from "../../../lib/prisma.ts";
import { withAuth, createJsonResponse } from "../../../lib/api-response.ts";

export const prerender = false;

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Returns the profile of the currently authenticated user.
 */
export const GET: APIRoute = withAuth(async (_context, user) => {
    const profile = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, email: true, name: true },
    });

    if (!profile) {
        return createJsonResponse({ error: "Usuario no encontrado" }, 404);
    }

    return createJsonResponse({ user: profile });
});

/**
 * Updates the authenticated user's profile.
 * Supports renaming and changing the password (verifying the current one).
 * The email is intentionally immutable.
 */
export const PUT: APIRoute = withAuth(async ({ request }, user) => {
    try {
        const body = await request.json();
        const { name, currentPassword, newPassword } = (body ?? {}) as Record<string, unknown>;

        const updateData: { name?: string; password?: string } = {};

        // Name update
        if (name !== undefined) {
            const trimmedName = String(name).trim();
            if (!trimmedName) {
                return createJsonResponse({ error: "El nombre no puede estar vacío" }, 400);
            }
            updateData.name = trimmedName;
        }

        // Password change (optional)
        const wantsPasswordChange = currentPassword !== undefined || newPassword !== undefined;
        if (wantsPasswordChange) {
            if (!currentPassword || !newPassword) {
                return createJsonResponse(
                    { error: "Debes indicar la contraseña actual y la nueva" },
                    400,
                );
            }

            if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
                return createJsonResponse(
                    { error: `La nueva contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres` },
                    400,
                );
            }

            const existingUser = await prisma.user.findUnique({
                where: { id: user.userId },
            });

            if (!existingUser) {
                return createJsonResponse({ error: "Usuario no encontrado" }, 404);
            }

            const isCurrentValid = await bcrypt.compare(
                String(currentPassword),
                existingUser.password,
            );

            if (!isCurrentValid) {
                return createJsonResponse({ error: "La contraseña actual es incorrecta" }, 401);
            }

            updateData.password = await bcrypt.hash(String(newPassword), SALT_ROUNDS);
        }

        if (Object.keys(updateData).length === 0) {
            return createJsonResponse(
                { error: "No se proporcionaron datos para actualizar" },
                400,
            );
        }

        const updatedUser = await prisma.user.update({
            where: { id: user.userId },
            data: updateData,
            select: { id: true, email: true, name: true },
        });

        return createJsonResponse({ success: true, user: updatedUser });
    } catch (error) {
        if (error instanceof SyntaxError) {
            return createJsonResponse({ error: "Formato de datos inválido" }, 400);
        }

        console.error("Error updating user profile:", error);
        return createJsonResponse({ error: "Error interno del servidor" }, 500);
    }
});
