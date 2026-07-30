// =====================================================================
//  Populează baza de date cu lista inițială de modele (ferestre + uși).
//  Rulează cu:  npm run db:seed
//  (poți adăuga/redenumi/șterge modele oricând, din panoul de admin)
// =====================================================================

import { PrismaClient } from "@prisma/client";
import { slugify } from "../src/lib/slug";

const prisma = new PrismaClient();

// Denumiri preluate după configuratorul real (tamplarieonline.ro).
const FERESTRE = [
  "Fereastră fixă (panou fix)",
  "Fereastră 1 canat, deschidere stânga",
  "Fereastră 1 canat, deschidere dreapta",
  "Fereastră 2 canate (fix + oscilobatant), deschidere stânga",
  "Fereastră 2 canate (fix + oscilobatant), deschidere dreapta",
  "Fereastră 2 canate mobile, deschidere stânga / dreapta",
  "Fereastră 3 canate (2 fix + oscilobatant), deschidere stânga / dreapta",
  "Fereastră tehnică (ex. 60/116 cm), un canat fix",
];

const USI = [
  "Ușă de interior (1 canat, stânga / dreapta)",
  "Ușă de exterior (1 canat, stânga / dreapta)",
  "Ușă de balcon (stânga / dreapta)",
  "Ușă 2 canate egale",
  "Ușă cu montanți (orizontali / vertical / combinați)",
  "Ușă cu sticlă integrală / cu panel integral",
];

async function upsertType(category: string, name: string, sortOrder: number) {
  const slug = slugify(name);
  await prisma.productType.upsert({
    where: { slug },
    update: {}, // dacă există deja, nu-l suprascriem (păstrăm eventualele poze/descrieri)
    create: { category, name, slug, sortOrder },
  });
}

async function main() {
  let order = 0;
  for (const name of FERESTRE) await upsertType("FERESTRE", name, order++);
  order = 0;
  for (const name of USI) await upsertType("USI", name, order++);

  const total = await prisma.productType.count();
  console.log(`Gata. Există ${total} tipuri de produs în baza de date.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
