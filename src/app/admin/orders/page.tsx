"use client";

import { useEffect, useState } from "react";
import AdminGate from "@/components/admin/AdminGate";
import { formatPrice } from "@/lib/catalog";

type OrderRow = { id: string; name: string; email: string; total: number; status: string; paymentMethod: string; createdAt: string };

function OrdersTable({ token }: { token: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/orders", { headers: { authorization: `Bearer ${token}` } })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Could not load orders.");
        setOrders(result);
      })
      .catch((issue: unknown) => setError(issue instanceof Error ? issue.message : "Could not load orders."));
  }, [token]);
  async function changeStatus(id: string, status: string) {
    const response = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error || "Could not update order.");
      return;
    }
    setOrders((current) => current.map((order) => order.id === id ? { ...order, status } : order));
  }
  return <div className="page-shell">
    <header className="page-header"><p className="eyebrow">Store management / Fulfilment</p><h1 className="page-title">Orders.</h1></header>
    {error && <p className="inline-error">{error}</p>}
    <div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id}>
        <td>{order.id}</td><td>{order.name}<span className="product-category">{order.email}</span></td>
        <td>{new Date(order.createdAt).toLocaleDateString()}</td><td>{order.paymentMethod.replace("_", " ")}</td><td>{formatPrice(order.total)}</td>
        <td><select value={order.status} onChange={(event) => changeStatus(order.id, event.target.value)}>
          {[order.status, ...(order.status === "PAID" || (order.status === "PENDING" && order.paymentMethod === "COD") ? ["PROCESSING"] : order.status === "PROCESSING" ? ["SHIPPED"] : order.status === "SHIPPED" ? ["DELIVERED"] : [])].map((status) => <option value={status} key={status}>{status}</option>)}
        </select></td>
      </tr>)}</tbody>
    </table></div>
  </div>;
}

export default function AdminOrdersPage() {
  return <AdminGate>{(token) => <OrdersTable token={token} />}</AdminGate>;
}
