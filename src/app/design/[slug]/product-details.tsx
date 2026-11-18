"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/catalog";
import type { DesignWithVariants } from "@/types";
import SizeSelector from "@/components/shop/SizeSelector";
import SizeChartModal from "@/components/shop/SizeChartModal";

export default function ProductDetails({ design }: { design: DesignWithVariants }) {
  const [selected, setSelected] = useState("");
  const [message, setMessage] = useState("");
  const { addItem } = useCart();
  const selectedVariant = design.variants.find((item) => item.id === selected);
  const hasAvailableSizes = design.variants.some((item) => item.stock > 0);
  function addToBag() {
    const variant = selectedVariant;
    if (!variant) {
      setMessage("Choose a size to continue.");
      return;
    }
    addItem({
      designId: design.id,
      variantId: variant.id,
      slug: design.slug,
      name: design.name,
      size: variant.size,
      image: design.images[0],
      price: design.price,
      quantity: 1,
      stock: variant.stock
    });
    setMessage("Added to your bag.");
  }
  return (
    <section className="detail-info">
      <p className="eyebrow">{design.collection} / {design.category}</p>
      <h1>{design.name}</h1>
      <p className="detail-price">{formatPrice(design.price)}</p>
      <p className="detail-description">{design.description}</p>
      <div className="size-label-row"><p className="field-label">Choose your size</p><SizeChartModal /></div>
      <SizeSelector variants={design.variants} selected={selected} onSelect={setSelected} />
      <p className={`stock-message detail-stock ${selectedVariant?.stock === 0 ? "stock-out" : selectedVariant && selectedVariant.stock <= 3 ? "stock-low" : ""}`} aria-live="polite">
        {selectedVariant
          ? selectedVariant.stock < 1
            ? "Out of Stock"
            : `${selectedVariant.stock <= 3 ? "Only " : ""}${selectedVariant.stock} ${selectedVariant.stock === 1 ? "piece" : "pieces"} available in Size ${selectedVariant.size}`
          : hasAvailableSizes ? "Select a size to check availability" : "Out of Stock"}
      </p>
      <button className="button button-dark add-button" onClick={addToBag} disabled={!selectedVariant || selectedVariant.stock < 1}>Add to bag — {formatPrice(design.price)}</button>
      {message && <p className={message.startsWith("Choose") ? "inline-error" : "product-category"} role="status">{message}</p>}
      <p className="product-note">Free shipping on orders over ₹5,000. Easy exchanges within 14 days.</p>
      <p className="product-note">Fabric & care<br />Midweight cotton. Machine wash cold with similar colours.</p>
    </section>
  );
}
