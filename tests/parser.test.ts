import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parsePriceWorkbook } from "@/lib/xml-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sampleXml = readFileSync(
  join(__dirname, "..", "samples", "exemplu-fix.xml"),
  "utf8",
);

describe("parsePriceWorkbook — fișierul de exemplu", () => {
  const blocks = parsePriceWorkbook(sampleXml);

  it("găsește exact 8 blocuri (2 culori × 4 vitraje)", () => {
    expect(blocks.length).toBe(8);
  });

  it("citește corect metadatele primului bloc", () => {
    const b = blocks[0];
    expect(b.tip).toBe("Fix");
    expect(b.profil).toBe("Klass, K600");
    expect(b.culoare).toBe("Alb");
    expect(b.feronerie).toBe("-");
    expect(b.vitrare).toBe("GT 24mm, AL/4S + Float (Bross)");
    expect(b.modelOfertare).toBe("M. fara demontaj");
  });

  it("citește corect lățimile și înălțimile", () => {
    const b = blocks[0];
    expect(b.widths[0]).toBe(500);
    expect(b.widths[b.widths.length - 1]).toBe(1500);
    expect(b.widths.length).toBe(11);
    expect(b.heights[0]).toBe(500);
    expect(b.heights[b.heights.length - 1]).toBe(2400);
    expect(b.heights.length).toBe(20);
  });

  it("prețurile cunoscute sunt corecte: 500×500 = 196.60 și 600×500 = 220.90", () => {
    const b = blocks[0];
    // heights[0] = 500 (rând), widths[0] = 500, widths[1] = 600 (coloane)
    expect(b.matrix[0][0]).toBeCloseTo(196.6, 2);
    expect(b.matrix[0][1]).toBeCloseTo(220.9, 2);
  });

  it("blocurile au culori diferite (Alb și Gri antracit)", () => {
    const culori = new Set(blocks.map((b) => b.culoare));
    expect(culori.has("Alb")).toBe(true);
    expect(culori.has("Gri antracit")).toBe(true);
  });
});

describe("parsePriceWorkbook — respectă ss:Index (rânduri/coloane sărite)", () => {
  // Bloc mic în care rândul de date folosește ss:Index="10" (sare rânduri)
  // și o celulă cu ss:Index="3" (sare coloana 2, care rămâne goală).
  const xml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Test">
  <Table>
   <Row><Cell><Data ss:Type="String">Tip</Data></Cell><Cell><Data ss:Type="String">Fix</Data></Cell></Row>
   <Row><Cell><Data ss:Type="Number">0</Data></Cell><Cell><Data ss:Type="Number">500</Data></Cell><Cell><Data ss:Type="Number">600</Data></Cell></Row>
   <Row ss:Index="10"><Cell><Data ss:Type="Number">500</Data></Cell><Cell ss:Index="3"><Data ss:Type="Number">220.90</Data></Cell></Row>
  </Table>
 </Worksheet>
</Workbook>`;

  it("aliniază prețul la coloana corectă și marchează celula lipsă cu null", () => {
    const blocks = parsePriceWorkbook(xml);
    expect(blocks.length).toBe(1);
    const b = blocks[0];
    expect(b.widths).toEqual([500, 600]);
    expect(b.heights).toEqual([500]);
    // Coloana 2 (lățime 500) lipsește -> null; coloana 3 (lățime 600) = 220.90
    expect(b.matrix[0][0]).toBeNull();
    expect(b.matrix[0][1]).toBeCloseTo(220.9, 2);
  });
});
