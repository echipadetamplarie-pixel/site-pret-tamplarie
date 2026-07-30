import { prisma } from "@/lib/prisma";
import { AdminManager, type AdminType } from "@/components/AdminManager";

// Tabloul de bord al adminului (protejat de middleware).
export const dynamic = "force-dynamic"; // mereu date proaspete

export default async function AdminPage() {
  const tipuri = await prisma.productType.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: { variants: { select: { culoare: true, vitrare: true, sourceFile: true } } },
  });

  const data: AdminType[] = tipuri.map((t) => ({
    id: t.id,
    name: t.name,
    category: t.category,
    description: t.description,
    slug: t.slug,
    hasImage: !!t.imageData,
    variantCount: t.variants.length,
    culori: Array.from(
      new Set(t.variants.map((v) => v.culoare).filter((x): x is string => !!x)),
    ),
    vitraje: Array.from(
      new Set(t.variants.map((v) => v.vitrare).filter((x): x is string => !!x)),
    ),
    sourceFile: t.variants[0]?.sourceFile ?? null,
  }));

  return <AdminManager initialTypes={data} />;
}
