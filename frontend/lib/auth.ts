import crypto from "node:crypto";
import { verifyMessage } from "viem";
import { db } from "./db";

const AUTH_SECRET = process.env.AUTH_SECRET || "clearescrow_default_secret_key_change_in_production";
const NONCE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function formatAuthMessage(address: string, nonce: string): string {
  return `Sign this one-time challenge to authenticate on ClearEscrow:\nAddress: ${address.toLowerCase()}\nNonce: ${nonce}`;
}

export function generateNonce(address: string): string {
  const normalizedAddress = address.toLowerCase();
  const nonce = crypto.randomBytes(16).toString("hex");
  const expiresAt = Date.now() + NONCE_EXPIRY_MS;

  const stmt = db.prepare(`
    INSERT INTO auth_nonces (address, nonce, expires_at)
    VALUES (?, ?, ?)
    ON CONFLICT(address) DO UPDATE SET nonce = excluded.nonce, expires_at = excluded.expires_at
  `);
  stmt.run(normalizedAddress, nonce, expiresAt);

  return nonce;
}

export async function verifyWalletSignature(
  address: string,
  signature: string,
  nonce: string
): Promise<boolean> {
  const normalizedAddress = address.toLowerCase();

  // Retrieve nonce
  const stmt = db.prepare("SELECT nonce, expires_at FROM auth_nonces WHERE address = ?");
  const row = stmt.get(normalizedAddress) as { nonce: string; expires_at: number } | undefined;

  if (!row || row.nonce !== nonce || Date.now() > row.expires_at) {
    return false;
  }

  // Verify signature with viem
  const message = formatAuthMessage(normalizedAddress, nonce);
  try {
    const isValid = await verifyMessage({
      address: normalizedAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (isValid) {
      // Consume the nonce to prevent replay attacks
      db.prepare("DELETE FROM auth_nonces WHERE address = ?").run(normalizedAddress);
      return true;
    }
  } catch (err) {
    console.error("Signature verification error:", err);
  }

  return false;
}

export function createSessionToken(address: string): string {
  const normalizedAddress = address.toLowerCase();
  const exp = Date.now() + SESSION_EXPIRY_MS;
  const payload = Buffer.from(JSON.stringify({ address: normalizedAddress, exp })).toString("base64url");
  const hmac = crypto.createHmac("sha256", AUTH_SECRET).update(payload).digest("base64url");
  return `${payload}.${hmac}`;
}

export function verifySessionToken(token: string): { address: string } | null {
  try {
    const [payloadB64, hmac] = token.split(".");
    if (!payloadB64 || !hmac) return null;

    const expectedHmac = crypto.createHmac("sha256", AUTH_SECRET).update(payloadB64).digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
    if (!payload.address || !payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return { address: payload.address.toLowerCase() };
  } catch {
    return null;
  }
}

export function getAuthenticatedUser(req: Request): { address: string } | null {
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return verifySessionToken(authHeader.slice(7).trim());
  }

  const customHeader = req.headers.get("x-auth-token");
  if (customHeader) {
    return verifySessionToken(customHeader.trim());
  }

  return null;
}
