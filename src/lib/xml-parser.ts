// =====================================================================
//  Parser pentru fișierele XML de preț (format SpreadsheetML / Excel 2003).
// ---------------------------------------------------------------------
//  Un fișier = un tip de produs și conține mai multe "blocuri" de preț
//  lipite unul sub altul. Fiecare bloc are:
//    1) câteva rânduri de metadate (Tip, Profil, Culoare, Vitrare, ...)
//    2) un rând-antet cu lățimile:   0 | 500 | 600 | ... | 1500
//    3) câte un rând pe fiecare înălțime:  500 | preț | preț | ...
//
//  Parserul e ROBUST:
//   - respectă atributele ss:Index (care sar peste rânduri/coloane goale),
//   - nu presupune un număr fix de coloane sau rânduri,
//   - ignoră rândurile complet goale,
//   - potrivește etichetele fără să conteze majuscule/spații/diacritice.
// =====================================================================

import { XMLParser } from "fast-xml-parser";

/** Un bloc de preț extras din fișier (o "variantă"). */
export interface ParsedBlock {
  tip?: string;
  profil?: string;
  culoare?: string;
  feronerie?: string;
  vitrare?: string;
  modelOfertare?: string;
  dataText?: string;
  /** Lățimile (coloanele), în mm. Ex: [500, 600, ..., 1500] */
  widths: number[];
  /** Înălțimile (rândurile), în mm. Ex: [500, 600, ..., 2400] */
  heights: number[];
  /** matrix[i][j] = prețul pentru heights[i] × widths[j] (null dacă lipsește). */
  matrix: (number | null)[][];
}

/** O celulă normalizată dintr-un rând. */
interface NCell {
  col: number;
  text: string | null;
  type: string | null;
}

/** Un rând normalizat (cu celulele așezate pe coloanele lor reale). */
interface NRow {
  cells: NCell[]; // sortate crescător după col
  byCol: Map<number, NCell>;
}

// --- Etichetele de metadate cunoscute și cheia din obiectul rezultat ---
type MetaKey =
  | "tip"
  | "profil"
  | "culoare"
  | "feronerie"
  | "vitrare"
  | "modelOfertare"
  | "dataText";

const LABEL_MAP: Record<string, MetaKey> = {
  tip: "tip",
  profil: "profil",
  culoare: "culoare",
  feronerie: "feronerie",
  vitrare: "vitrare",
  "model de ofertare": "modelOfertare",
  data: "dataText",
};

/** Scoate diacriticele și normalizează o etichetă pentru comparație. */
function normLabel(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // elimină semnele diacritice
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/:$/, "")
    .trim();
}

/** Verifică dacă un text reprezintă un număr (ex: "500" sau "196.60"). */
function isNumericText(text: string | null, type: string | null): boolean {
  if (type === "Number") return true;
  if (text == null) return false;
  return /^-?\d+(\.\d+)?$/.test(text.trim());
}

function toNumber(text: string | null): number {
  return parseFloat((text ?? "").trim());
}

/** Extrage textul și tipul dintr-un nod <Data> (poate fi text sau obiect). */
function readData(data: unknown): { text: string | null; type: string | null } {
  if (data == null) return { text: null, type: null };
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;
    const raw = obj["#text"];
    return {
      text: raw == null ? null : String(raw),
      type: (obj["@_Type"] as string) ?? null,
    };
  }
  return { text: String(data), type: null };
}

/**
 * Transformă structura brută de <Row>/<Cell> într-o listă de rânduri
 * normalizate, respectând atributele ss:Index (col/rând).
 * Rândurile complet goale sunt ignorate.
 */
function normalizeRows(rawRows: unknown[]): NRow[] {
  const result: NRow[] = [];

  for (const rawRow of rawRows) {
    if (!rawRow || typeof rawRow !== "object") continue;
    const rowObj = rawRow as Record<string, unknown>;

    // Celulele rândului (forțate ca array de parser)
    const rawCells = rowObj["Cell"];
    const cellsArr = Array.isArray(rawCells)
      ? rawCells
      : rawCells != null
        ? [rawCells]
        : [];

    const cells: NCell[] = [];
    let curCol = 0; // coloana curentă (1-based după incrementare)
    for (const rawCell of cellsArr) {
      if (rawCell == null || typeof rawCell !== "object") {
        curCol += 1;
        continue;
      }
      const cellObj = rawCell as Record<string, unknown>;
      // ss:Index sare la o coloană anume; altfel mergem la următoarea
      const idxAttr = cellObj["@_Index"];
      if (idxAttr != null) {
        curCol = parseInt(String(idxAttr), 10);
      } else {
        curCol += 1;
      }
      const { text, type } = readData(cellObj["Data"]);
      cells.push({ col: curCol, text, type });
    }

    // Ignoră rândurile fără nicio celulă cu conținut
    const hasContent = cells.some((c) => c.text != null && c.text !== "");
    if (!hasContent) continue;

    cells.sort((a, b) => a.col - b.col);
    const byCol = new Map<number, NCell>();
    for (const c of cells) byCol.set(c.col, c);
    result.push({ cells, byCol });
  }

  return result;
}

