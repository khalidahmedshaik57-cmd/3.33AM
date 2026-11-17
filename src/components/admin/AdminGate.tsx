"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

export default function AdminGate({ children }: { children: (token: string) => ReactNode }) {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = window.sessionStorage.getItem("333am-admin-token");
    if (saved) setToken(saved);
  }, []);

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const response = await fetch("/api/designs?admin=true", {
        headers: { authorization: `Bearer ${input}` }
      });
      if (!response.ok) {
        setError(response.status === 401 ? "That token was not accepted." : "Could not connect to the store.");
        return;
      }
      window.sessionStorage.setItem("333am-admin-token", input);
      setToken(input);
    } catch {
      setError("Could not connect to the store.");
    }
  }

  if (token) return <>{children(token)}</>;
  return (
    <div className="page-shell">
      <header className="page-header"><p className="eyebrow">Store management</p><h1 className="page-title">Admin access.</h1></header>
      <form className="checkout-form" onSubmit={authenticate} style={{ maxWidth: 430 }}>
        <label>Admin API token<input type="password" value={input} onChange={(event) => setInput(event.target.value)} required autoComplete="current-password" /></label>
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button className="button button-dark">Continue</button>
      </form>
    </div>
  );
}
