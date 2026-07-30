import { describe, it, expect } from "vitest";
import { computePrice, type PriceGrid } from "@/lib/pricing";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parsePriceWorkbook } from "@/lib/xml-parser";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("computePrice — interpolare biliniară (grid simplu)", () => {
  // Grid calculat manual:
  //          w=500  w=600
  //  h=500 :  100    200
  //  h=600 :  300    600
  const grid: PriceGrid = {
    widths: [500, 600],
    heights: [500, 600],
    matrix: [
      [100, 200],
      [300, 600],
    ],
  };

  it("valoare exactă (colț): 500×500 = 100", () => {
    const r = computePrice(grid, 500, 500);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.basePrice).toBeCloseTo(100, 2);
  });

  it("interpolare pe lățime: 550×500 = 150", () => {
    const r = computePrice(grid, 550, 500);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.basePrice).toBeCloseTo(150, 2);
  });

  it("interpolare biliniară (centru): 550×550 = 300", () => {
    // lățime la h=500: 150 ; lățime la h=600: 450 ; înălțime: (150+450)/2 = 300
    const r = computePrice(grid, 550, 550);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.basePrice).toBeCloseTo(300, 2);
  });

  it("dimensiune sub minim -> OUT_OF_RANGE", () => {
    const r = computePrice(grid, 400, 550);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("OUT_OF_RANGE");
  });

  it("dimensiune peste maxim -> OUT_OF_RANGE", () => {
    const r = computePrice(grid, 550, 900);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("OUT_OF_RANGE");
  });

  it("intrare invalidă (0 sau negativ) -> INVALID_INPUT", () => {
    const r = computePrice(grid, 0, 500);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("INVALID_INPUT");
  });
});

describe("computePrice — pe datele reale din fișierul de exemplu", () => {
  const sampleXml = readFileSync(
    join(__dirname, "..", "samples", "exemplu-fix.xml"),
    "utf8",
  );
  const block = parsePriceWorkbook(sampleXml)[0]; // Alb, prima vitrare
  const grid: PriceGrid = {
    widths: block.widths,
    heights: block.heights,
    matrix: block.matrix,
  };

  it("preț exact din tabel: 500×500 = 196.60", () => {
    const r = computePrice(grid, 500, 500);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.basePrice).toBeCloseTo(196.6, 2);
  });

  it("interpolare pe lățime: 550×500 = 208.75", () => {
    // între 196.60 (500×500) și 220.90 (600×500) -> mijloc = 208.75
    const r = computePrice(grid, 550, 500);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.basePrice).toBeCloseTo(208.75, 2);
  });

  it("dimensiune prea mare (2000×2000) -> OUT_OF_RANGE cu interval", () => {
    const r = computePrice(grid, 2000, 2000);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.reason).toBe("OUT_OF_RANGE");
      expect(r.range?.maxWidth).toBe(1500);
      expect(r.range?.maxHeight).toBe(2400);
    }
  });
});
