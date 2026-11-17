"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/catalog";

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 150;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          address: form.get("address"),
          city: form.get("city"),
          postalCode: form.get("postalCode"),
          country: form.get("country"),
          items: items.map(({ variantId, quantity }) => ({ variantId, quantity }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn't start checkout. Please try again.");
      if (!result.checkoutUrl) throw new Error("Online checkout is not available right now.");
      window.location.assign(result.checkoutUrl);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!items.length) return <div className="page-shell"><div className="empty-state"><h1 className="page-title">Your bag is empty.</h1><Link className="button button-dark" href="/shop">Shop the collection</Link></div></div>;

  return (
    <div className="page-shell">
      <header className="page-header"><p className="eyebrow">Almost yours</p><h1 className="page-title">Checkout.</h1></header>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <div className="form-grid"><label>Full name<input name="name" autoComplete="name" required minLength={2} /></label><label>Email<input name="email" type="email" autoComplete="email" required /></label></div>
          <label>Phone<input name="phone" type="tel" autoComplete="tel" required /></label>
          <label>Address<input name="address" autoComplete="street-address" required minLength={5} /></label>
          <div className="form-grid"><label>City<input name="city" autoComplete="address-level2" required /></label><label>Postal code<input name="postalCode" autoComplete="postal-code" required /></label></div>
          <label>Country<input name="country" autoComplete="country-name" defaultValue="India" required /></label>
          {error && <p className="checkout-alert inline-error" role="alert">{error}</p>}
          <button className="button button-dark" disabled={loading}>{loading ? "Connecting securely…" : "Continue to secure payment"}</button>
          <p className="product-category">Your payment details are entered securely on Stripe.</p>
        </form>
        <aside className="summary-card">
          <h2>In your bag</h2>
          {items.map((item) => <div className="summary-line" key={item.variantId}><span>{item.name} · {item.size} × {item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}
          <div className="summary-line"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : "On us"}</span></div>
          <div className="summary-line summary-total"><span>Total</span><span>{formatPrice(subtotal + shipping)}</span></div>
        </aside>
      </div>
    </div>
  );
}
