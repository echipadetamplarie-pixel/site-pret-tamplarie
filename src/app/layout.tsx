import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prețuri tâmplărie — ferestre și uși",
  description:
    "Configurează ferestre și uși PVC/aluminiu și află prețul pe loc, după dimensiuni.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className="min-h-screen">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-bold text-brand">
              Tâmplărie · Prețuri
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/categorie/FERESTRE" className="hover:text-brand">
                Ferestre
              </Link>
              <Link href="/categorie/USI" className="hover:text-brand">
                Uși
              </Link>
              <Link
                href="/admin"
                className="text-gray-400 hover:text-gray-600"
              >
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-gray-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-center text-sm text-gray-500">
            Prețurile sunt orientative. Pentru oferta finală, contactează-ne.
          </div>
        </footer>
      </body>
    </html>
  );
}
