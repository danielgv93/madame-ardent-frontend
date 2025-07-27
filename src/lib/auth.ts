export interface DecodedToken {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

// Server-side functions - only import jwt when needed
let jwt: any;
let JWT_SECRET: string;

async function getJwtModule() {
    if (!jwt) {
        jwt = await import("jsonwebtoken");
        JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    }
    return { jwt, JWT_SECRET };
}

export async function verifyToken(token: string): Promise<DecodedToken | null> {
    try {
        const { jwt: jwtModule, JWT_SECRET: secret } = await getJwtModule();
        return jwtModule.verify(token, secret) as DecodedToken;
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

export async function authenticateRequest(request: Request): Promise<DecodedToken | null> {
    const token = extractTokenFromRequest(request);
    
    if (!token) {
        return null;
    }
    
    return await verifyToken(token);
}

export function isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        return payload.exp > currentTime;
    } catch {
        return false;
    }
}

export function redirectToRestricted() {
    if (typeof window !== 'undefined') {
        window.location.href = '/restricted';
    }
}

export function getCurrentUser() {
    if (typeof window === 'undefined') return null;
    
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

export function logout() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }
}