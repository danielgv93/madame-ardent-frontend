import { randomBytes } from 'node:crypto';

const TOKEN_BYTES = 32;
const DEFAULT_EXPIRATION_DAYS = 7;
const DEFAULT_MAX_DOWNLOADS = 5;

export interface DownloadTokenConfig {
  expirationDays: number;
  maxDownloads: number;
}

export function getDefaultDownloadConfig(): DownloadTokenConfig {
  const expirationDays = parseInt(process.env.DOWNLOAD_EXPIRATION_DAYS ?? '', 10);
  const maxDownloads = parseInt(process.env.DOWNLOAD_MAX_DOWNLOADS ?? '', 10);
  return {
    expirationDays: Number.isFinite(expirationDays) && expirationDays > 0 ? expirationDays : DEFAULT_EXPIRATION_DAYS,
    maxDownloads: Number.isFinite(maxDownloads) && maxDownloads > 0 ? maxDownloads : DEFAULT_MAX_DOWNLOADS,
  };
}

export function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString('base64url');
}

export function buildExpirationDate(days: number, from: Date = new Date()): Date {
  const out = new Date(from);
  out.setDate(out.getDate() + days);
  return out;
}
