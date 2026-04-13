import type { APIRoute } from 'astro';
import { authenticateRequest, type DecodedToken } from './auth-server.ts';

/**
 * Creates a JSON Response with consistent headers.
 * Centralizes response construction across all API routes.
 */
export function createJsonResponse(data: unknown, status = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

/**
 * Wraps an API handler with JWT authentication.
 * Returns 401 if the request is not authenticated.
 *
 * Usage:
 *   export const GET: APIRoute = withAuth(async ({ request }, user) => {
 *       // user is guaranteed to be DecodedToken here
 *       return createJsonResponse({ data: '...' });
 *   });
 */
export function withAuth(
    handler: (context: Parameters<APIRoute>[0], user: DecodedToken) => Promise<Response> | Response,
): APIRoute {
    return async (context) => {
        const user = await authenticateRequest(context.request);

        if (!user) {
            return createJsonResponse({ error: 'No autorizado' }, 401);
        }

        return handler(context, user);
    };
}
