import Link from "next/link";
import { prisma } from "@/lib/prisma";

// Pagina principală: alegi categoria (Ferestre sau Uși).
export default async function HomePage() {
  const [nrFerestre, nrUsi] = await Promise.all([
    prisma.productType.count({ where: { category: "FERESTRE" } }),
    prisma.productType.count({ where: { category: "USI" } }),
  ]);

  const categorii = [
    {
      slug: "FERESTRE",
      titlu: "Ferestre",
      descriere: "PVC și aluminiu — fixe, cu unul sau mai multe canate.",
      numar: nrFerestre,
      emoji: "🪟",
    },
    {
      slug: "USI",
      titlu: "Uși",
      descriere: "Interior, exterior, balcon și modele cu montanți.",
      numar: nrUsi,
      emoji: "🚪",
    },
  ];

  return (
    <div>
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">
          Află prețul tâmplăriei tale
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-gray-600">
          Alege un model, introdu dimensiunile (lățime × înălțime) și vezi
          prețul calculat pe loc.
        </p>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        {categorii.map((c) => (
          <Link
            key={c.slug}
            href={`/categorie/${c.slug}`}
            className="card group p-8 transition hover:shadow-md"
          >
            <div className="text-5xl">{c.emoji}</div>
            <h2 className="mt-4 text-2xl font-semibold group-hover:text-brand">
              {c.titlu}
            </h2>
            <p className="mt-2 text-gray-600">{c.descriere}</p>
            <p className="mt-4 text-sm text-gray-400">
              {c.numar} modele disponibile
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
