// =====================================================================
//  CONFIGURARE PREȚ — modifică aici valorile, fără să atingi restul codului.
// =====================================================================

export const PRICING_CONFIG = {
  // Moneda afișată lângă preț.
  MONEDA: "lei",

  // Prețurile din fișierele XML SUNT deja prețuri finale (cu TVA inclus)?
  //  - true  => prețul din tabel se afișează ca atare (nu adăugăm TVA peste el).
  //             Putem doar arăta, informativ, ce parte din el reprezintă TVA-ul.
  //  - false => prețul din tabel e FĂRĂ TVA, iar noi adăugăm TVA-ul deasupra.
  TVA_INCLUS: true,

  // Cota de TVA în procente (ex: 19 sau 21).
  COTA_TVA: 19,

  // Adaos comercial global, în procente, aplicat peste prețul din tabel.
  //  0 = fără adaos. Ex: 10 => prețurile cresc cu 10%.
  ADAOS_PROCENT: 0,
};

export type PricingConfig = typeof PRICING_CONFIG;
