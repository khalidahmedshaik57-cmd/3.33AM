import { PrismaClient } from "@prisma/client";
import { designs } from "../src/lib/catalog";

const prisma = new PrismaClient();

async function main() {
  for (const design of designs) {
    await prisma.design.upsert({
      where: { slug: design.slug },
      update: {
        name: design.name,
        description: design.description,
        category: design.category,
        collection: design.collection,
        price: design.price,
        images: design.images,
        featured: design.featured ?? false,
        published: true
      },
      create: {
        id: design.id,
        slug: design.slug,
        name: design.name,
        description: design.description,
        category: design.category,
        collection: design.collection,
        price: design.price,
        images: design.images,
        featured: design.featured ?? false,
        published: true,
        variants: {
          create: design.variants.map((variant) => ({
            id: variant.id,
            size: variant.size,
            sku: `${design.slug}-${variant.size}`.toUpperCase(),
            stock: variant.stock
          }))
        }
      }
    });
    const current = await prisma.design.findUniqueOrThrow({ where: { slug: design.slug } });
    for (const variant of design.variants) {
      const sku = `${design.slug}-${variant.size}`.toUpperCase();
      await prisma.designVariant.upsert({
        where: { sku },
        update: {},
        create: {
          id: variant.id,
          designId: current.id,
          size: variant.size,
          sku,
          stock: variant.stock
        }
      });
    }
  }
  console.log(`Seeded ${designs.length} designs.`);
}

main()
  .catch((error) => {
    console.error("Database seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
