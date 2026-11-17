import type { Metadata } from "next";
import ImageGallery from "@/components/shop/ImageGallery";
import ProductDetails from "./product-details";
import RemoteDesign from "./remote-design";
import { designs, getDesign } from "@/lib/catalog";

export function generateStaticParams() {
  return designs.map((design) => ({ slug: design.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const design = getDesign(slug);
  return { title: design?.name ?? "Piece not found", description: design?.description };
}

export default async function DesignPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const design = getDesign(slug);
  if (!design) return <RemoteDesign slug={slug} />;
  return (
    <div className="page-shell">
      <div className="detail-layout">
        <ImageGallery images={design.images} name={design.name} />
        <ProductDetails design={design} />
      </div>
    </div>
  );
}
