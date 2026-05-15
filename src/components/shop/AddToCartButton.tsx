import { useState } from 'react';
import { cartStore } from '../../lib/shop/cart-store';
import { useCart } from '../../lib/shop/use-cart';

interface Props {
  slug: string;
  label: string;
  addedLabel?: string;
}

export default function AddToCartButton({ slug, label, addedLabel }: Props) {
  const cart = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const inCart = (cart.items[slug] ?? 0) > 0;

  const handleClick = () => {
    cartStore.addItem(slug, 1);
    setJustAdded(true);
    window.dispatchEvent(new CustomEvent('cart:open'));
    setTimeout(() => setJustAdded(false), 1200);
  };

  const displayLabel = justAdded && addedLabel ? addedLabel : label;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center font-broskon font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer text-white bg-[#d62013] border border-[#d62013] hover:bg-transparent hover:text-[#d62013] focus:ring-[#d62013] shadow-sm px-6 py-3 text-base"
    >
      {displayLabel}
      {inCart && <span className="ml-2 text-xs opacity-80">({cart.items[slug]})</span>}
    </button>
  );
}
