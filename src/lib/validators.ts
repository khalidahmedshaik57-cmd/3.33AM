import { z } from "zod";

const lineItemSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(10)
});

export const orderSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  phone: z.string().trim()
    .regex(/^\+?[0-9\s()-]+$/)
    .refine((value) => {
      const digits = value.replace(/\D/g, "").length;
      return digits >= 7 && digits <= 15;
    }),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().regex(/^\d{6}$/),
  country: z.string().trim().min(2).max(80),
  paymentMethod: z.enum(["CREDIT_CARD", "DEBIT_CARD", "UPI", "COD", "NET_BANKING", "WALLET_BNPL"]),
  items: z.array(lineItemSchema).min(1).max(30)
});

export const designSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(10).max(2000),
  category: z.string().trim().min(2).max(60),
  collection: z.string().trim().min(2).max(100),
  price: z.number().int().positive(),
  images: z.array(z.string().url()).min(1).max(8),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  variants: z.array(z.object({
    size: z.string().trim().min(1).max(10),
    sku: z.string().trim().min(2).max(60),
    stock: z.number().int().min(0)
  })).min(1).max(20)
});

export function isAdminRequest(request: Request) {
  const token = process.env.ADMIN_API_TOKEN;
  return Boolean(token && request.headers.get("authorization") === `Bearer ${token}`);
}
