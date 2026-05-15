import { useCart } from '../../lib/shop/use-cart';

interface Props {
  href: string;
  ariaLabel: string;
}

export default function CartBadge({ href, ariaLabel }: Props) {
  const cart = useCart();
  const count = Object.values(cart.items).reduce((sum, q) => sum + q, 0);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('cart:open'));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      aria-label={ariaLabel}
      className="relative inline-flex items-center justify-center text-gray-800 hover:text-gray-600 transition-colors"
    >
      <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-2.5-5M7 13l-1.6 4.5a1 1 0 00.94 1.34h11.32" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-[#d62013] text-white text-[10px] leading-none font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </a>
  );
}
