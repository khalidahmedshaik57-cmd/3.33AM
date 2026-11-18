import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/payment";
import { isAdminRequest, orderSchema } from "@/lib/validators";

export const runtime = "nodejs";
const SHIPPING = 150;

export async function POST(request: Request) {
  const parsed = orderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your delivery details and bag.", details: parsed.error.flatten() }, { status: 400 });
  const stripe = parsed.data.paymentMethod === "COD" ? null : getStripe();
  if (parsed.data.paymentMethod !== "COD" && !stripe) {
    return NextResponse.json({ error: "Online payment is not configured yet." }, { status: 503 });
  }

  const lineQuantities = new Map<string, number>();
  for (const item of parsed.data.items) {
    lineQuantities.set(item.variantId, (lineQuantities.get(item.variantId) ?? 0) + item.quantity);
  }
  if ([...lineQuantities.values()].some((quantity) => quantity > 10)) {
    return NextResponse.json({ error: "You can order up to 10 of each size." }, { status: 400 });
  }
  const items = [...lineQuantities].map(([variantId, quantity]) => ({ variantId, quantity }));
  let orderId: string | undefined;
  try {
    const reserved = await prisma.$transaction(async (tx) => {
      const variants = await tx.designVariant.findMany({
        where: { id: { in: items.map((item) => item.variantId) }, design: { published: true } },
        include: { design: true }
      });
      if (variants.length !== items.length) throw new Error("ITEM_UNAVAILABLE");
      for (const line of items) {
        const variant = variants.find((candidate) => candidate.id === line.variantId);
        if (!variant || variant.stock < line.quantity) throw new Error("INSUFFICIENT_STOCK");
      }
      const subtotal = items.reduce((sum, line) => {
        const variant = variants.find((candidate) => candidate.id === line.variantId)!;
        return sum + variant.design.price * line.quantity;
      }, 0);
      const shipping = subtotal >= 5000 ? 0 : SHIPPING;
      for (const line of items) {
        const result = await tx.designVariant.updateMany({
          where: { id: line.variantId, stock: { gte: line.quantity } },
          data: { stock: { decrement: line.quantity } }
        });
        if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK");
      }
      const order = await tx.order.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name,
          phone: parsed.data.phone,
          address: parsed.data.address,
          city: parsed.data.city,
          state: parsed.data.state,
          postalCode: parsed.data.postalCode,
          country: parsed.data.country,
          paymentMethod: parsed.data.paymentMethod,
          subtotal,
          shipping,
          total: subtotal + shipping,
          items: {
            create: items.map((line) => {
              const variant = variants.find((candidate) => candidate.id === line.variantId)!;
              return {
                variantId: variant.id,
                name: variant.design.name,
                size: variant.size,
                quantity: line.quantity,
                unitPrice: variant.design.price
              };
            })
          }
        }
      });
      return { order, variants };
    });
    orderId = reserved.order.id;
    if (parsed.data.paymentMethod === "COD") {
      return NextResponse.json({ orderId, cashOnDelivery: true });
    }
    if (!stripe) throw new Error("STRIPE_NOT_CONFIGURED");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: parsed.data.email,
      line_items: [
        ...items.map((line) => {
          const variant = reserved.variants.find((candidate) => candidate.id === line.variantId)!;
          return {
            quantity: line.quantity,
            price_data: {
              currency: "inr" as const,
              unit_amount: variant.design.price * 100,
              product_data: { name: `${variant.design.name} — ${variant.size}` }
            }
          };
        }),
        ...(reserved.order.shipping > 0 ? [{
          quantity: 1,
          price_data: { currency: "inr" as const, unit_amount: reserved.order.shipping * 100, product_data: { name: "Shipping" } }
        }] : [])
      ],
      metadata: { orderId, paymentMethod: parsed.data.paymentMethod },
      success_url: `${siteUrl}/checkout/success?order=${encodeURIComponent(orderId)}`,
      cancel_url: `${siteUrl}/cart`
    });
    await prisma.order.update({ where: { id: orderId }, data: { paymentSessionId: session.id } });
    return NextResponse.json({ orderId, checkoutUrl: session.url });
  } catch (error) {
    if (orderId) {
      await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
        if (!order || order.status !== "PENDING") return;
        for (const item of order.items) {
          await tx.designVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
        }
        await tx.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      });
    }
    if (error instanceof Error && error.message === "ITEM_UNAVAILABLE") {
      return NextResponse.json({ error: "One of these pieces is no longer available." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "A selected size has just sold out. Please update your bag." }, { status: 409 });
    }
    console.error("POST /api/orders failed", error);
    return NextResponse.json({ error: "Unable to start your order. Please try again." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders failed", error);
    return NextResponse.json({ error: "Unable to load orders." }, { status: 500 });
  }
}
