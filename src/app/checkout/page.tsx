"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useCart } from "@/context/CartContext";
import { useShopper } from "@/context/ShopperContext";
import { formatPrice } from "@/lib/catalog";

type PaymentMethod = "CREDIT_CARD" | "DEBIT_CARD" | "UPI" | "COD" | "NET_BANKING" | "WALLET_BNPL";
type DeliveryDetails = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};
type ReverseGeocodeResult = {
  address?: {
    house_number?: string;
    road?: string;
    pedestrian?: string;
    footway?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    postcode?: string;
  };
};

const EMPTY_DELIVERY: DeliveryDetails = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "India"
};
const PAYMENT_METHODS: { id: PaymentMethod; name: string; caption: string }[] = [
  { id: "UPI", name: "UPI", caption: "GPay · PhonePe · Paytm · BHIM" },
  { id: "CREDIT_CARD", name: "Credit card", caption: "Secure card entry via Stripe" },
  { id: "DEBIT_CARD", name: "Debit card", caption: "Bank verification via Stripe" },
  { id: "COD", name: "Cash on delivery", caption: "Pay when your order arrives" },
  { id: "NET_BANKING", name: "Net banking", caption: "Choose an available bank securely" },
  { id: "WALLET_BNPL", name: "Wallets / BNPL", caption: "Options depend on availability" }
];

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 60_000,
      timeout: 15_000
    });
  });
}

function getLocationError(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return "Location permission was denied. You can enter your address manually.";
  if (error.code === error.POSITION_UNAVAILABLE) return "Your location is unavailable. Try again or enter your address manually.";
  if (error.code === error.TIMEOUT) return "Location lookup timed out. Try again or enter your address manually.";
  return "Could not get your location. Please enter your address manually.";
}

