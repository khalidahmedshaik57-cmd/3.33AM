"use client";

import { useEffect, useState } from "react";
import ImageGallery from "@/components/shop/ImageGallery";
import ProductDetails from "./product-details";
import type { DesignWithVariants } from "@/types";

export default function RemoteDesign({ slug }: { slug: string }) {
  const [design, setDesign] = useState<DesignWithVariants | null>(null);
  const [notFound, setNotFound] = useState(false);
  useEffect(() => {
    fetch(`/api/designs/${encodeURIComponent(slug)}`)
      .then(async (response) => {
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (!response.ok) throw new Error("Unable to load this design.");
        setDesign(await response.json());
      })
      .catch((error: unknown) => {
        console.error("Could not load design", error);
        setNotFound(true);
      });
  }, [slug]);
  if (notFound) return <div className="page-shell"><h1 className="page-title">Piece not found.</h1><p className="detail-description">This piece may have moved on.</p></div>;
  if (!design) return <div className="page-shell"><p className="eyebrow">Loading this piece…</p></div>;
  return <div className="page-shell"><div className="detail-layout"><ImageGallery images={design.images} name={design.name} /><ProductDetails design={design} /></div></div>;
}
