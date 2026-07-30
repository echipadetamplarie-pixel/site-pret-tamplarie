// =====================================================================
//  Autentificare admin simplă.
// ---------------------------------------------------------------------
//  - O singură parolă (din variabila de mediu ADMIN_PASSWORD).
//  - După login punem un cookie semnat (token JWT) care ține sesiunea.
//  - Middleware-ul verifică acest cookie pentru rutele /admin.
//  Folosim biblioteca "jose" pentru că funcționează și în middleware.
// =====================================================================

import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tamplarie_admin";
const ISSUER = "site-pret-tamplarie";

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET lipsește sau e prea scurt. Setează-l în fișierul .env",
    );
  }
  return new TextEncoder().encode(secret);
}

/** Verifică dacă parola introdusă e cea corectă. */
export function checkPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

/** Creează un token de sesiune valabil 7 zile. */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

/** Verifică un token de sesiune. Întoarce true dacă e valid. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, getSecretKey(), { issuer: ISSUER });
    return true;
  } catch {
    return false;
  }
}
