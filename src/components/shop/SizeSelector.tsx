"use client";

export default function SizeSelector({
  variants,
  selected,
  onSelect
}: {
  variants: { id: string; size: string; stock: number }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="size-grid" aria-label="Choose a size">
      {variants.map((variant) => (
        <button
          key={variant.id}
          type="button"
          disabled={variant.stock < 1}
          aria-label={`${variant.size}, ${variant.stock < 1 ? "out of stock" : `${variant.stock} available`}`}
          aria-pressed={selected === variant.id}
          className={`size-button ${selected === variant.id ? "selected" : ""}`}
          onClick={() => onSelect(variant.id)}
        >
          {variant.size}
          <span className="size-stock-count">{variant.stock}</span>
          {variant.stock < 1 && <span className="sr-only"> sold out</span>}
        </button>
      ))}
    </div>
  );
}
