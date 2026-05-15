import { useEffect, useState } from 'react';
import { cartStore } from '../../lib/shop/cart-store';
import { useCart } from '../../lib/shop/use-cart';
import { useProducts, productIndexBySlug } from '../../lib/shop/use-products';
import { formatPrice, SUPPORTED_CURRENCIES } from '../../lib/shop/currency';
import type { Lang } from '../../i18n/ui';

interface Labels {
  title: string;
  titleEmph: string;
  close: string;
  empty: string;
  subtotal: string;
  checkout: string;
  clear: string;
  remove: string;
  loading: string;
  currencyLabel: string;
  cartHref: string;
  viewCart: string;
}

interface Props {
  lang: Lang;
  labels: Labels;
}

export default function CartDrawer({ lang, labels }: Props) {
  const cart = useCart();
  const { products, loading } = useProducts();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('cart:open', onOpen);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('cart:open', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const index = productIndexBySlug(products);
  const entries = Object.entries(cart.items)
    .map(([slug, qty]) => {
      const product = index.get(slug);
      if (!product) return null;
      return { product, qty };
    })
    .filter((e): e is { product: NonNullable<ReturnType<typeof index.get>>; qty: number } => e !== null);

  const subtotal = entries.reduce((sum, { product, qty }) => sum + product.price[cart.currency] * qty, 0);

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <aside
        role="dialog"
        aria-label={`${labels.title} ${labels.titleEmph}`}
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <header className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-2xl font-broskon text-primary">
            {labels.title} <span className="italic">{labels.titleEmph}</span>
          </h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.close}
            className="text-gray-500 hover:text-gray-800"
          >
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
          <span className="text-xs text-gray-500">{labels.currencyLabel}:</span>
          {SUPPORTED_CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => cartStore.setCurrency(c)}
              className={`text-xs px-2 py-1 rounded-full border ${cart.currency === c ? 'bg-[#d62013] text-white border-[#d62013]' : 'border-gray-300 text-gray-700 hover:border-[#d62013]'}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && entries.length === 0 ? (
            <p className="text-gray-500 italic">{labels.loading}</p>
          ) : entries.length === 0 ? (
            <p className="text-gray-500 italic">{labels.empty}</p>
          ) : (
            <ul className="space-y-4">
              {entries.map(({ product, qty }) => (
                <li key={product.slug} className="flex gap-3">
                  <img src={product.image} alt={product.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product.title}</p>
                    <p className="text-sm text-gray-500">{formatPrice(product.price[cart.currency], cart.currency, lang)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cartStore.setQuantity(product.slug, qty - 1)}
                        className="w-7 h-7 border border-gray-300 rounded text-gray-700 hover:border-[#d62013]"
                        aria-label="-"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm">{qty}</span>
                      <button
                        type="button"
                        onClick={() => cartStore.setQuantity(product.slug, qty + 1)}
                        className="w-7 h-7 border border-gray-300 rounded text-gray-700 hover:border-[#d62013]"
                        aria-label="+"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => cartStore.removeItem(product.slug)}
                        className="ml-auto text-xs text-gray-400 hover:text-[#d62013] underline"
                      >
                        {labels.remove}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {entries.length > 0 && (
          <footer className="border-t border-gray-100 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{labels.subtotal}</span>
              <span className="text-xl font-medium text-primary">{formatPrice(subtotal, cart.currency, lang)}</span>
            </div>
            <a
              href={labels.cartHref}
              className="block w-full text-center px-6 py-3 rounded text-white bg-[#d62013] border border-[#d62013] hover:bg-transparent hover:text-[#d62013] font-broskon transition-colors"
            >
              {labels.viewCart}
            </a>
            <button
              type="button"
              onClick={() => cartStore.clear()}
              className="block w-full text-center text-xs text-gray-400 hover:text-[#d62013] underline"
            >
              {labels.clear}
            </button>
          </footer>
        )}
      </aside>
    </>
  );
}
