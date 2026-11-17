import type { DesignWithVariants } from "../types";

const photos = {
  tee: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=85",
  hoodie: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=1200&q=85",
  jacket: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1200&q=85",
  shirt: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1200&q=85"
};

export const designs: DesignWithVariants[] = [
  {
    id: "design-after-hours",
    slug: "after-hours-tee",
    name: "After Hours Tee",
    description: "A heavyweight cotton jersey tee made for the hours that belong to you. Relaxed through the body with a clean, considered finish.",
    category: "T-shirts",
    collection: "001 — After Hours",
    price: 1800,
    images: [photos.tee, photos.shirt],
    featured: true,
    variants: ["XS", "S", "M", "L", "XL"].map((size, i) => ({ id: `variant-tee-${size}`, size, stock: i === 4 ? 0 : 8 }))
  },
  {
    id: "design-midnight",
    slug: "midnight-hoodie",
    name: "Midnight Hoodie",
    description: "Soft brushed fleece, a structured hood, and an easy oversized shape. Built for the cold walk home.",
    category: "Fleece",
    collection: "001 — After Hours",
    price: 4200,
    images: [photos.hoodie, photos.jacket],
    featured: true,
    variants: ["XS", "S", "M", "L", "XL"].map((size) => ({ id: `variant-hoodie-${size}`, size, stock: 5 }))
  },
  {
    id: "design-work-jacket",
    slug: "quiet-hours-overshirt",
    name: "Quiet Hours Overshirt",
    description: "A sturdy everyday layer with a relaxed profile and generous pockets. Wear it open, or make it the whole look.",
    category: "Outerwear",
    collection: "002 — Uniform",
    price: 5600,
    images: [photos.jacket, photos.tee],
    featured: true,
    variants: ["S", "M", "L", "XL"].map((size) => ({ id: `variant-jacket-${size}`, size, stock: 4 }))
  },
  {
    id: "design-uniform-shirt",
    slug: "daily-uniform-shirt",
    name: "Daily Uniform Shirt",
    description: "An easy, crisp cotton shirt with a little room to move. A reliable start to any rotation.",
    category: "Shirts",
    collection: "002 — Uniform",
    price: 3200,
    images: [photos.shirt, photos.tee],
    variants: ["XS", "S", "M", "L", "XL"].map((size) => ({ id: `variant-shirt-${size}`, size, stock: 6 }))
  }
];

export function getDesign(slug: string) {
  return designs.find((design) => design.slug === slug);
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(price);
}
