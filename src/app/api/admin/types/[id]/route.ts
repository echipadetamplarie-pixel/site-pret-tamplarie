// API admin pentru un tip anume.
//   PATCH  /api/admin/types/:id   -> redenumește / editează {name?, description?, category?, imageData?}
//   DELETE /api/admin/types/:id   -> șterge tipul (și variantele lui)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  if (typeof body.name === "string" && body.name.trim())
    data.name = body.name.trim();
  if (typeof body.description === "string")
    data.description = body.description.trim() || null;
  if (body.category === "FERESTRE" || body.category === "USI")
    data.category = body.category;
  if (typeof body.imageData === "string")
    data.imageData = body.imageData || null;
  if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nimic de actualizat." }, { status: 400 });
  }

  try {
    const updated = await prisma.productType.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Tip inexistent." }, { status: 404 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await prisma.productType.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Tip inexistent." }, { status: 404 });
  }
}
