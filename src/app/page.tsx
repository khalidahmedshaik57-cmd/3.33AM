"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import DesignCard from "@/components/shop/DesignCard";
import { designs } from "@/lib/catalog";
import type { DesignWithVariants } from "@/types";

export default function HomePage() {
  const [catalog, setCatalog] = useState<DesignWithVariants[]>(designs);
  useEffect(() => {
    fetch("/api/designs").then(async (response) => {
      if (!response.ok) return;
      const result: DesignWithVariants[] = await response.json();
      setCatalog(result);
    }).catch((error: unknown) => console.error("Could not refresh the catalog", error));
  }, []);
  const featured = catalog.filter((design) => design.featured).slice(0, 4);
  return (
    <>
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">Independent essentials · Est. 03:33</p>
          <h1>OWN YOUR<br /><span>HOURS.</span></h1>
          <div className="hero-bottom">
            <p className="hero-copy">Clothes for the time between who you were and who you&apos;re becoming. Made to live in, not just look at.</p>
            <Link href="/shop" className="button">Explore the collection <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">01 / Current rotation</p><h2>On repeat.</h2></div>
          <Link className="text-link" href="/shop">Shop everything ↗</Link>
        </div>
        <div className="product-grid">{featured.map((design) => <DesignCard key={design.id} design={design} />)}</div>
      </section>
      <section className="manifesto">
        <span className="eyebrow">The 3.33AM point of view</span>
        <p>Some of the best things happen when the rest of the world clocks out.</p>
      </section>
      <section className="section">
        <div className="section-heading">
          <div><p className="eyebrow">02 / Find your uniform</p><h2>Less, but better.</h2></div>
          <p className="hero-copy">Intentional shapes. Everyday materials. Pieces that make getting dressed feel like less of a decision.</p>
        </div>
        <div className="product-grid">{catalog.slice(0, 4).map((design) => <DesignCard key={design.id} design={design} />)}</div>
      </section>
    </>
  );
}
