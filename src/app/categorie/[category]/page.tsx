import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

const TITLURI: Record<string, string> = {
  FERESTRE: "Ferestre",
  USI: "Uși",
};

// Listează modelele dintr-o categorie (Ferestre sau Uși).
export default async function CategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const category = params.category.toUpperCase();
  const titlu = TITLURI[category];
  if (!titlu) notFound();

  const tipuri = await prisma.productType.findMany({
    where: { category },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { variants: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-500 hover:text-brand">
          ← Înapoi
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{titlu}</h1>
        <p className="text-gray-600">Alege modelul dorit.</p>
      </div>

      {tipuri.length === 0 ? (
        <p className="text-gray-500">Nu există modele în această categorie.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tipuri.map((t) => {
            const areToPreturi = t._count.variants > 0;
            return (
              <Link
                key={t.id}
                href={`/produs/${t.slug}`}
                className="card group flex flex-col overflow-hidden transition hover:shadow-md"
              >
                <div className="flex h-40 items-center justify-center bg-gray-100">
                  {t.imageData ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.imageData}
                      alt={t.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-5xl opacity-40">
                      {category === "USI" ? "🚪" : "🪟"}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-semibold group-hover:text-brand">
                    {t.name}
                  </h3>
                  {t.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {t.description}
                    </p>
                  )}
                  <span
                    className={`mt-3 inline-block w-fit rounded-full px-2 py-0.5 text-xs ${
                      areToPreturi
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {areToPreturi
                      ? "Preț disponibil"
                      : "În curând (fără preț încă)"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
