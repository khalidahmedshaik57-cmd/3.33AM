"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";
import { formatPrice } from "@/lib/catalog";

type DesignRow = {
  id: string; name: string; slug: string; category: string; price: number; published: boolean;
  variants: { id: string; size: string; stock: number }[];
};

function DesignsTable({ token }: { token: string }) {
  const [designs, setDesigns] = useState<DesignRow[]>([]);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/designs?admin=true", { headers: { authorization: `Bearer ${token}` } });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load designs.");
    setDesigns(result);
  }, [token]);
  useEffect(() => { load().catch((issue: unknown) => setError(issue instanceof Error ? issue.message : "Could not load designs.")); }, [load]);

  async function update(id: string, data: object) {
    const response = await fetch(`/api/designs/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error || "Update failed.");
      return;
    }
    await load();
  }
  return (
    <div className="page-shell">
      <header className="page-header"><p className="eyebrow">Store management / Catalog</p><h1 className="page-title">Designs.</h1></header>
      <div className="admin-actions"><Link className="button button-dark" href="/admin/designs/new">Add a design</Link></div>
      {error && <p className="inline-error">{error}</p>}
      <div style={{ overflowX: "auto" }}>
        <table className="admin-table"><thead><tr><th>Design</th><th>Price</th><th>Sizes / stock</th><th>Visibility</th></tr></thead>
          <tbody>{designs.map((design) => <tr key={design.id}>
            <td>{design.name}<span className="product-category">{design.slug}</span></td>
            <td>{formatPrice(design.price)}</td>
            <td>{design.variants.map((variant) => <label key={variant.id} style={{ display: "inline-flex", gap: 5, marginRight: 10, alignItems: "center" }}>
              <span>{variant.size}</span><input aria-label={`${variant.size} stock`} type="number" min="0" defaultValue={variant.stock} style={{ width: 58, padding: 6 }} onBlur={(event) => {
                const stock = Number(event.currentTarget.value);
                if (stock !== variant.stock) update(design.id, { variants: [{ id: variant.id, stock }] }).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : "Update failed."));
              }} />
            </label>)}</td>
            <td><button className="text-button" onClick={() => update(design.id, { published: !design.published }).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : "Update failed."))}>{design.published ? "Published — hide" : "Hidden — publish"}</button></td>
          </tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}

export default function AdminDesignsPage() {
  return <AdminGate>{(token) => <DesignsTable token={token} />}</AdminGate>;
}