/** Prima celulă cu conținut a unui rând (după coloană). */
function firstCell(row: NRow): NCell | undefined {
  return row.cells[0];
}

/** A doua celulă (valoarea metadatei). */
function secondCellText(row: NRow): string {
  const c = row.cells[1];
  return c?.text ?? "";
}

function isLabelRow(row: NRow): boolean {
  const fc = firstCell(row);
  if (!fc) return false;
  return normLabel(fc.text) in LABEL_MAP;
}

function isTipRow(row: NRow): boolean {
  const fc = firstCell(row);
  return !!fc && normLabel(fc.text) === "tip";
}

function isNumericFirst(row: NRow): boolean {
  const fc = firstCell(row);
  return !!fc && isNumericText(fc.text, fc.type);
}

/**
 * Funcția principală: primește conținutul XML și întoarce lista de blocuri.
 */
export function parsePriceWorkbook(xml: string): ParsedBlock[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    removeNSPrefix: true, // scoate prefixul "ss:" din nume și atribute
    parseTagValue: false, // păstrăm textul brut (controlăm noi numerele)
    trimValues: true,
    isArray: (name) => name === "Row" || name === "Cell" || name === "Worksheet",
  });

  const doc = parser.parse(xml);

  // Adună toate rândurile din toate foile de calcul (de obicei e una singură).
  const workbook = doc?.Workbook ?? doc?.workbook;
  if (!workbook) return [];
  const worksheets = Array.isArray(workbook.Worksheet)
    ? workbook.Worksheet
    : workbook.Worksheet
      ? [workbook.Worksheet]
      : [];

  const rawRows: unknown[] = [];
  for (const ws of worksheets) {
    const table = ws?.Table;
    if (!table) continue;
    const rows = table.Row;
    if (Array.isArray(rows)) rawRows.push(...rows);
    else if (rows != null) rawRows.push(rows);
  }

  const rows = normalizeRows(rawRows);

  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < rows.length) {
    // Un bloc începe la rândul "Tip"
    if (!isTipRow(rows[i])) {
      i += 1;
      continue;
    }

    // 1) Citește metadatele (câte un rând, până nu mai e etichetă cunoscută)
    const block: ParsedBlock = { widths: [], heights: [], matrix: [] };
    while (i < rows.length && isLabelRow(rows[i])) {
      const fc = firstCell(rows[i])!;
      const key = LABEL_MAP[normLabel(fc.text)];
      block[key] = secondCellText(rows[i]).trim();
      i += 1;
    }

    // 2) Rândul-antet cu lățimile (prima celulă = 0, apoi lățimile)
    if (i >= rows.length || !isNumericFirst(rows[i])) {
      // bloc incomplet (fără antet) — îl sărim
      continue;
    }
    const header = rows[i];
    const widthCols: number[] = []; // indicii de coloană care conțin lățimi
    // Prima celulă a antetului e "0" (marcaj), o ignorăm; restul sunt lățimi.
    for (let k = 1; k < header.cells.length; k++) {
      const c = header.cells[k];
      if (isNumericText(c.text, c.type)) {
        widthCols.push(c.col);
        block.widths.push(toNumber(c.text));
      }
    }
    i += 1;

    // 3) Rândurile de date: prima celulă = înălțimea, apoi prețurile
    while (i < rows.length && isNumericFirst(rows[i]) && !isTipRow(rows[i])) {
      const drow = rows[i];
      const height = toNumber(firstCell(drow)!.text);
      block.heights.push(height);

      const matrixRow: (number | null)[] = widthCols.map((col) => {
        const cell = drow.byCol.get(col);
        if (cell && isNumericText(cell.text, cell.type)) {
          return toNumber(cell.text);
        }
        return null; // celulă lipsă în tabel
      });
      block.matrix.push(matrixRow);
      i += 1;
    }

    blocks.push(block);
  }

  return blocks;
}
