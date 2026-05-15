import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { createJsonResponse } from '../../../lib/api-response';

export const prerender = false;

export const GET: APIRoute = async () => {
  const products = await getCollection('products', ({ data }) => data.active);
  const payload = products
    .sort((a, b) => a.data.order - b.data.order)
    .map((p) => ({
      slug: p.id,
      title: p.data.title,
      shortDescription: p.data.shortDescription,
      price: p.data.price,
      image: p.data.images[0],
      category: p.data.category,
    }));
  return createJsonResponse({ products: payload });
};
