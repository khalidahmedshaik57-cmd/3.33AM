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
  function addToBag() {
    const variant = design.variants.find((item) => item.id === selected);
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
      <button className="button button-dark add-button" onClick={addToBag}>Add to bag — {formatPrice(design.price)}</button>
      {message && <p className={message.startsWith("Choose") ? "inline-error" : "product-category"} role="status">{message}</p>}
      <p className="product-note">Free shipping on orders over ₹5,000. Easy exchanges within 14 days.</p>
      <p className="product-note">Fabric & care<br />Midweight cotton. Machine wash cold with similar colours.</p>
    </section>
  );
}
