import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/validators";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().min(10).max(2000).optional(),
  category: z.string().trim().min(2).max(60).optional(),
  collection: z.string().trim().min(2).max(100).optional(),
  price: z.number().int().positive().optional(),
  images: z.array(z.string().url()).min(1).max(8).optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
  variants: z.array(z.object({
    id: z.string().min(1),
    stock: z.number().int().min(0)
  })).optional()
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const design = await prisma.design.findFirst({
      where: { OR: [{ id }, { slug: id }], published: true },
      include: { variants: true }
    });
    return design
      ? NextResponse.json(design)
      : NextResponse.json({ error: "Design not found." }, { status: 404 });
  } catch (error) {
    console.error("GET /api/designs/[id] failed", error);
    return NextResponse.json({ error: "Unable to load design." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid update.", details: parsed.error.flatten() }, { status: 400 });
  const { id } = await params;
  const { variants, ...fields } = parsed.data;
  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (variants) {
        for (const variant of variants) {
          const result = await tx.designVariant.updateMany({
            where: { id: variant.id, designId: id },
            data: { stock: variant.stock }
          });
          if (result.count !== 1) throw new Error("VARIANT_NOT_FOUND");
        }
      }
      return tx.design.update({ where: { id }, data: fields, include: { variants: true } });
    });
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND") {
      return NextResponse.json({ error: "A variant does not belong to this design." }, { status: 400 });
    }
    console.error("PATCH /api/designs/[id] failed", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Design not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to update design." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  try {
    await prisma.design.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/designs/[id] failed", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Design not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to delete design." }, { status: 500 });
  }
}
