"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";

type Summary = { orders: { id: string; total: number; status: string }[]; designs: { id: string; variants: { stock: number }[] }[] };

function Dashboard({ token }: { token: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      fetch("/api/orders", { headers: { authorization: `Bearer ${token}` } }),
      fetch("/api/designs?admin=true", { headers: { authorization: `Bearer ${token}` } })
    ]).then(async ([ordersResponse, designsResponse]) => {
      if (!ordersResponse.ok || !designsResponse.ok) throw new Error("Could not load store data.");
      const [orders, designs] = await Promise.all([ordersResponse.json(), designsResponse.json()]);
      setSummary({ orders, designs });
    }).catch((issue: unknown) => setError(issue instanceof Error ? issue.message : "Could not load store data."));
  }, [token]);
  const lowStock = summary?.designs.flatMap((design) => design.variants).filter((variant) => variant.stock < 3).length ?? 0;
  const sales = summary?.orders.filter((order) => ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status)).reduce((sum, order) => sum + order.total, 0) ?? 0;
  return (
    <div className="page-shell">
      <header className="page-header"><p className="eyebrow">Store management</p><h1 className="page-title">Dashboard.</h1></header>
      {error && <p className="inline-error">{error}</p>}
      {summary && <div className="product-grid">
        <div className="summary-card"><p className="eyebrow">Orders</p><h2>{summary.orders.length}</h2></div>
        <div className="summary-card"><p className="eyebrow">Paid sales</p><h2>₹{sales.toLocaleString("en-IN")}</h2></div>
        <div className="summary-card"><p className="eyebrow">Low-stock sizes</p><h2>{lowStock}</h2></div>
        <div className="summary-card"><p className="eyebrow">Designs</p><h2>{summary.designs.length}</h2></div>
      </div>}
      <div className="admin-actions"><Link className="button" href="/admin/designs">Manage designs</Link><Link className="button" href="/admin/orders">Manage orders</Link></div>
    </div>
  );
}

export default function AdminPage() {
  return <AdminGate>{(token) => <Dashboard token={token} />}</AdminGate>;
}
