import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/validators";

const statusSchema = z.object({
  status: z.enum(["PROCESSING", "SHIPPED", "DELIVERED"])
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const email = new URL(request.url).searchParams.get("email");
  if (!email || email.length > 254) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  try {
    const order = await prisma.order.findFirst({
      where: { id, email: { equals: email, mode: "insensitive" } },
      select: {
        id: true, status: true, createdAt: true, total: true,
        items: { select: { name: true, size: true, quantity: true } }
      }
    });
    return order
      ? NextResponse.json(order)
      : NextResponse.json({ error: "Order not found." }, { status: 404 });
  } catch (error) {
    console.error("GET /api/orders/[id] failed", error);
    return NextResponse.json({ error: "Unable to look up this order." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = statusSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid order status." }, { status: 400 });
  const { id } = await params;
  try {
    const existing = await prisma.order.findUnique({ where: { id }, select: { status: true, paymentMethod: true } });
    if (!existing) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    const allowedFrom: Record<string, string[]> = {
      PROCESSING: existing.paymentMethod === "COD" ? ["PENDING", "PAID"] : ["PAID"],
      SHIPPED: ["PROCESSING"],
      DELIVERED: ["SHIPPED"]
    };
    if (!allowedFrom[parsed.data.status].includes(existing.status)) {
      return NextResponse.json({ error: `Cannot move an order from ${existing.status} to ${parsed.data.status}.` }, { status: 409 });
    }
    const order = await prisma.order.update({ where: { id }, data: { status: parsed.data.status } });
    return NextResponse.json(order);
  } catch (error) {
    console.error("PATCH /api/orders/[id] failed", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
