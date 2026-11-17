export type DesignVariant = {
  id: string;
  size: string;
  stock: number;
  sku?: string;
};

export type DesignWithVariants = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  collection: string;
  price: number;
  images: string[];
  featured?: boolean;
  variants: DesignVariant[];
};

export type CartItem = {
  designId: string;
  variantId: string;
  slug: string;
  name: string;
  size: string;
  image: string;
  price: number;
  quantity: number;
  stock: number;
};
