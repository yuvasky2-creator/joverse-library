/**
 * Cryptographic Utility for JOVERSE LIBRARY
 * Menggunakan Web Crypto API untuk hashing SHA-256 aman (tanpa dependensi eksternal).
 */

const SALT_PEPPER = "JOVERSE_STUDIO_AUTH_SALT_2026_#99";

export async function hashPassword(password: string, username: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${username.toLowerCase()}:${password}:${SALT_PEPPER}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Synchronous fast hash fallback untuk compatibility
export function fastHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return "h_" + Math.abs(hash).toString(36);
}
