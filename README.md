# Site prețuri tâmplărie (ferestre & uși)

Aplicație web pentru calculul prețurilor de tâmplărie PVC/aluminiu.

- **Partea publică** (clienți): aleg un model → aleg opțiunile (culoare, geam, profil...) → introduc lățimea și înălțimea (în mm) → primesc prețul.
- **Partea de admin** (tu, protejată cu parolă): pentru fiecare model ai un buton **„Încarcă XML"** prin care încarci tabelul de prețuri. Poți adăuga/redenumi/șterge modele și pune o poză.

Prețul la dimensiuni intermediare se calculează prin **interpolare biliniară** (proporțional între valorile din tabel), nu prin rotunjire.

---

## 1. Ce tehnologii folosește (pe scurt)

| Piesă | La ce folosește |
|------|------------------|
| **Next.js + React + TypeScript** | Site-ul + partea de server, într-un singur proiect |
| **Tailwind CSS** | Aspectul (arată bine și pe telefon) |
| **Prisma + SQLite** | Baza de date (local = un simplu fișier `dev.db`) |
| **fast-xml-parser** | Citirea fișierelor XML de preț |
| **jose** | Login-ul de admin (sesiune sigură) |
| **Vitest** | Testele automate |

Pentru online (Vercel) se trece ușor de la SQLite la Postgres — vezi secțiunea 6.

---

## 2. De ce ai nevoie pe calculator

- **Node.js** versiunea 18 sau mai nouă. Verifici cu:
  ```bash
  node --version
  ```
  Dacă nu ai, descarcă de la <https://nodejs.org> (varianta „LTS").

---

## 3. Pornire locală (pas cu pas)

Deschide un **Terminal** în folderul proiectului și rulează pe rând:

**Pasul 1 — instalează programele necesare** (o singură dată):
```bash
npm install
```

**Pasul 2 — creează fișierul de setări** (o singură dată):
```bash
cp .env.example .env
```
Apoi deschide fișierul `.env` și schimbă parola de admin (`ADMIN_PASSWORD`) și cheia secretă (`SESSION_SECRET`).

**Pasul 3 — creează baza de date și modelele inițiale** (o singură dată):
```bash
npm run db:push
npm run db:seed
```
`db:push` creează baza de date goală. `db:seed` adaugă lista de ferestre și uși.

**Pasul 4 — pornește site-ul:**
```bash
npm run dev
```
Deschide în browser: <http://localhost:3000>

- Site public: <http://localhost:3000>
- Panou admin: <http://localhost:3000/admin> (parola din `.env`)

> Ca să oprești site-ul, apasă `Ctrl + C` în terminal.

---

## 4. Cum încarci prețurile (ca admin)

1. Intră pe <http://localhost:3000/admin> și autentifică-te.
2. Găsești lista de modele, grupate pe **Ferestre** și **Uși**.
3. La modelul dorit apasă **„Încarcă XML"** și alege fișierul de preț.
4. Aplicația citește fișierul și îți spune câte variante a importat (culori, vitraje).
5. Dacă reîncarci alt fișier pe același model, **înlocuiește** complet prețurile vechi.

Ai și butoanele **„Editează"** (nume, descriere, poză) și **„Șterge"**, plus **„+ Adaugă un tip nou"**.

### Fișier de exemplu
În folderul `samples/` ai un fișier de test: `exemplu-fix.xml` (8 blocuri = 2 culori × 4 vitraje). Îl poți încărca pe modelul „Fereastră fixă" ca să vezi cum funcționează. Prețurile cunoscute din el: `500×500 = 196.60`, `600×500 = 220.90`.

> Fișierul de exemplu e generat automat. Îl poți regenera cu: `npm run gen:sample`.

---

## 5. Cum testezi că totul e corect

```bash
npm test
```
Testele verifică automat:
- **parserul** de XML (citește corect metadatele, lățimile, înălțimile, prețurile, respectă `ss:Index`);
- **calculul prețului** (valori exacte, interpolare, dimensiuni în afara intervalului).

Toate trebuie să apară cu ✓ (verde).

---

## 6. Publicare online (Vercel) — pas cu pas

SQLite (fișierul local) **nu** funcționează pe Vercel, pentru că serverul nu păstrează fișiere. De aceea online folosim o bază de date **Postgres** (gratuită la început).

