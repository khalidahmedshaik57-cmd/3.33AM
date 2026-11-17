"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

export default function Navbar() {
  const { count } = useCart();
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="wordmark" href="/" aria-label="3.33AM home">3.33<span>AM</span></Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/shop">Shop</Link>
          <Link href="/shop?collection=001+—+After+Hours">Collections</Link>
          <a href="/#about">Our hours</a>
        </nav>
        <Link className="bag-link" href="/cart" aria-label={`Shopping bag, ${count} items`}>
          Bag <span className="bag-count">{count}</span>
        </Link>
      </div>
    </header>
  );
}
