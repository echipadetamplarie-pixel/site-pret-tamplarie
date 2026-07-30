// =====================================================================
//  Generează un fișier XML de EXEMPLU în format SpreadsheetML (Excel 2003),
//  identic ca structură cu fișierele reale de preț.
//
//  Produce 8 blocuri = 2 culori × 4 tipuri de vitrare.
//  Prețurile cunoscute (verificate în teste) pentru Alb + prima vitrare:
//     500×500 = 196.60   și   600×500 = 220.90
//
//  Rulează cu:  npm run gen:sample
// =====================================================================

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "samples", "exemplu-fix.xml");

// Lățimi 500..1500 (pas 100) și înălțimi 500..2400 (pas 100)
const widths = [];
for (let w = 500; w <= 1500; w += 100) widths.push(w);
const heights = [];
for (let h = 500; h <= 2400; h += 100) heights.push(h);

const culori = [
  { nume: "Alb", premium: 0 },
  { nume: "Gri antracit", premium: 45 },
];
const vitraje = [
  { nume: "GT 24mm, AL/4S + Float (Bross)", premium: 0 },
  { nume: "GT 24mm, AL/4S + LowE (Bross)", premium: 35 },
  { nume: "GT 32mm, AL/4S+4S + Float (Bross)", premium: 60 },
  { nume: "GT 32mm, AL/4S+4S + LowE (Bross)", premium: 95 },
];

// Coeficienții suprafeței de preț (aleși ca 500×500=196.60 și 600×500=220.90)
const A0 = 196.6; // preț de bază (colț)
const B = 24.3; // creștere pe lățime (per 100 mm)
const C = 30.5; // creștere pe înălțime (per 100 mm)
const D = 1.2; // termen combinat lățime×înălțime

function pret(w, h, culoarePremium, vitrarePremium) {
  const dw = (w - 500) / 100;
  const dh = (h - 500) / 100;
  const p = A0 + culoarePremium + vitrarePremium + B * dw + C * dh + D * dw * dh;
  return p.toFixed(2);
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function cellStr(v) {
  return `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
}
function cellNum(v) {
  return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
}
function metaRow(label, value) {
  return `   <Row>${cellStr(label)}${cellStr(value)}</Row>`;
}

const rows = [];
for (const culoare of culori) {
  for (const vitrare of vitraje) {
    // --- Metadate ---
    rows.push(metaRow("Tip", "Fix"));
    rows.push(metaRow("Profil", "Klass, K600"));
    rows.push(metaRow("Culoare", culoare.nume));
    rows.push(metaRow("Feronerie", "-"));
    rows.push(metaRow("Vitrare", vitrare.nume));
    rows.push(metaRow("Model de ofertare", "M. fara demontaj"));
    rows.push(metaRow("Data", "Thursday, July 30, 2026 (14:10)"));

    // --- Antet lățimi: 0 | 500 | 600 | ... ---
    rows.push(
      "   <Row>" + cellNum(0) + widths.map((w) => cellNum(w)).join("") + "</Row>",
    );

    // --- Rânduri de preț (câte unul pe înălțime) ---
    for (const h of heights) {
      const cells = widths
        .map((w) => cellNum(pret(w, h, culoare.premium, vitrare.premium)))
        .join("");
      rows.push("   <Row>" + cellNum(h) + cells + "</Row>");
    }

    // Rând complet gol între blocuri (ca în fișierele reale)
    rows.push("   <Row/>");
  }
}

const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Preturi">
  <Table>
${rows.join("\n")}
  </Table>
 </Worksheet>
</Workbook>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, xml, "utf8");
console.log(`Fișier de exemplu scris: ${OUT}`);
console.log(`Blocuri: ${culori.length * vitraje.length} (culori × vitrare)`);
console.log(`Verificare: 500×500 = ${pret(500, 500, 0, 0)}, 600×500 = ${pret(600, 500, 0, 0)}`);
