import { NextResponse } from "next/server";
import { getStripe } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) {
    return NextResponse.json({ error: "Payment webhook is not configured." }, { status: 503 });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (!orderId) return NextResponse.json({ error: "Missing order reference." }, { status: 400 });
      if (session.payment_status !== "paid") return NextResponse.json({ received: true });
      await prisma.order.updateMany({
        where: { id: orderId, status: "PENDING", paymentSessionId: session.id },
        data: {
          status: "PAID",
          paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : null
        }
      });
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await prisma.$transaction(async (tx) => {
          const cancelled = await tx.order.updateMany({
            where: { id: orderId, status: "PENDING", paymentSessionId: session.id },
            data: { status: "CANCELLED" }
          });
          if (cancelled.count !== 1) return;
          const items = await tx.orderItem.findMany({ where: { orderId } });
          for (const item of items) {
            await tx.designVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
          }
        });
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
