"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

function SuccessContent() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const isCashOnDelivery = params.get("method") === "cod";
  const { clearCart } = useCart();
  useEffect(() => {
    if (orderId) clearCart();
  }, [orderId, clearCart]);
  return (
    <div className="page-shell">
      <div className="success-mark" aria-hidden="true">✓</div>
      <p className="eyebrow">Order received</p>
      <h1 className="page-title">This is the start<br />of a good thing.</h1>
      <p className="detail-description">{isCashOnDelivery
        ? "Your cash-on-delivery order is confirmed. Please pay the delivery partner when it arrives."
        : "Your payment was completed and we&apos;re getting your order ready."}</p>
      {orderId && <p className="product-category">Order reference: {orderId}</p>}
      <Link href="/shop" className="button button-dark">Back to the collection</Link>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return <Suspense fallback={<div className="page-shell"><p className="eyebrow">Confirming your order…</p></div>}><SuccessContent /></Suspense>;
}
