import type { APIRoute } from 'astro';
import { Readable } from 'node:stream';
import prisma from '../../../lib/prisma';
import {
  openFileStream,
  readFileMetadata,
  StorageError,
} from '../../../lib/shop/file-storage';

export const prerender = false;

function plainText(message: string, status: number): Response {
  return new Response(message, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const token = params.token;
  if (!token || typeof token !== 'string' || token.length < 16) {
    return plainText('Invalid token', 400);
  }

  const download = await prisma.download.findUnique({
    where: { token },
    include: { orderItem: { include: { order: true } } },
  });

  if (!download) {
    return plainText('Download not found', 404);
  }

  const order = download.orderItem.order;
  if (order.status !== 'paid' && order.status !== 'delivered') {
    return plainText('Order is not paid yet', 403);
  }

  if (download.expiresAt.getTime() < Date.now()) {
    return plainText('This download link has expired', 410);
  }

  if (download.downloadCount >= download.maxDownloads) {
    return plainText('Download limit reached', 410);
  }

  const fileKey = download.orderItem.fileKey;
  if (!fileKey) {
    return plainText('Product is not deliverable', 404);
  }

  try {
    const meta = await readFileMetadata(fileKey);

    await prisma.download.update({
      where: { id: download.id },
      data: { downloadCount: { increment: 1 }, lastUsedAt: new Date() },
    });

    const nodeStream = openFileStream(fileKey);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      status: 200,
      headers: {
        'Content-Type': meta.mimeType,
        'Content-Length': String(meta.size),
        'Content-Disposition': `attachment; filename="${meta.filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    if (err instanceof StorageError) {
      if (err.code === 'not_found') return plainText('File not found', 404);
      if (err.code === 'invalid_key') return plainText('Invalid file', 400);
    }
    console.error('[GET /api/download/[token]] failed:', err);
    return plainText('Internal error', 500);
  }
};
