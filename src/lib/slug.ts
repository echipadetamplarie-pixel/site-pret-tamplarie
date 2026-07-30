// Transformă un nume în "slug" pentru URL (ex: "Fereastră fixă" -> "fereastra-fixa").

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // scoate diacriticele
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // orice nu e literă/cifră -> "-"
    .replace(/^-+|-+$/g, "") // scoate "-" de la capete
    .slice(0, 80);
}
