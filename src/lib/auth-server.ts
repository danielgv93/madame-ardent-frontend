import jwt from "jsonwebtoken";

export interface DecodedToken {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

export async function verifyToken(token: string): Promise<DecodedToken | null> {
    try {
        const JWT_SECRET = process.env.JWT_SECRET || import.meta.env.JWT_SECRET;

        if (!JWT_SECRET) {
            console.error("JWT_SECRET no está definido");
            return null;
        }

        return jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (error) {
        console.error("Error al verificar token:", error);
        return null;
    }
}

export function extractTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        console.log("No auth header o formato incorrecto");
        return null;
    }

    return authHeader.substring(7);
}

export async function authenticateRequest(request: Request): Promise<DecodedToken | null> {

    const token = extractTokenFromRequest(request);

    if (!token) {
        console.log("No se pudo extraer el token");
        return null;
    }

    return await verifyToken(token);
}