"use client";

import Link from "next/link";
import CartItemRow from "@/components/cart/CartItemRow";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/catalog";

export default function CartPage() {
  const { items, subtotal } = useCart();
  const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 150;
  return (
    <div className="page-shell">
      <header className="page-header"><p className="eyebrow">The good stuff</p><h1 className="page-title">Your bag.</h1></header>
      {!items.length ? (
        <div className="empty-state"><h2>Nothing in here. Yet.</h2><p>Find something that feels like you.</p><Link className="button button-dark" href="/shop">Explore the shop</Link></div>
      ) : (
        <div className="cart-layout">
          <div>{items.map((item) => <CartItemRow item={item} key={item.variantId} />)}</div>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <div className="summary-line"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="summary-line"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : "On us"}</span></div>
            <div className="summary-line summary-total"><span>Total</span><span>{formatPrice(subtotal + shipping)}</span></div>
            <Link className="button button-dark" href="/checkout">Continue to checkout</Link>
            <p className="product-category">Taxes included. Shipping calculated by destination at checkout.</p>
          </aside>
        </div>
      )}
    </div>
  );
}
