"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminType {
  id: string;
  name: string;
  category: string;
  description: string | null;
  slug: string;
  hasImage: boolean;
  variantCount: number;
  culori: string[];
  vitraje: string[];
  sourceFile: string | null;
}

const CATEGORY_LABEL: Record<string, string> = {
  FERESTRE: "Ferestre",
  USI: "Uși",
};

/** Citește un fișier imagine ca data-URL base64. */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AdminManager({ initialTypes }: { initialTypes: AdminType[] }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>("");
  const [busyId, setBusyId] = useState<string>("");

  // Grupăm pe categorii
  const categorii = ["FERESTRE", "USI"];

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Administrare prețuri</h1>
        <button onClick={logout} className="btn-ghost">
          Ieșire
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      <NewTypeForm
        onDone={(m) => {
          setMessage(m);
          router.refresh();
        }}
      />

      {categorii.map((cat) => {
        const list = initialTypes.filter((t) => t.category === cat);
        return (
          <section key={cat} className="mb-10">
            <h2 className="mb-3 text-lg font-semibold text-gray-700">
              {CATEGORY_LABEL[cat]} ({list.length})
            </h2>
            <div className="space-y-3">
              {list.map((t) => (
                <TypeRow
                  key={t.id}
                  t={t}
                  busy={busyId === t.id}
                  setBusy={(v) => setBusyId(v ? t.id : "")}
                  onMessage={setMessage}
                  onChanged={() => router.refresh()}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// --- Formular pentru adăugarea unui tip nou ---
function NewTypeForm({ onDone }: { onDone: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("FERESTRE");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category }),
    });
    setLoading(false);
    if (res.ok) {
      setName("");
      setOpen(false);
      onDone(`Tip nou adăugat: „${name}”.`);
    } else {
      const d = await res.json().catch(() => ({}));
      onDone(d.error ?? "Eroare la adăugare.");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary mb-6">
        + Adaugă un tip nou
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="card mb-6 flex flex-wrap items-end gap-3 p-4">
      <div className="flex-1">
        <label className="label">Nume model</label>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ex: Fereastră fixă"
          required
        />
      </div>
      <div>
        <label className="label">Categorie</label>
        <select
          className="input"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="FERESTRE">Ferestre</option>
          <option value="USI">Uși</option>
        </select>
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Se salvează..." : "Salvează"}
      </button>
      <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>
        Renunță
      </button>
    </form>
  );
}

// --- Un rând pentru un tip de produs ---
function TypeRow({
  t,
  busy,
  setBusy,
  onMessage,
  onChanged,
}: {
  t: AdminType;
  busy: boolean;
  setBusy: (v: boolean) => void;
  onMessage: (m: string) => void;
  onChanged: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    onMessage(`Se încarcă „${file.name}”...`);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/admin/types/${t.id}/upload`, {
      method: "POST",
      body: form,
    });
    setBusy(false);
    if (fileInput.current) fileInput.current.value = "";
    if (res.ok) {
      const d = await res.json();
      onMessage(
        `„${t.name}”: importate ${d.variante} variante din ${d.fisier} ` +
          `(culori: ${d.culori.join(", ") || "-"}; vitraje: ${d.vitraje.length}).`,
      );
      onChanged();
    } else {
      const d = await res.json().catch(() => ({}));
      onMessage(`Eroare la import: ${d.error ?? "necunoscută"}`);
    }
  }

  async function onDelete() {
    if (!confirm(`Ștergi definitiv „${t.name}” și prețurile lui?`)) return;
    setBusy(true);
    const res = await fetch(`/api/admin/types/${t.id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      onMessage(`„${t.name}” a fost șters.`);
      onChanged();
    } else {
      onMessage("Eroare la ștergere.");
    }
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{t.name}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                t.variantCount > 0
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {t.variantCount} variante
            </span>
          </div>
          {t.description && (
            <p className="mt-1 text-sm text-gray-500">{t.description}</p>
          )}
          {t.variantCount > 0 && (
            <p className="mt-1 text-xs text-gray-400">
              Culori: {t.culori.join(", ") || "-"} · Vitraje: {t.vitraje.length}
              {t.sourceFile ? ` · Fișier: ${t.sourceFile}` : ""}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={onUpload}
          />
          <button
            className="btn-primary"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
          >
            {busy ? "..." : t.variantCount > 0 ? "Reîncarcă XML" : "Încarcă XML"}
          </button>
          <button className="btn-ghost" onClick={() => setEditing((v) => !v)}>
            Editează
          </button>
          <button
            className="btn-ghost text-red-600"
            disabled={busy}
            onClick={onDelete}
          >
            Șterge
          </button>
        </div>
      </div>

      {editing && (
        <EditForm
          t={t}
          onClose={() => setEditing(false)}
          onSaved={(m) => {
            setEditing(false);
            onMessage(m);
            onChanged();
          }}
        />
      )}
    </div>
  );
}

// --- Formular de editare a unui tip ---
function EditForm({
  t,
  onClose,
  onSaved,
}: {
  t: AdminType;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [name, setName] = useState(t.name);
  const [description, setDescription] = useState(t.description ?? "");
  const [category, setCategory] = useState(t.category);
  const [loading, setLoading] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const body: Record<string, unknown> = { name, description, category };
    const res = await fetch(`/api/admin/types/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) onSaved(`„${name}” a fost actualizat.`);
    else onSaved("Eroare la salvare.");
  }

  async function uploadImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToDataUrl(file);
    setLoading(true);
    const res = await fetch(`/api/admin/types/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageData: dataUrl }),
    });
    setLoading(false);
    if (res.ok) onSaved("Poza a fost actualizată.");
    else onSaved("Eroare la încărcarea pozei.");
  }

  return (
    <form onSubmit={save} className="mt-4 space-y-3 border-t border-gray-100 pt-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Nume</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label">Categorie</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="FERESTRE">Ferestre</option>
            <option value="USI">Uși</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Descriere scurtă</label>
        <input
          className="input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="(opțional)"
        />
      </div>
      <div>
        <label className="label">Poză reprezentativă (opțional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={uploadImage}
          className="text-sm"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Se salvează..." : "Salvează"}
        </button>
        <button type="button" className="btn-ghost" onClick={onClose}>
          Închide
        </button>
      </div>
    </form>
  );
}
