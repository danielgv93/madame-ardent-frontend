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

export function getAuthHeader(): { Authorization: string } | {} {
    if (typeof window === 'undefined') return {};

    const token = localStorage.getItem('token');
    if (!token) return {};

    return {
        Authorization: `Bearer ${token}`
    };
}