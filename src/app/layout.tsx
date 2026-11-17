import type { Metadata } from "next";
import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "3.33AM — For the hours that are yours", template: "%s — 3.33AM" },
  description: "Independent essentials for the in-between hours. Considered everyday clothing, made to be worn often."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body><CartProvider><Navbar /><main>{children}</main><Footer /></CartProvider></body>
    </html>
  );
}
