// Conexiunea către baza de date (Prisma).
// Folosim un singur client refolosit, ca să nu deschidem prea multe conexiuni
// în timpul dezvoltării (Next.js reîncarcă des codul).

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
