import crypto from 'node:crypto';
import type { Request, Response } from 'express';
import { db } from './db.ts';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  doctorId: string | null;
}

const SESSION_COOKIE_NAME = 'raah_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

export function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function createSession(userId: string): { rawToken: string; expiresAt: string } {
  const rawToken = generateOpaqueToken();
  const tokenHash = hashToken(rawToken);
  const nowIso = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  db.prepare(
    `INSERT INTO sessions (token_hash, user_id, expires_at, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(tokenHash, userId, expiresAt, nowIso);

  return { rawToken, expiresAt };
}

export function setSessionCookie(req: Request, res: Response, rawToken: string): void {
  const isHttps =
    req.secure ||
    String(req.headers['x-forwarded-proto'] || '')
      .toLowerCase()
      .includes('https');

  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(rawToken)}`,
    'Path=/',
    'HttpOnly',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];

  if (isHttps) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }

  res.setHeader('Set-Cookie', parts.join('; '));
}

export function clearSessionCookie(req: Request, res: Response): void {
  const isHttps =
    req.secure ||
    String(req.headers['x-forwarded-proto'] || '')
      .toLowerCase()
      .includes('https');

  const parts = [`${SESSION_COOKIE_NAME}=`, 'Path=/', 'HttpOnly', 'Max-Age=0'];
  if (isHttps) {
    parts.push('Secure', 'SameSite=None', 'Partitioned');
  } else {
    parts.push('SameSite=Lax');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  const pairs = cookieHeader.split(';');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) {
      try {
        out[key] = decodeURIComponent(val);
      } catch {
        out[key] = val;
      }
    }
  }
  return out;
}

export function extractRawToken(req: Request): {
  token: string | null;
  viaCookieOnly: boolean;
} {
  const authHeader = req.headers.authorization;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return { token, viaCookieOnly: false };
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies[SESSION_COOKIE_NAME]) {
    return { token: cookies[SESSION_COOKIE_NAME], viaCookieOnly: true };
  }
  return { token: null, viaCookieOnly: false };
}

export function verifyCsrfIfCookieAuth(req: Request, viaCookieOnly: boolean): boolean {
  if (!viaCookieOnly) return true;
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) return true;

  const customHeader = req.headers['x-requested-with'];
  if (customHeader === 'RaahHealth') return true;

  const origin = req.headers.origin;
  const expectedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  if (typeof origin === 'string' && expectedHost) {
    try {
      const originHost = new URL(origin).host;
      if (originHost === expectedHost) return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function resolveSessionUser(req: Request): {
  user: AuthUser | null;
  viaCookieOnly: boolean;
  csrfOk: boolean;
} {
  const { token, viaCookieOnly } = extractRawToken(req);
  const csrfOk = verifyCsrfIfCookieAuth(req, viaCookieOnly);
  if (!token) {
    return { user: null, viaCookieOnly, csrfOk };
  }

  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT u.id, u.name, u.email, u.phone, u.role, s.expires_at, d.id AS doctor_id
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN doctors d ON d.user_id = u.id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: UserRole;
        expires_at: string;
        doctor_id: string | null;
      }
    | undefined;

  if (!row) {
    return { user: null, viaCookieOnly, csrfOk };
  }

  if (Date.parse(row.expires_at) <= Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return { user: null, viaCookieOnly, csrfOk };
  }

  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      doctorId: row.doctor_id ?? null,
    },
    viaCookieOnly,
    csrfOk,
  };
}

export function deleteSessionFromRequest(req: Request): void {
  const { token } = extractRawToken(req);
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}
