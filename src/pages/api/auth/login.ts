import type {APIRoute} from "astro";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../../../lib/prisma.ts";

export const prerender = false;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const POST: APIRoute = async ({request}) => {
    try {
        const {email, password} = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({error: "Email and password are required"}), {
                status: 400,
                headers: {"Content-Type": "application/json"},
            });
        }

        const user = await prisma.user.findUnique({
            where: {email}
        });

        if (!user) {
            return new Response(JSON.stringify({error: "Invalid credentials"}), {
                status: 401,
                headers: {"Content-Type": "application/json"},
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return new Response(JSON.stringify({error: "Invalid credentials"}), {
                status: 401,
                headers: {"Content-Type": "application/json"},
            });
        }

        const token = jwt.sign(
            {userId: user.id, email: user.email},
            JWT_SECRET,
            {expiresIn: "24h"}
        );

        return new Response(JSON.stringify({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        }), {
            status: 200,
            headers: {"Content-Type": "application/json"},
        });

    } catch (error) {
        return new Response(JSON.stringify({error: "Internal server error"}), {
            status: 500,
            headers: {"Content-Type": "application/json"},
        });
    }
};