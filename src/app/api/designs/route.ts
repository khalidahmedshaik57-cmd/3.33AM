import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { designSchema, isAdminRequest } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const admin = url.searchParams.get("admin") === "true";
    if (admin && !isAdminRequest(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const designs = await prisma.design.findMany({
      where: admin ? undefined : { published: true },
      include: { variants: { orderBy: { size: "asc" } } },
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }]
    });
    return NextResponse.json(designs);
  } catch (error) {
    console.error("GET /api/designs failed", error);
    return NextResponse.json({ error: "Unable to load designs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = designSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid design data.", details: parsed.error.flatten() }, { status: 400 });
  try {
    const { variants, ...design } = parsed.data;
    const created = await prisma.design.create({
      data: { ...design, variants: { create: variants } },
      include: { variants: true }
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/designs failed", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "The slug or one of the SKUs is already in use." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to create design." }, { status: 500 });
  }
}
