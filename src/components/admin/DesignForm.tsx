"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function DesignForm({ token }: { token: string }) {
  const [status, setStatus] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const variants = String(formData.get("variants") || "")
      .split(",")
      .map((size) => size.trim().toUpperCase())
      .filter(Boolean)
      .map((size) => ({ size, sku: `${String(formData.get("slug"))}-${size}`.toUpperCase(), stock: 5 }));
    try {
      const response = await fetch("/api/designs", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.get("name"),
          slug: formData.get("slug"),
          description: formData.get("description"),
          category: formData.get("category"),
          collection: formData.get("collection"),
          price: Number(formData.get("price")),
          images: String(formData.get("images") || "").split(",").map((image) => image.trim()).filter(Boolean),
          published: true,
          featured: false,
          variants
        })
      });
      const result = await response.json();
      setStatus(response.ok ? "Design created." : result.error || "Could not create design.");
    } catch {
      setStatus("Could not connect to the store.");
    }
  }
  return (
    <form className="admin-form" onSubmit={submit}>
      <label>Name<input name="name" required /></label>
      <label>Slug<input name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
      <label>Description<textarea name="description" minLength={10} required /></label>
      <div className="form-grid"><label>Category<input name="category" required /></label><label>Collection<input name="collection" required /></label></div>
      <div className="form-grid"><label>Price (INR)<input name="price" type="number" min="1" required /></label><label>Sizes, comma separated<input name="variants" placeholder="S, M, L, XL" required /></label></div>
      <label>Image URLs, comma separated<input name="images" type="text" placeholder="https://…/front.jpg, https://…/back.jpg" required /></label>
      <button className="button button-dark" type="submit">Create design</button>
      {status && <p role="status">{status}</p>}
    </form>
  );
}
