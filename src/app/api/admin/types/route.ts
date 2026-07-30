// API admin pentru tipuri de produs.
//   GET  /api/admin/types           -> lista tuturor tipurilor
//   POST /api/admin/types           -> creează un tip nou {category, name, description?}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function GET() {
  const tipuri = await prisma.productType.findMany({
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    include: { _count: { select: { variants: true } } },
  });
  return NextResponse.json(tipuri);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const category = String(body.category ?? "").toUpperCase();
  const description = body.description ? String(body.description).trim() : null;

  if (!name || (category !== "FERESTRE" && category !== "USI")) {
    return NextResponse.json(
      { error: "Nume lipsă sau categorie invalidă (FERESTRE/USI)." },
      { status: 400 },
    );
  }

  // Slug unic (adăugăm un sufix dacă există deja)
  let slug = slugify(name);
  let n = 2;
  while (await prisma.productType.findUnique({ where: { slug } })) {
    slug = `${slugify(name)}-${n++}`;
  }

  const created = await prisma.productType.create({
    data: { name, category, description, slug },
  });
  return NextResponse.json(created, { status: 201 });
}
