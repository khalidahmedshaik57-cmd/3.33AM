import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useShopper } from "@/context/ShopperContext";
import type { DesignWithVariants } from "@/types";
import { formatPrice } from "@/lib/catalog";

export default function DesignCard({ design }: { design: DesignWithVariants }) {
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const { addItem } = useCart();
  const { favorites, toggleFavorite } = useShopper();
  const selectedVariant = design.variants.find((variant) => variant.id === selectedId);
  const hasAvailableSizes = design.variants.some((variant) => variant.stock > 0);
  const isFavorite = favorites.some((item) => item.id === design.id);

  function addToBag() {
    if (!selectedVariant || selectedVariant.stock < 1 || !design.images[0]) return;
    addItem({
      designId: design.id,
      variantId: selectedVariant.id,
      slug: design.slug,
      name: design.name,
      size: selectedVariant.size,
      image: design.images[0],
      price: design.price,
      quantity: 1,
      stock: selectedVariant.stock
    });
    setMessage(`${design.name} · ${selectedVariant.size} added to bag.`);
  }

  return (
    <article className="product-card">
      <div className="product-image-wrap">
        <Link href={`/design/${design.slug}`} className="product-image-link" aria-label={`View ${design.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="product-image" src={design.images[0]} alt={design.name} />
        {design.images[1] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="product-image product-image-hover" src={design.images[1]} alt="" />
        )}
        <span className="image-index">{design.collection}</span>
        </Link>
        <button
          type="button"
          className={`favorite-toggle ${isFavorite ? "active" : ""}`}
          onClick={() => toggleFavorite(design)}
          aria-pressed={isFavorite}
          aria-label={isFavorite ? `Remove ${design.name} from favorites` : `Add ${design.name} to favorites`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
            <path d="M20.5 8.7c0 4.1-8.5 10-8.5 10s-8.5-5.9-8.5-10a4.5 4.5 0 0 1 8.5-2.1 4.5 4.5 0 0 1 8.5 2.1Z" />
          </svg>
        </button>
      </div>
      <div className="product-meta">
        <div><Link href={`/design/${design.slug}`} className="product-name">{design.name}</Link><span className="product-category">{design.category}</span></div>
        <span className="product-price">{formatPrice(design.price)}</span>
      </div>
      <div className="card-stock-controls">
        <div className="card-size-options" role="group" aria-label={`Choose a size for ${design.name}`}>
          {design.variants.map((variant) => (
            <button
              type="button"
              key={variant.id}
              disabled={variant.stock < 1}
              aria-pressed={selectedId === variant.id}
              aria-label={`${variant.size}, ${variant.stock} available`}
              className={`card-size-button ${selectedId === variant.id ? "selected" : ""}`}
              onClick={() => {
                setSelectedId(variant.id);
                setMessage("");
              }}
            >
              {variant.size}<span>{variant.stock}</span>
            </button>
          ))}
        </div>
        <p className={`stock-message ${selectedVariant?.stock === 0 ? "stock-out" : selectedVariant && selectedVariant.stock <= 3 ? "stock-low" : ""}`} aria-live="polite">
          {selectedVariant
            ? selectedVariant.stock === 0
              ? "Out of Stock"
              : `${selectedVariant.stock <= 3 ? "Only " : ""}${selectedVariant.stock} ${selectedVariant.stock === 1 ? "piece" : "pieces"} available in Size ${selectedVariant.size}`
            : hasAvailableSizes ? "Select a size to check availability" : "Out of Stock"}
        </p>
        <button className="card-add-button" type="button" onClick={addToBag} disabled={!selectedVariant || selectedVariant.stock < 1}>
          Add to bag <span aria-hidden="true">↗</span>
        </button>
        {message && <p className="card-add-message" role="status">{message}</p>}
      </div>
    </article>
  );
}