function isGeolocationError(error: unknown): error is GeolocationPositionError {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "number";
}

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const { profile, hydrated } = useShopper();
  const [delivery, setDelivery] = useState(EMPTY_DELIVERY);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CREDIT_CARD");
  const [error, setError] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [locationBusy, setLocationBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const shipping = subtotal >= 5000 || subtotal === 0 ? 0 : 150;

  useEffect(() => {
    if (!hydrated) return;
    if (profile) {
      setDelivery({
        name: profile.name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        state: profile.state,
        postalCode: profile.postalCode,
        country: "India"
      });
    }
  }, [profile, hydrated]);

  function updateDelivery(field: keyof DeliveryDetails, value: string) {
    setDelivery((current) => ({ ...current, [field]: value }));
  }

  async function fillLiveLocation() {
    setLocationBusy(true);
    setLocationMessage("");
    try {
      if (!navigator.geolocation) {
        setLocationMessage("Location access is not available in this browser.");
        return;
      }
      const position = await getCurrentPosition();
      const url = new URL("https://nominatim.openstreetmap.org/reverse");
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("lat", String(position.coords.latitude));
      url.searchParams.set("lon", String(position.coords.longitude));
      const response = await fetch(url.toString(), { headers: { "Accept-Language": "en" } });
      if (!response.ok) throw new Error("Address lookup failed.");
      const result = await response.json() as ReverseGeocodeResult;
      const address = result.address;
      if (!address) throw new Error("No address details were returned.");
      const street = [address.house_number, address.road ?? address.pedestrian ?? address.footway]
        .filter(Boolean)
        .join(" ");
      const city = address.city ?? address.town ?? address.village ?? address.municipality ?? "";
      const filled = [street, city, address.state, address.postcode].filter(Boolean).length;
      setDelivery((current) => ({
        ...current,
        address: street || current.address,
        city: city || current.city,
        state: address.state || current.state,
        postalCode: address.postcode || current.postalCode
      }));
      setLocationMessage(filled > 0
        ? "Location details filled. Please verify them before placing your order."
        : "No delivery address details were found nearby. Please enter them manually.");
    } catch (issue) {
      setLocationMessage(isGeolocationError(issue)
        ? getLocationError(issue)
        : "Could not look up your address. Please enter it manually.");
    } finally {
      setLocationBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...delivery,
          paymentMethod,
          items: items.map(({ variantId, quantity }) => ({ variantId, quantity }))
        })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "We couldn't start checkout. Please try again.");
      if (result.cashOnDelivery && result.orderId) {
        window.location.assign(`/checkout/success?order=${encodeURIComponent(result.orderId)}&method=cod`);
        return;
      }
      if (typeof result.checkoutUrl !== "string") throw new Error("Online checkout is not available right now.");
      window.location.assign(result.checkoutUrl);
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!items.length) return <div className="page-shell"><div className="empty-state"><h1 className="page-title">Your bag is empty.</h1><Link className="button button-dark" href="/shop">Shop the collection</Link></div></div>;

  return (
    <div className="page-shell checkout-page">
      <header className="page-header"><p className="eyebrow">Almost yours</p><h1 className="page-title">Checkout.</h1></header>
      <div className="checkout-layout">
        <form className="checkout-form" onSubmit={submit}>
          <div className="checkout-section-heading"><span>01</span><h2>Delivery details</h2></div>
          <div className="form-grid">
            <label>Full name <span className="required-mark">*</span><input name="name" autoComplete="name" value={delivery.name} onChange={(event) => updateDelivery("name", event.target.value)} minLength={2} required /></label>
            <label>Email address <span className="required-mark">*</span><input name="email" type="email" autoComplete="email" value={delivery.email} onChange={(event) => updateDelivery("email", event.target.value)} required /></label>
          </div>
          <label>Phone number <span className="required-mark">*</span><input name="phone" type="tel" autoComplete="tel" value={delivery.phone} onChange={(event) => updateDelivery("phone", event.target.value)} pattern="^\+?[0-9\s()-]{7,20}$" required /></label>
          <div className="address-field">
            <label>Street address <span className="required-mark">*</span><input name="address" autoComplete="street-address" value={delivery.address} onChange={(event) => updateDelivery("address", event.target.value)} minLength={5} required /></label>
            <button type="button" className="location-button" onClick={fillLiveLocation} disabled={locationBusy}>
              {locationBusy ? "Finding you…" : "◎ Use live location"}
            </button>
          </div>
          {locationMessage && <p className="location-status" role="status">{locationMessage}</p>}
          <div className="form-grid">
            <label>City<input name="city" autoComplete="address-level2" value={delivery.city} onChange={(event) => updateDelivery("city", event.target.value)} required /></label>
            <label>State<input name="state" autoComplete="address-level1" value={delivery.state} onChange={(event) => updateDelivery("state", event.target.value)} required /></label>
          </div>
          <div className="form-grid">
            <label>Pincode <span className="required-mark">*</span><input name="postalCode" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={delivery.postalCode} onChange={(event) => updateDelivery("postalCode", event.target.value)} required /></label>
            <label>Country<input name="country" autoComplete="country-name" value={delivery.country} onChange={(event) => updateDelivery("country", event.target.value)} required /></label>
          </div>
          <p className="location-attribution">Location results by OpenStreetMap contributors. Please verify before continuing.</p>

          <div className="checkout-section-heading"><span>02</span><h2>Payment method</h2></div>
          <div className="payment-method-grid" role="radiogroup" aria-label="Choose a payment method">
            {PAYMENT_METHODS.map((method) => (
              <button
                type="button"
                role="radio"
                aria-checked={paymentMethod === method.id}
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`payment-method-card ${paymentMethod === method.id ? "selected" : ""}`}
              >
                <span className="payment-radio" aria-hidden="true" />
                <span><strong>{method.name}</strong><small>{method.caption}</small></span>
              </button>
            ))}
          </div>
          <div className="payment-detail-panel">
            {paymentMethod === "UPI" && (
              <>
                <strong>GPay · PhonePe · Paytm · BHIM</strong>
                <p>Continue to Stripe to use an available UPI app or enter your UPI details securely.</p>
              </>
            )}
            {(paymentMethod === "CREDIT_CARD" || paymentMethod === "DEBIT_CARD") && (
              <>
                <strong>{paymentMethod === "CREDIT_CARD" ? "Credit card" : "Debit card"} · Secure checkout</strong>
                <p>Card number, expiry, security code, and any bank verification are entered on Stripe. This store never collects your card security code, ATM PIN, or OTP.</p>
              </>
            )}
            {paymentMethod === "COD" && (
              <>
                <strong>Pay when it arrives</strong>
                <p>Your size is reserved and the order is placed now. Pay the delivery partner when your package arrives.</p>
              </>
            )}
            {paymentMethod === "NET_BANKING" && (
              <>
                <strong>Net banking</strong>
                <p>Eligible banks and bank sign-in are shown by Stripe during secure checkout.</p>
              </>
            )}
            {paymentMethod === "WALLET_BNPL" && (
              <>
                <strong>Wallets / Buy now, pay later</strong>
                <p>Available wallet and instalment options depend on your location, basket, and Stripe account configuration.</p>
              </>
            )}
          </div>
          {error && <p className="checkout-alert inline-error" role="alert">{error}</p>}
          <button className="button button-dark checkout-submit" disabled={loading}>{loading ? "Connecting securely…" : paymentMethod === "COD" ? "Place cash-on-delivery order" : "Continue to secure payment"}</button>
          <p className="product-category">Online payments are processed by Stripe. Card details are never stored by 3.33AM.</p>
        </form>
        <aside className="summary-card">
          <h2>In your bag</h2>
          {items.map((item) => <div className="summary-line" key={item.variantId}><span>{item.name} · {item.size} × {item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></div>)}
          <div className="summary-line"><span>Shipping</span><span>{shipping ? formatPrice(shipping) : "On us"}</span></div>
          <div className="summary-line summary-total"><span>Total</span><span>{formatPrice(subtotal + shipping)}</span></div>
          <p className="checkout-summary-note">Size-level inventory is checked again when you place the order.</p>
        </aside>
      </div>
    </div>
  );
}
