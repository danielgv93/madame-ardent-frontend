/**
 * Shared types used across client and server code.
 */

export interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface ContactFormData {
    id?: string;
    name: string;
    user: string;
    email: string;
    country: string;
    services: string;
    message: string;
    status?: string;
    respondedAt?: string | null;
    createdAt?: string;
}
