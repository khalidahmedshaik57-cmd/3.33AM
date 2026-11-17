"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/catalog";
import type { CartItem } from "@/types";

export default function CartItemRow({ item }: { item: CartItem }) {
  const { setQuantity, removeItem } = useCart();
  return (
    <article className="cart-item">
      <Link className="cart-thumb" href={`/design/${item.slug}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} />
      </Link>
      <div className="cart-item-info">
        <Link href={`/design/${item.slug}`} className="product-name">{item.name}</Link>
        <span className="product-category">Size {item.size}</span>
        <div className="quantity-control">
          <button onClick={() => setQuantity(item.variantId, item.quantity - 1)} aria-label={`Decrease ${item.name} quantity`}>−</button>
          <span>{item.quantity}</span>
          <button onClick={() => setQuantity(item.variantId, item.quantity + 1)} disabled={item.quantity >= item.stock} aria-label={`Increase ${item.name} quantity`}>+</button>
        </div>
        <button className="text-button remove-button" onClick={() => removeItem(item.variantId)}>Remove</button>
      </div>
      <span className="cart-line-price">{formatPrice(item.price * item.quantity)}</span>
    </article>
  );
}