1. **Urcă proiectul pe GitHub** (dacă nu e deja).
2. Creează cont pe <https://vercel.com> și apasă **„Add New → Project"**, alege repository-ul.
3. Creează o bază de date Postgres:
   - fie din Vercel: **Storage → Create Database → Postgres**;
   - fie gratuit pe <https://neon.tech> și copiază „Connection string".
4. În `prisma/schema.prisma` schimbă:
   ```prisma
   datasource db {
     provider = "postgresql"   // era "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
5. În Vercel, la **Settings → Environment Variables**, adaugă:
   - `DATABASE_URL` = connection string-ul de Postgres
   - `ADMIN_PASSWORD` = parola ta de admin
   - `SESSION_SECRET` = un șir lung și aleator (min. 32 de caractere)
6. Pregătește baza de date online (o singură dată, de pe calculatorul tău, cu `DATABASE_URL` setat spre Postgres):
   ```bash
   npm run db:push
   npm run db:seed
   ```
7. Apasă **Deploy** în Vercel. Gata — primești un link public (ex: `https://site-ul-tau.vercel.app`).

---

## 7. Setări pe care le poți schimba ușor

- **Preț (monedă, TVA, adaos):** fișierul `src/config/pricing.ts`
  - `MONEDA` (implicit „lei")
  - `TVA_INCLUS` (implicit `true` = prețurile din XML sunt finale)
  - `COTA_TVA` (implicit `19`)
  - `ADAOS_PROCENT` (implicit `0` = fără adaos)
- **Date de contact** (butonul „Cere ofertă"): fișierul `src/config/site.ts`

După ce modifici, dacă site-ul rulează local, salvează fișierul — se actualizează singur.

---

## 8. Formatul fișierului XML (pe scurt)

Fișierele sunt în format **SpreadsheetML** (Excel XML 2003). Un fișier = un tip de produs, cu mai multe **blocuri** de preț lipite unul sub altul. Fiecare bloc are:

1. Rânduri de **metadate**: `Tip`, `Profil`, `Culoare`, `Feronerie`, `Vitrare`, `Model de ofertare`, `Data`.
2. Un rând **antet** cu lățimile: `0 | 500 | 600 | ... | 1500` (mm).
3. Câte un rând pe fiecare **înălțime**: `500 | preț | preț | ...`.

Un bloc nou începe când reapare rândul `Tip`. Parserul:
- respectă atributele `ss:Index` (sar peste rânduri/coloane goale);
- nu presupune un număr fix de coloane/rânduri;
- ignoră rândurile goale;
- potrivește etichetele fără să conteze majusculele, spațiile sau diacriticele.

---

## 9. Comenzi utile (rezumat)

| Comandă | Ce face |
|--------|---------|
| `npm install` | Instalează programele necesare (o dată) |
| `npm run db:push` | Creează/actualizează baza de date |
| `npm run db:seed` | Adaugă lista inițială de modele |
| `npm run dev` | Pornește site-ul local (pentru dezvoltare) |
| `npm run build` | Compilează pentru producție |
| `npm start` | Pornește varianta de producție |
| `npm test` | Rulează testele automate |
| `npm run gen:sample` | Regenerează fișierul XML de exemplu |

---

## 10. Structura proiectului (unde e fiecare lucru)

```
src/
  app/
    page.tsx                      Pagina principală (alegi Ferestre/Uși)
    categorie/[category]/         Lista de modele dintr-o categorie
    produs/[slug]/                Configuratorul (client: opțiuni + dimensiuni → preț)
    admin/                        Panoul de admin (login + dashboard)
    api/
      price/                      Calculul prețului (public)
      admin/                      Login, logout, tipuri, upload XML (protejate)
  components/
    Configurator.tsx              Formularul clientului
    AdminManager.tsx              Interfața de administrare
  lib/
    xml-parser.ts                 Citirea fișierelor XML  <- inima aplicației
    pricing.ts                    Calculul prețului (interpolare biliniară)
    variants.ts                   Opțiunile clientului din variante
    auth.ts                       Login-ul de admin
    prisma.ts                     Conexiunea la baza de date
  config/
    pricing.ts                    Monedă, TVA, adaos
    site.ts                       Date de contact
prisma/
  schema.prisma                   Structura bazei de date
  seed.ts                         Lista inițială de modele
samples/
  exemplu-fix.xml                 Fișier XML de test
tests/                            Teste automate (parser + preț)
```
