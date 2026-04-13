import { getToken, redirectToRestricted } from './auth-client.ts';

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

/**
 * Wrapper around fetch that automatically includes JWT authentication.
 * Redirects to /restricted on 401 responses (token expired or invalid).
 */
export async function authenticatedFetch(url: string, options: FetchOptions = {}): Promise<Response> {
    const token = getToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers,
    });

    // Auto-redirect on authentication errors
    if (response.status === 401) {
        redirectToRestricted();
    }

    return response;
}
