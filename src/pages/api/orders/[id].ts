import type { APIRoute } from 'astro';
import prisma from '../../../lib/prisma';
import { createJsonResponse, withAuth } from '../../../lib/api-response';

export const prerender = false;

export const GET: APIRoute = withAuth(async ({ params }) => {
  const id = params.id;
  if (typeof id !== 'string' || !id) {
    return createJsonResponse({ error: 'Invalid id' }, 400);
  }
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          downloads: {
            select: {
              id: true,
              token: true,
              expiresAt: true,
              downloadCount: true,
              maxDownloads: true,
              lastUsedAt: true,
            },
          },
        },
      },
    },
  });
  if (!order) {
    return createJsonResponse({ error: 'Order not found' }, 404);
  }
  return createJsonResponse({ order });
});
