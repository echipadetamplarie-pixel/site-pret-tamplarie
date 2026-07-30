import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildOptionGroups, type VariantLike } from "@/lib/variants";
import { Configurator } from "@/components/Configurator";

// Pagina unui model: clientul alege opțiunile, introduce dimensiunile și vede prețul.
export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await prisma.productType.findUnique({
    where: { slug: params.slug },
    include: { variants: true },
  });
  if (!product) notFound();

  // Construim grupurile de opțiuni din variantele importate.
  const variantLikes: VariantLike[] = product.variants.map((v) => ({
    id: v.id,
    tip: v.tip,
    profil: v.profil,
    culoare: v.culoare,
    feronerie: v.feronerie,
    vitrare: v.vitrare,
    modelOfertare: v.modelOfertare,
  }));
  const groups = buildOptionGroups(variantLikes);

  const backHref = `/categorie/${product.category}`;

  return (
    <div>
      <div className="mb-6">
        <Link href={backHref} className="text-sm text-gray-500 hover:text-brand">
          ← Înapoi la listă
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{product.name}</h1>
        {product.description && (
          <p className="text-gray-600">{product.description}</p>
        )}
      </div>

      {product.variants.length === 0 ? (
        <div className="card p-6">
          <p className="text-gray-600">
            Pentru acest model nu au fost încă încărcate prețuri. Revino în
            curând sau cere o ofertă personalizată.
          </p>
        </div>
      ) : (
        <Configurator
          productTypeId={product.id}
          productName={product.name}
          groups={groups}
        />
      )}
    </div>
  );
}
