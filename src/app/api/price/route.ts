// API public: primește selecția clientului + dimensiuni și întoarce prețul.
// POST /api/price
//   body: { productTypeId, selection: {culoare, vitrare, ...}, width, height }

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computePrice, type PriceGrid } from "@/lib/pricing";
import { findVariant, type VariantLike, type AttributeKey } from "@/lib/variants";

export async function POST(req: Request) {
  let body: {
    productTypeId?: string;
    selection?: Partial<Record<AttributeKey, string>>;
    width?: number;
    height?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "INVALID_INPUT", message: "Cerere invalidă." },
      { status: 400 },
    );
  }

  const { productTypeId, selection = {}, width, height } = body;
  if (!productTypeId) {
    return NextResponse.json(
      { ok: false, reason: "INVALID_INPUT", message: "Lipsește produsul." },
      { status: 400 },
    );
  }

  // Încărcăm variantele produsului
  const variants = await prisma.priceVariant.findMany({
    where: { productTypeId },
  });
  if (variants.length === 0) {
    return NextResponse.json({
      ok: false,
      reason: "NO_DATA",
      message: "Nu există prețuri pentru acest produs.",
    });
  }

  // Găsim varianta care se potrivește cu selecția
  const variantLikes: VariantLike[] = variants.map((v) => ({
    id: v.id,
    tip: v.tip,
    profil: v.profil,
    culoare: v.culoare,
    feronerie: v.feronerie,
    vitrare: v.vitrare,
    modelOfertare: v.modelOfertare,
  }));
  const matched = findVariant(variantLikes, selection);
  if (!matched) {
    return NextResponse.json({
      ok: false,
      reason: "NO_DATA",
      message: "Combinația de opțiuni aleasă nu are preț. Cere o ofertă.",
    });
  }

  const full = variants.find((v) => v.id === matched.id)!;
  const grid: PriceGrid = {
    widths: JSON.parse(full.widthsJson),
    heights: JSON.parse(full.heightsJson),
    matrix: JSON.parse(full.matrixJson),
  };

  const result = computePrice(grid, Number(width), Number(height));
  return NextResponse.json(result);
}
