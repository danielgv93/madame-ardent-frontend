import { useEffect, useState } from 'react';
import type { ProductSummary } from './types';

let cache: ProductSummary[] | null = null;
let inflight: Promise<ProductSummary[]> | null = null;

async function fetchProducts(): Promise<ProductSummary[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch('/api/shop/products')
    .then((r) => r.json() as Promise<{ products: ProductSummary[] }>)
    .then((d) => {
      cache = d.products;
      return cache;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function useProducts(): { products: ProductSummary[]; loading: boolean } {
  const [products, setProducts] = useState<ProductSummary[]>(cache ?? []);
  const [loading, setLoading] = useState<boolean>(cache === null);

  useEffect(() => {
    let mounted = true;
    if (cache) {
      setProducts(cache);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchProducts().then((p) => {
      if (mounted) {
        setProducts(p);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return { products, loading };
}

export function productIndexBySlug(products: ProductSummary[]): Map<string, ProductSummary> {
  return new Map(products.map((p) => [p.slug, p]));
}
