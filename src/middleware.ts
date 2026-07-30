// Middleware: protejează rutele /admin.
// Dacă nu ești logat, te trimite la /admin/login.
// (pagina de login și API-ul de login sunt permise fără sesiune)

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rute permise fără autentificare
  const isLoginPage = pathname === "/admin/login";
  const isLoginApi = pathname === "/api/admin/login";
  if (isLoginPage || isLoginApi) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const valid = await verifySessionToken(token);

  if (!valid) {
    // API -> răspuns 401; pagină -> redirect la login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Neautorizat" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Se aplică doar pe /admin/* și /api/admin/*
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
