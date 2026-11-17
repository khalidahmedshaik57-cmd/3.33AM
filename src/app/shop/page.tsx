"use client";

import { useMemo, useState } from "react";
import { useEffect } from "react";
import DesignCard from "@/components/shop/DesignCard";
import FilterBar from "@/components/shop/FilterBar";
import { designs } from "@/lib/catalog";
import type { DesignWithVariants } from "@/types";

export default function ShopPage() {
  const [category, setCategory] = useState("All");
  const [collection, setCollection] = useState("All");
  const [size, setSize] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [catalog, setCatalog] = useState<DesignWithVariants[]>(designs);
  useEffect(() => {
    fetch("/api/designs").then(async (response) => {
      if (!response.ok) return;
      const result: DesignWithVariants[] = await response.json();
      setCatalog(result);
    }).catch((error: unknown) => console.error("Could not refresh the catalog", error));
  }, []);
  const categories = [...new Set(catalog.map((design) => design.category))];
  const collections = [...new Set(catalog.map((design) => design.collection))];
  const products = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const filtered = catalog.filter((design) =>
      (category === "All" || design.category === category) &&
      (collection === "All" || design.collection === collection) &&
      (size === "All" || design.variants.some((variant) => variant.size === size && variant.stock > 0)) &&
      (!query || `${design.name} ${design.description} ${design.category} ${design.collection}`.toLocaleLowerCase().includes(query))
    );
    if (sort === "price-low") return [...filtered].sort((a, b) => a.price - b.price);
    if (sort === "price-high") return [...filtered].sort((a, b) => b.price - a.price);
    if (sort === "name") return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [catalog, category, collection, search, size, sort]);

  return (
    <div className="page-shell">
      <header className="page-header"><p className="eyebrow">The collection / 2026</p><h1 className="page-title">Things to live in.</h1></header>
      <FilterBar
        category={category}
        setCategory={setCategory}
        categories={categories}
        collection={collection}
        setCollection={setCollection}
        collections={collections}
        size={size}
        setSize={setSize}
        search={search}
        setSearch={setSearch}
        sort={sort}
        setSort={setSort}
      />
      <div className="product-grid">{products.map((design) => <DesignCard key={design.id} design={design} />)}</div>
      {products.length === 0 && <p>No pieces in this category just yet.</p>}
    </div>
  );
}
