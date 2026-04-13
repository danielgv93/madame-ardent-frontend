import type {APIRoute} from "astro";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../../lib/prisma.ts";
import { createJsonResponse } from "../../../lib/api-response.ts";

export const prerender = false;

export const POST: APIRoute = async ({request}) => {
    try {
        const JWT_SECRET = process.env.JWT_SECRET;

        if (!JWT_SECRET) {
            console.error("JWT_SECRET no está definido");
            return createJsonResponse({ error: "Error de configuración del servidor" }, 500);
        }

        const {email, password} = await request.json();

        if (!email || !password) {
            return createJsonResponse({ error: "Email and password are required" }, 400);
        }

        const user = await prisma.user.findUnique({
            where: {email}
        });

        if (!user) {
            return createJsonResponse({ error: "Invalid credentials" }, 401);
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return createJsonResponse({ error: "Invalid credentials" }, 401);
        }

        const token = jwt.sign(
            {userId: user.id, email: user.email},
            JWT_SECRET,
            {expiresIn: "24h"}
        );

        return createJsonResponse({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });

    } catch (error) {
        console.error(error);
        return createJsonResponse({ error: "Internal server error" }, 500);
    }
};
