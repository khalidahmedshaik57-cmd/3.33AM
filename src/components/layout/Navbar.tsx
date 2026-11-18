"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { useShopper } from "@/context/ShopperContext";
import type { CustomerProfile } from "@/context/ShopperContext";
import { formatPrice } from "@/lib/catalog";

type Panel = "profile" | "favorites" | null;

function getAvailableVariant(variants: { id: string; size: string; stock: number }[]) {
  const available = variants.filter((variant) => variant.stock > 0);
  return ["M", "L", "S", "XL"].map((size) => available.find((variant) => variant.size === size)).find(Boolean)
    ?? available[0];
}

function Icon({ name }: { name: "profile" | "heart" | "bag" }) {
  if (name === "profile") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="nav-icon" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>;
  }
  if (name === "heart") {
    return <svg aria-hidden="true" viewBox="0 0 24 24" className="nav-icon" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.5 8.7c0 4.1-8.5 10-8.5 10s-8.5-5.9-8.5-10a4.5 4.5 0 0 1 8.5-2.1 4.5 4.5 0 0 1 8.5 2.1Z" /></svg>;
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="nav-icon" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 8h16l-1 12H5L4 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
}

export default function Navbar() {
  const { count, addEvent, addItem } = useCart();
  const { profile, favorites, saveProfile, removeFavorite } = useShopper();
  const [panel, setPanel] = useState<Panel>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [bagPulse, setBagPulse] = useState(false);

  useEffect(() => {
    if (!addEvent) return;
    setBagPulse(false);
    const frame = window.requestAnimationFrame(() => setBagPulse(true));
    const timeout = window.setTimeout(() => setBagPulse(false), 1800);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [addEvent]);

  useEffect(() => {
    if (!panel) return;
    const previousOverflow = document.body.style.overflow;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPanel(null);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [panel]);

  function openProfile() {
    setPanel("profile");
    setEditingProfile(!profile);
    setProfileMessage("");
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value: CustomerProfile = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      address: String(form.get("address") ?? "").trim(),
      city: String(form.get("city") ?? "").trim(),
      state: String(form.get("state") ?? "").trim(),
      postalCode: String(form.get("postalCode") ?? "").trim()
    };
    try {
      saveProfile(value);
      setEditingProfile(false);
      setProfileMessage("Profile saved on this device.");
    } catch (error) {
      console.error("Could not save the customer profile", error);
      setProfileMessage("Could not save your profile in this browser.");
    }
  }

  function moveFavoriteToBag(designId: string) {
    const design = favorites.find((item) => item.id === designId);
    if (!design || !design.images[0]) return;
    const variant = getAvailableVariant(design.variants);
    if (!variant) return;
    addItem({
      designId: design.id,
      variantId: variant.id,
      slug: design.slug,
      name: design.name,
      size: variant.size,
      image: design.images[0],
      price: design.price,
      quantity: 1,
      stock: variant.stock
    });
    removeFavorite(design.id);
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <Link className="wordmark" href="/" aria-label="3.33AM home">3.33<span>AM</span></Link>
          <nav className="main-nav" aria-label="Main navigation">
            <Link href="/shop">Shop</Link>
            <Link href="/shop?collection=001+—+After+Hours">Collections</Link>
            <a href="/#about">Our hours</a>
          </nav>
          <div className="nav-actions">
            <button type="button" className="nav-action" onClick={openProfile} aria-label="Open profile" aria-haspopup="dialog" aria-expanded={panel === "profile"}>
              <Icon name="profile" /><span className="nav-action-label">Profile</span>
            </button>
            <button type="button" className="nav-action nav-favorite-action" onClick={() => setPanel("favorites")} aria-label={`Open favorites, ${favorites.length} saved`} aria-haspopup="dialog" aria-expanded={panel === "favorites"}>
              <Icon name="heart" /><span className="nav-action-label">Saved</span><span className="nav-count">{favorites.length}</span>
            </button>
            <Link className={`bag-link ${bagPulse ? "bag-link-pulse" : ""}`} href="/cart" aria-label={`Shopping bag, ${count} items`}>
              <Icon name="bag" /><span className="nav-action-label">Bag</span><span className="bag-count">{count}</span>
              {bagPulse && <span key={addEvent} className="bag-star" aria-label="Item added">★</span>}
            </Link>
          </div>
        </div>
      </header>

      {panel && (
        <>
          <button type="button" className="drawer-backdrop" onClick={() => setPanel(null)} aria-label="Close drawer" />
          <aside className="store-drawer" role="dialog" aria-modal="true" aria-labelledby="store-drawer-title">
            <div className="store-drawer-heading">
              <div>
                <p className="eyebrow">{panel === "profile" ? "Your details" : "Your edit"}</p>
                <h2 id="store-drawer-title">{panel === "profile" ? "Profile." : "Favorites."}</h2>
              </div>
              <button type="button" className="drawer-close" onClick={() => setPanel(null)} aria-label="Close drawer">×</button>
            </div>

            {panel === "profile" && (
              <>
                <p className="drawer-note">Saved only in this browser. This storefront does not have account sign-in enabled.</p>
                {editingProfile ? (
                  <form className="profile-form" onSubmit={submitProfile}>
                    <label>Full name <span className="required-mark">*</span><input name="name" autoComplete="name" defaultValue={profile?.name ?? ""} minLength={2} required /></label>
                    <label>Email address <span className="required-mark">*</span><input name="email" type="email" autoComplete="email" defaultValue={profile?.email ?? ""} required /></label>
                    <label>Phone number <span className="required-mark">*</span><input name="phone" type="tel" autoComplete="tel" defaultValue={profile?.phone ?? ""} required pattern="^\+?[0-9\s()-]{7,20}$" /></label>
                    <label>Street address <span className="required-mark">*</span><input name="address" autoComplete="street-address" defaultValue={profile?.address ?? ""} minLength={5} required /></label>
                    <div className="form-grid">
                      <label>City<input name="city" autoComplete="address-level2" defaultValue={profile?.city ?? ""} required /></label>
                      <label>State<input name="state" autoComplete="address-level1" defaultValue={profile?.state ?? ""} required /></label>
                    </div>
                    <label>Pincode <span className="required-mark">*</span><input name="postalCode" autoComplete="postal-code" defaultValue={profile?.postalCode ?? ""} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></label>
                    <button className="button button-dark" type="submit">Save profile</button>
                  </form>
                ) : profile ? (
                  <div className="profile-details">
                    <p><span>Name</span>{profile.name}</p>
                    <p><span>Email</span>{profile.email}</p>
                    <p><span>Phone</span>{profile.phone}</p>
                    <p><span>Delivery address</span>{profile.address}, {profile.city}, {profile.state} {profile.postalCode}</p>
                    <button type="button" className="drawer-text-button" onClick={() => setEditingProfile(true)}>Edit profile</button>
                  </div>
                ) : null}
                {profileMessage && <p className="drawer-status" role="status">{profileMessage}</p>}
                <Link href="/account/orders" className="drawer-order-link" onClick={() => setPanel(null)}>Order history <span aria-hidden="true">↗</span></Link>
              </>
            )}

            {panel === "favorites" && (
              <div className="favorite-list">
                {favorites.length === 0 ? (
                  <div className="drawer-empty"><p>Nothing saved yet.</p><Link href="/shop" onClick={() => setPanel(null)}>Explore the collection ↗</Link></div>
                ) : favorites.map((design) => {
                  const variant = getAvailableVariant(design.variants);
                  return (
                    <article className="favorite-row" key={design.id}>
                      {design.images[0] && <img src={design.images[0]} alt="" />}
                      <div className="favorite-row-info">
                        <Link href={`/design/${design.slug}`} onClick={() => setPanel(null)}>{design.name}</Link>
                        <span>{formatPrice(design.price)}{variant ? ` · Size ${variant.size}` : " · Sold out"}</span>
                        <button type="button" disabled={!variant} onClick={() => moveFavoriteToBag(design.id)}>Move to bag</button>
                      </div>
                      <button type="button" className="favorite-remove" onClick={() => removeFavorite(design.id)} aria-label={`Remove ${design.name} from favorites`}>×</button>
                    </article>
                  );
                })}
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}
