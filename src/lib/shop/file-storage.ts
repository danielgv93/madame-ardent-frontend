import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import type { ReadStream } from 'node:fs';

const DEFAULT_DIR = 'private-files/products';

function getStorageRoot(): string {
  const fromEnv = process.env.PRIVATE_FILES_DIR;
  const dir = fromEnv && fromEnv.trim().length > 0 ? fromEnv : DEFAULT_DIR;
  return resolve(process.cwd(), dir);
}

export class StorageError extends Error {
  constructor(message: string, public code: 'invalid_key' | 'not_found' | 'access_error') {
    super(message);
    this.name = 'StorageError';
  }
}

function validateKey(fileKey: string): void {
  if (!fileKey || typeof fileKey !== 'string') {
    throw new StorageError('Invalid fileKey', 'invalid_key');
  }
  if (fileKey.includes('..') || fileKey.startsWith('/') || fileKey.includes('\0')) {
    throw new StorageError('Disallowed fileKey', 'invalid_key');
  }
}

export interface FileMetadata {
  size: number;
  mimeType: string;
  filename: string;
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  zip: 'application/zip',
  epub: 'application/epub+zip',
  mobi: 'application/x-mobipocket-ebook',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
};

function mimeFor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return MIME_BY_EXT[ext] ?? 'application/octet-stream';
}

export async function readFileMetadata(fileKey: string): Promise<FileMetadata> {
  validateKey(fileKey);
  const root = getStorageRoot();
  const full = resolve(root, fileKey);
  if (!full.startsWith(root + sep) && full !== root) {
    throw new StorageError('Path traversal blocked', 'invalid_key');
  }
  try {
    const stats = await stat(full);
    if (!stats.isFile()) {
      throw new StorageError('Not a file', 'not_found');
    }
    return {
      size: stats.size,
      mimeType: mimeFor(fileKey),
      filename: fileKey.split('/').pop() ?? fileKey,
    };
  } catch (err) {
    if (err instanceof StorageError) throw err;
    const e = err as NodeJS.ErrnoException;
    if (e.code === 'ENOENT') throw new StorageError('File not found', 'not_found');
    throw new StorageError('Access error', 'access_error');
  }
}

export function openFileStream(fileKey: string): ReadStream {
  validateKey(fileKey);
  const root = getStorageRoot();
  const full = resolve(root, fileKey);
  if (!full.startsWith(root + sep) && full !== root) {
    throw new StorageError('Path traversal blocked', 'invalid_key');
  }
  return createReadStream(full);
}

export function getStorageInfo(): { root: string } {
  return { root: getStorageRoot() };
}
