import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface DecodedToken {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

export function verifyToken(token: string): DecodedToken | null {
    try {
        return jwt.verify(token, JWT_SECRET) as DecodedToken;
    } catch (error) {
        return null;
    }
}

export function extractTokenFromRequest(request: Request): string | null {
    const authHeader = request.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }
    
    return authHeader.substring(7);
}

export function authenticateRequest(request: Request): DecodedToken | null {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
        return null;
    }
    
    return verifyToken(token);
}