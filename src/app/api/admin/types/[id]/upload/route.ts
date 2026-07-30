// API admin: încărcarea fișierului XML de preț pentru un tip de produs.
//   POST /api/admin/types/:id/upload   (multipart/form-data, câmpul "file")
// La reîncărcare, variantele vechi ale acestui tip sunt înlocuite complet.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parsePriceWorkbook } from "@/lib/xml-parser";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  // Verificăm că tipul există
  const tip = await prisma.productType.findUnique({ where: { id: params.id } });
  if (!tip) {
    return NextResponse.json({ error: "Tip inexistent." }, { status: 404 });
  }

  // Citim fișierul din formular
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Nu s-a primit niciun fișier (câmpul 'file')." },
      { status: 400 },
    );
  }

  const xml = await file.text();

  // Parsăm blocurile
  let blocks;
  try {
    blocks = parsePriceWorkbook(xml);
  } catch (e) {
    return NextResponse.json(
      { error: "Fișierul nu a putut fi citit. Verifică formatul XML." },
      { status: 400 },
    );
  }

  if (blocks.length === 0) {
    return NextResponse.json(
      {
        error:
          "Nu am găsit niciun bloc de preț în fișier. Verifică structura (Tip, Profil, ..., antet cu lățimi, rânduri cu prețuri).",
      },
      { status: 400 },
    );
  }

  // Înlocuim complet variantele existente cu cele noi (într-o tranzacție)
  await prisma.$transaction([
    prisma.priceVariant.deleteMany({ where: { productTypeId: tip.id } }),
    prisma.priceVariant.createMany({
      data: blocks.map((b) => ({
        productTypeId: tip.id,
        tip: b.tip ?? null,
        profil: b.profil ?? null,
        culoare: b.culoare ?? null,
        feronerie: b.feronerie ?? null,
        vitrare: b.vitrare ?? null,
        modelOfertare: b.modelOfertare ?? null,
        dataText: b.dataText ?? null,
        widthsJson: JSON.stringify(b.widths),
        heightsJson: JSON.stringify(b.heights),
        matrixJson: JSON.stringify(b.matrix),
        sourceFile: file.name,
      })),
    }),
  ]);

  // Rezumat pentru admin
  const culori = Array.from(
    new Set(blocks.map((b) => b.culoare).filter(Boolean)),
  );
  const vitraje = Array.from(
    new Set(blocks.map((b) => b.vitrare).filter(Boolean)),
  );

  return NextResponse.json({
    ok: true,
    fisier: file.name,
    variante: blocks.length,
    culori,
    vitraje,
    exempluDimensiuni: {
      latimi: blocks[0].widths,
      inaltimi: blocks[0].heights,
    },
  });
}
