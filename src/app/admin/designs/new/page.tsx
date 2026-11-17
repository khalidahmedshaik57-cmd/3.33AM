"use client";

import AdminGate from "@/components/admin/AdminGate";
import DesignForm from "@/components/admin/DesignForm";

export default function NewDesignPage() {
  return <AdminGate>{(token) => <div className="page-shell">
    <header className="page-header"><p className="eyebrow">Store management / Catalog</p><h1 className="page-title">New design.</h1></header>
    <DesignForm token={token} />
  </div>}</AdminGate>;
}
