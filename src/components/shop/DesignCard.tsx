import Link from "next/link";
import type { DesignWithVariants } from "@/types";
import { formatPrice } from "@/lib/catalog";

export default function DesignCard({ design }: { design: DesignWithVariants }) {
  return (
    <article className="product-card">
      <Link href={`/design/${design.slug}`} className="product-image-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="product-image" src={design.images[0]} alt={design.name} />
        {design.images[1] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="product-image product-image-hover" src={design.images[1]} alt="" />
        )}
        <span className="image-index">{design.collection}</span>
      </Link>
      <div className="product-meta">
        <div><Link href={`/design/${design.slug}`} className="product-name">{design.name}</Link><span className="product-category">{design.category}</span></div>
        <span className="product-price">{formatPrice(design.price)}</span>
      </div>
    </article>
  );
}
