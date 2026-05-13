import type { FormStatus } from '../lib/constants/form-status';

export interface PaginationData {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}

export interface ContactFormInput {
    name: string;
    user: string;
    email: string;
    country: string;
    services: string;
    budget: string;
    message: string;
}

export interface ContactFormRecord extends ContactFormInput {
    id: string;
    status: FormStatus;
    respondedAt: string | null;
    createdAt: string;
}
