// =====================================================================
//  Calculul prețului pentru o dimensiune cerută (lățime × înălțime).
// ---------------------------------------------------------------------
//  - Dacă dimensiunea există exact în tabel  -> preț direct.
//  - Dacă e între valori  -> INTERPOLARE BILINIARĂ (calcul proporțional).
//  - Dacă e în afara intervalului  -> NU extrapolăm; întoarcem o eroare
//    clară ("cere ofertă").
//  La final aplicăm adaosul comercial și logica de TVA din config.
// =====================================================================

import { PRICING_CONFIG } from "@/config/pricing";

/** O variantă de preț (echivalentul unui bloc din XML). */
export interface PriceGrid {
  widths: number[];
  heights: number[];
  matrix: (number | null)[][]; // matrix[i][j] = heights[i] × widths[j]
}

export interface PriceResult {
  ok: true;
  /** Prețul de bază interpolat din tabel (înainte de adaos/TVA). */
  basePrice: number;
  /** Prețul final afișat (după adaos și TVA), rotunjit la 2 zecimale. */
  finalPrice: number;
  /** Partea de TVA din prețul final (informativ). */
  tvaAmount: number;
  /** Prețul fără TVA (informativ). */
  priceWithoutVat: number;
  moneda: string;
  tvaInclus: boolean;
  cotaTva: number;
  adaosProcent: number;
}

export interface PriceError {
  ok: false;
  reason: "OUT_OF_RANGE" | "NO_DATA" | "INVALID_INPUT";
  message: string;
  /** Intervalele disponibile (pentru mesaje prietenoase). */
  range?: {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
  };
}

export type PriceOutcome = PriceResult | PriceError;

/** Rotunjește la 2 zecimale (evită erorile de virgulă mobilă). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Găsește indicii vecini (jos, sus) pentru o valoare într-un tablou SORTAT
 * crescător. Întoarce null dacă valoarea e în afara intervalului.
 */
function findNeighbors(
  sorted: number[],
  value: number,
): { lowIdx: number; highIdx: number } | null {
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  if (value < min || value > max) return null;

  for (let k = 0; k < sorted.length - 1; k++) {
    if (value >= sorted[k] && value <= sorted[k + 1]) {
      return { lowIdx: k, highIdx: k + 1 };
    }
  }
  // Valoarea coincide cu ultimul element
  return { lowIdx: sorted.length - 1, highIdx: sorted.length - 1 };
}

/** Interpolare liniară simplă între două puncte. */
function lerp(x: number, x0: number, x1: number, y0: number, y1: number): number {
  if (x1 === x0) return y0; // aceleași puncte -> nicio interpolare
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

/**
 * Calculează prețul de bază prin interpolare biliniară.
 * Întoarce null dacă vreunul din cele 4 colțuri lipsește din tabel.
 */
function bilinearBase(grid: PriceGrid, width: number, height: number): number | null {
  const wN = findNeighbors(grid.widths, width);
  const hN = findNeighbors(grid.heights, height);
  if (!wN || !hN) return null;

  const w1 = grid.widths[wN.lowIdx];
  const w2 = grid.widths[wN.highIdx];
  const h1 = grid.heights[hN.lowIdx];
  const h2 = grid.heights[hN.highIdx];

  // Cele 4 prețuri din colțuri
  const p11 = grid.matrix[hN.lowIdx]?.[wN.lowIdx]; // (h1, w1)
  const p12 = grid.matrix[hN.lowIdx]?.[wN.highIdx]; // (h1, w2)
  const p21 = grid.matrix[hN.highIdx]?.[wN.lowIdx]; // (h2, w1)
  const p22 = grid.matrix[hN.highIdx]?.[wN.highIdx]; // (h2, w2)

  if (p11 == null || p12 == null || p21 == null || p22 == null) return null;

  // Întâi interpolăm pe lățime (la fiecare din cele două înălțimi)...
  const pH1 = lerp(width, w1, w2, p11, p12);
  const pH2 = lerp(width, w1, w2, p21, p22);
  // ...apoi pe înălțime.
  const base = lerp(height, h1, h2, pH1, pH2);
  return base;
}

/**
 * Funcția publică: calculează prețul final pentru o cerere.
 */
export function computePrice(
  grid: PriceGrid,
  width: number,
  height: number,
): PriceOutcome {
  // Validare intrare
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      message: "Introdu o lățime și o înălțime valide (numere pozitive, în mm).",
    };
  }

  if (
    !grid.widths.length ||
    !grid.heights.length ||
    !grid.matrix.length
  ) {
    return {
      ok: false,
      reason: "NO_DATA",
      message: "Nu există date de preț pentru această variantă.",
    };
  }

  const minWidth = grid.widths[0];
  const maxWidth = grid.widths[grid.widths.length - 1];
  const minHeight = grid.heights[0];
  const maxHeight = grid.heights[grid.heights.length - 1];

  const base = bilinearBase(grid, width, height);
  if (base == null) {
    return {
      ok: false,
      reason: "OUT_OF_RANGE",
      message:
        `Dimensiune în afara intervalului disponibil ` +
        `(lățime ${minWidth}–${maxWidth} mm, înălțime ${minHeight}–${maxHeight} mm). ` +
        `Cere o ofertă personalizată.`,
      range: { minWidth, maxWidth, minHeight, maxHeight },
    };
  }

  // --- Adaos comercial ---
  const cfg = PRICING_CONFIG;
  const afterMarkup = base * (1 + cfg.ADAOS_PROCENT / 100);

  // --- Logica de TVA ---
  let finalPrice: number;
  let priceWithoutVat: number;
  let tvaAmount: number;
  const tvaFactor = 1 + cfg.COTA_TVA / 100;

  if (cfg.TVA_INCLUS) {
    // Prețul din tabel e deja final (cu TVA). Doar descompunem informativ.
    finalPrice = afterMarkup;
    priceWithoutVat = finalPrice / tvaFactor;
    tvaAmount = finalPrice - priceWithoutVat;
  } else {
    // Prețul din tabel e fără TVA. Adăugăm TVA-ul deasupra.
    priceWithoutVat = afterMarkup;
    finalPrice = afterMarkup * tvaFactor;
    tvaAmount = finalPrice - priceWithoutVat;
  }

  return {
    ok: true,
    basePrice: round2(base),
    finalPrice: round2(finalPrice),
    tvaAmount: round2(tvaAmount),
    priceWithoutVat: round2(priceWithoutVat),
    moneda: cfg.MONEDA,
    tvaInclus: cfg.TVA_INCLUS,
    cotaTva: cfg.COTA_TVA,
    adaosProcent: cfg.ADAOS_PROCENT,
  };
}
