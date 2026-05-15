import { useState } from 'react';
import { cartStore } from '../../lib/shop/cart-store';
import { useCart } from '../../lib/shop/use-cart';
import { useProducts, productIndexBySlug } from '../../lib/shop/use-products';
import { formatPrice, SUPPORTED_CURRENCIES } from '../../lib/shop/currency';
import type { Lang } from '../../i18n/ui';

interface Labels {
  empty: string;
  continueShopping: string;
  remove: string;
  subtotal: string;
  total: string;
  checkout: string;
  clear: string;
  loading: string;
  currencyLabel: string;
  shopHref: string;
  emailLabel: string;
  emailPlaceholder: string;
  emailHint: string;
  processing: string;
  checkoutError: string;
  secureCheckout: string;
}

interface Props {
  lang: Lang;
  labels: Labels;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CartView({ lang, labels }: Props) {
  const cart = useCart();
  const { products, loading } = useProducts();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const index = productIndexBySlug(products);
  const entries = Object.entries(cart.items)
    .map(([slug, qty]) => {
      const product = index.get(slug);
      if (!product) return null;
      return { product, qty };
    })
    .filter((e): e is { product: NonNullable<ReturnType<typeof index.get>>; qty: number } => e !== null);

  const total = entries.reduce((sum, { product, qty }) => sum + product.price[cart.currency] * qty, 0);
  const emailValid = EMAIL_RE.test(email.trim());

  const handleCheckout = async () => {
    if (!emailValid || submitting || entries.length === 0) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          currency: cart.currency,
          items: entries.map(({ product, qty }) => ({ slug: product.slug, quantity: qty })),
          lang,
        }),
      });
      if (!orderRes.ok) throw new Error('order_failed');
      const orderData = (await orderRes.json()) as { order: { id: string } };

      const sessionRes = await fetch('/api/checkout/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderData.order.id, lang }),
      });
      if (!sessionRes.ok) throw new Error('session_failed');
      const sessionData = (await sessionRes.json()) as { url: string };
      window.location.href = sessionData.url;
    } catch (err) {
      console.error('[checkout] failed:', err);
      setErrorMsg(labels.checkoutError);
      setSubmitting(false);
    }
  };

  if (loading && entries.length === 0) {
    return <p className="text-gray-500 italic">{labels.loading}</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 italic mb-6">{labels.empty}</p>
        <a
          href={labels.shopHref}
          className="inline-flex items-center px-6 py-3 rounded text-white bg-[#d62013] border border-[#d62013] hover:bg-transparent hover:text-[#d62013] font-broskon transition-colors"
        >
          {labels.continueShopping}
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{labels.currencyLabel}:</span>
        {SUPPORTED_CURRENCIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => cartStore.setCurrency(c)}
            className={`text-sm px-3 py-1 rounded-full border ${cart.currency === c ? 'bg-[#d62013] text-white border-[#d62013]' : 'border-gray-300 text-gray-700 hover:border-[#d62013]'}`}
          >
            {c}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-gray-100 border-t border-b border-gray-100">
        {entries.map(({ product, qty }) => {
          const lineTotal = product.price[cart.currency] * qty;
          return (
            <li key={product.slug} className="py-5 flex gap-4">
              <img src={product.image} alt={product.title} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{product.title}</p>
                <p className="text-sm text-gray-500 mt-1">{formatPrice(product.price[cart.currency], cart.currency, lang)}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cartStore.setQuantity(product.slug, qty - 1)}
                    className="w-8 h-8 border border-gray-300 rounded text-gray-700 hover:border-[#d62013]"
                  >
                    −
                  </button>
                  <span className="w-10 text-center">{qty}</span>
                  <button
                    type="button"
                    onClick={() => cartStore.setQuantity(product.slug, qty + 1)}
                    className="w-8 h-8 border border-gray-300 rounded text-gray-700 hover:border-[#d62013]"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => cartStore.removeItem(product.slug)}
                    className="ml-4 text-xs text-gray-400 hover:text-[#d62013] underline"
                  >
                    {labels.remove}
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-medium text-primary">{formatPrice(lineTotal, cart.currency, lang)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="md:w-1/2">
          <label htmlFor="checkout-email" className="block text-sm text-gray-700 mb-2">
            {labels.emailLabel}
          </label>
          <input
            id="checkout-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={labels.emailPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#d62013] focus:ring-1 focus:ring-[#d62013]"
          />
          <p className="text-xs text-gray-500 mt-1 italic">{labels.emailHint}</p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-6 text-xl">
            <span className="text-gray-600">{labels.total}</span>
            <span className="font-medium text-primary text-2xl">{formatPrice(total, cart.currency, lang)}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={!emailValid || submitting}
            className="inline-flex items-center px-8 py-3 rounded text-white bg-[#d62013] border border-[#d62013] hover:bg-transparent hover:text-[#d62013] font-broskon transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#d62013] disabled:hover:text-white"
          >
            {submitting ? labels.processing : labels.checkout}
          </button>
          <p className="text-xs text-gray-400 italic">{labels.secureCheckout}</p>
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
          <button
            type="button"
            onClick={() => cartStore.clear()}
            className="text-xs text-gray-400 hover:text-[#d62013] underline"
          >
            {labels.clear}
          </button>
        </div>
      </div>
    </div>
  );
}
