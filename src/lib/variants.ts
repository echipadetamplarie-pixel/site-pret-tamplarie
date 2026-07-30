// =====================================================================
//  Logica de "opțiuni": din lista de variante (blocuri) ale unui produs,
//  construim grupurile de opțiuni pe care le vede clientul (culoare,
//  vitrare, profil, ...) și găsim varianta potrivită unei selecții.
// =====================================================================

/** Cheile de atribut pe care le poate alege clientul, în ordinea de afișare. */
export const ATTRIBUTE_KEYS = [
  "profil",
  "culoare",
  "vitrare",
  "modelOfertare",
  "feronerie",
  "tip",
] as const;

export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];

/** Etichete prietenoase pentru fiecare atribut. */
export const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  profil: "Profil",
  culoare: "Culoare",
  vitrare: "Vitrare / Geam",
  modelOfertare: "Model de ofertare",
  feronerie: "Feronerie",
  tip: "Tip",
};

/** Forma minimă a unei variante folosită de aceste funcții. */
export interface VariantLike {
  id: string;
  tip: string | null;
  profil: string | null;
  culoare: string | null;
  feronerie: string | null;
  vitrare: string | null;
  modelOfertare: string | null;
}

export interface OptionGroup {
  key: AttributeKey;
  label: string;
  values: string[];
}

function attrValue(v: VariantLike, key: AttributeKey): string {
  return (v[key] ?? "").trim();
}

/**
 * Construiește grupurile de opțiuni. Includem doar atributele care au
 * cel puțin o valoare și care chiar diferă între variante (>1 valoare)
 * SAU au o singură valoare informativă (o afișăm, dar fără selector în UI
 * decidem pe baza lungimii listei).
 */
export function buildOptionGroups(variants: VariantLike[]): OptionGroup[] {
  const groups: OptionGroup[] = [];
  for (const key of ATTRIBUTE_KEYS) {
    const values = Array.from(
      new Set(
        variants
          .map((v) => attrValue(v, key))
          .filter((s) => s !== "" && s !== "-"),
      ),
    );
    if (values.length === 0) continue; // atribut irelevant (gol peste tot)
    values.sort((a, b) => a.localeCompare(b, "ro"));
    groups.push({ key, label: ATTRIBUTE_LABELS[key], values });
  }
  return groups;
}

/**
 * Găsește varianta care se potrivește cel mai bine cu selecția dată.
 * Selecția e un obiect { culoare: "Alb", vitrare: "...", ... }.
 * Ignorăm cheile neselectate. Dacă rămân mai multe potriviri, o luăm pe prima.
 */
export function findVariant(
  variants: VariantLike[],
  selection: Partial<Record<AttributeKey, string>>,
): VariantLike | null {
  const matches = variants.filter((v) =>
    ATTRIBUTE_KEYS.every((key) => {
      const sel = selection[key];
      if (!sel) return true; // neselectat -> nu filtrăm după el
      return attrValue(v, key) === sel;
    }),
  );
  return matches[0] ?? null;
}
