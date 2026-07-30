"use client";

import { useMemo, useState } from "react";
import type { OptionGroup, AttributeKey } from "@/lib/variants";
import { SITE_CONFIG } from "@/config/site";

interface Props {
  productTypeId: string;
  productName: string;
  groups: OptionGroup[];
}

// Tipul răspunsului de la /api/price (trebuie să corespundă cu server-ul)
interface PriceApiOk {
  ok: true;
  finalPrice: number;
  basePrice: number;
  tvaAmount: number;
  priceWithoutVat: number;
  moneda: string;
  tvaInclus: boolean;
  cotaTva: number;
  adaosProcent: number;
}
interface PriceApiErr {
  ok: false;
  reason: string;
  message: string;
}
type PriceApi = PriceApiOk | PriceApiErr;

export function Configurator({ productTypeId, productName, groups }: Props) {
  // Selecția inițială = prima valoare din fiecare grup
  const initialSelection = useMemo(() => {
    const s: Partial<Record<AttributeKey, string>> = {};
    for (const g of groups) s[g.key] = g.values[0];
    return s;
  }, [groups]);

  const [selection, setSelection] =
    useState<Partial<Record<AttributeKey, string>>>(initialSelection);
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceApi | null>(null);
  const [showOferta, setShowOferta] = useState(false);

  function updateSelection(key: AttributeKey, value: string) {
    setSelection((prev) => ({ ...prev, [key]: value }));
    setResult(null); // resetăm prețul când se schimbă opțiunile
  }

  async function calculeaza(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setShowOferta(false);
    try {
      const res = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTypeId,
          selection,
          width: Number(width),
          height: Number(height),
        }),
      });
      const data: PriceApi = await res.json();
      setResult(data);
      if (!data.ok && data.reason === "OUT_OF_RANGE") setShowOferta(true);
    } catch {
      setResult({
        ok: false,
        reason: "NETWORK",
        message: "A apărut o eroare de rețea. Încearcă din nou.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Construiește un link mailto cu configurația precompletată.
  const ofertaMailto = useMemo(() => {
    const linii = [
      `Model: ${productName}`,
      ...groups.map((g) => `${g.label}: ${selection[g.key] ?? "-"}`),
      `Lățime: ${width || "?"} mm`,
      `Înălțime: ${height || "?"} mm`,
    ];
    const subiect = encodeURIComponent(`Cerere ofertă: ${productName}`);
    const corp = encodeURIComponent(
      `Bună ziua,\n\nAș dori o ofertă pentru:\n\n${linii.join("\n")}\n\nMulțumesc!`,
    );
    return `mailto:${SITE_CONFIG.CONTACT_EMAIL}?subject=${subiect}&body=${corp}`;
  }, [productName, groups, selection, width, height]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Formularul de configurare */}
      <form onSubmit={calculeaza} className="card space-y-4 p-6">
        {groups.map((g) => (
          <div key={g.key}>
            <label className="label" htmlFor={g.key}>
              {g.label}
            </label>
            {g.values.length === 1 ? (
              <div className="rounded-lg bg-gray-100 px-3 py-2 text-gray-700">
                {g.values[0]}
              </div>
            ) : (
              <select
                id={g.key}
                className="input"
                value={selection[g.key] ?? ""}
                onChange={(e) => updateSelection(g.key, e.target.value)}
              >
                {g.values.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="width">
              Lățime (mm)
            </label>
            <input
              id="width"
              type="number"
              inputMode="numeric"
              min={1}
              className="input"
              placeholder="ex: 1000"
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                setResult(null);
              }}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="height">
              Înălțime (mm)
            </label>
            <input
              id="height"
              type="number"
              inputMode="numeric"
              min={1}
              className="input"
              placeholder="ex: 1200"
              value={height}
              onChange={(e) => {
                setHeight(e.target.value);
                setResult(null);
              }}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Se calculează..." : "Calculează prețul"}
        </button>
      </form>

      {/* Rezultatul */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-semibold">Rezumat</h2>
        <ul className="space-y-1 text-sm text-gray-600">
          {groups.map((g) => (
            <li key={g.key}>
              <span className="text-gray-400">{g.label}:</span>{" "}
              {selection[g.key] ?? "-"}
            </li>
          ))}
          <li>
            <span className="text-gray-400">Dimensiuni:</span>{" "}
            {width || "?"} × {height || "?"} mm
          </li>
        </ul>

        <hr className="my-4" />

        {!result && (
          <p className="text-gray-500">
            Completează dimensiunile și apasă „Calculează prețul".
          </p>
        )}

        {result?.ok && (
          <div>
            <div className="text-sm text-gray-500">Preț estimat</div>
            <div className="text-4xl font-bold text-brand">
              {result.finalPrice.toFixed(2)} {result.moneda}
            </div>
            <div className="mt-3 space-y-1 text-sm text-gray-500">
              {result.adaosProcent > 0 && (
                <div>Include adaos {result.adaosProcent}%.</div>
              )}
              <div>
                {result.tvaInclus
                  ? `Preț cu TVA inclus (${result.cotaTva}%). Fără TVA: ${result.priceWithoutVat.toFixed(2)} ${result.moneda}.`
                  : `Fără TVA: ${result.priceWithoutVat.toFixed(2)} ${result.moneda} + TVA ${result.cotaTva}% (${result.tvaAmount.toFixed(2)} ${result.moneda}).`}
              </div>
            </div>
          </div>
        )}

        {result && !result.ok && (
          <div>
            <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
              {result.message}
            </div>
            {showOferta && (
              <a href={ofertaMailto} className="btn-primary mt-4 w-full">
                Cere ofertă personalizată
              </a>
            )}
          </div>
        )}

        {result?.ok && (
          <a href={ofertaMailto} className="btn-ghost mt-6 w-full">
            Cere ofertă / Comandă
          </a>
        )}
      </div>
    </div>
  );
}
