import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const products = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/products' }),
  schema: z.object({
      title: z.string(),
      shortDescription: z.string(),
      price: z.object({
        EUR: z.number().positive(),
        USD: z.number().positive(),
      }),
      images: z.array(z.string()).min(1),
      category: z.string(),
      fileKey: z.string().optional(),
      active: z.boolean().default(true),
      featured: z.boolean().default(false),
      order: z.number().default(0),
      seo: z
        .object({
          metaTitle: z.string().optional(),
          metaDescription: z.string().optional(),
        })
        .optional(),
      createdAt: z.coerce.date(),
    }),
});

export const collections = { products };
