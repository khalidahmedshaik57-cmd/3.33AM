"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { formatPrice } from "@/lib/catalog";

type OrderInfo = { id: string; status: string; createdAt: string; total: number; items: { name: string; size: string; quantity: number }[] };

export default function AccountOrdersPage() {
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [error, setError] = useState("");
  async function lookup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOrder(null);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(String(form.get("id")))}?email=${encodeURIComponent(String(form.get("email")))}`);
      const result = await response.json();
      if (!response.ok) setError(result.error || "Order not found.");
      else setOrder(result);
    } catch {
      setError("Could not reach the store. Please try again.");
    }
  }
  return (
    <div className="page-shell">
      <header className="page-header"><p className="eyebrow">Keep an eye on it</p><h1 className="page-title">Your orders.</h1></header>
      <p className="detail-description">Enter your order reference and the email used at checkout to see the latest update.</p>
      <form className="checkout-form" onSubmit={lookup} style={{ maxWidth: 520 }}>
        <label>Order reference<input name="id" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <button className="button button-dark">Find my order</button>
      </form>
      {error && <p className="inline-error" role="alert">{error}</p>}
      {order && <section className="summary-card" style={{ maxWidth: 520, marginTop: 30 }}>
        <p className="eyebrow">Order {order.id}</p><h2>{order.status}</h2>
        <p className="product-category">{new Date(order.createdAt).toLocaleDateString()}</p>
        {order.items.map((item, index) => <div className="summary-line" key={`${item.name}-${index}`}><span>{item.name} · {item.size} × {item.quantity}</span></div>)}
        <div className="summary-line summary-total"><span>Order total</span><span>{formatPrice(order.total)}</span></div>
      </section>}
    </div>
  );
}
