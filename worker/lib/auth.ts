import type { Context } from 'hono';
import type { Env, Session } from '../types.ts';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  let diff = 0;
  for (let i = 0; i < ae.length; i++) diff |= ae[i] ^ be[i];
  return diff === 0;
}

// Validate a token against a specific known user (used at login).
export function resolveUserToken(env: Env, user: string, token: string): Session | null {
  const secret = (env as Record<string, string>)[`TOKEN_${user.toUpperCase()}`];
  if (!secret || !timingSafeEqual(token, secret)) return null;
  return { user, token };
}

// Scan all users to find who owns a token (used for cookie / bearer validation).
export function resolveToken(env: Env, token: string): Session | null {
  const users = env.ALLOWED_USERS.split(',').map(u => u.trim());
  for (const user of users) {
    const secret = (env as Record<string, string>)[`TOKEN_${user.toUpperCase()}`];
    if (secret && timingSafeEqual(token, secret)) return { user, token };
  }
  return null;
}

export function getSession(c: Context<{ Bindings: Env }>): Session | null {
  const cookie = c.req.header('Cookie') ?? '';
  const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!m) return null;
  return resolveToken(c.env, decodeURIComponent(m[1]));
}

export function getBearerSession(c: Context<{ Bindings: Env }>): Session | null {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  return resolveToken(c.env, auth.slice(7));
}

export function requirePage(c: Context<{ Bindings: Env }>): Session | null {
  return getSession(c);
}

export function requireApi(c: Context<{ Bindings: Env }>): Session | null {
  return getBearerSession(c) ?? getSession(c);
}

export function sessionCookie(token: string, clear = false): string {
  if (clear) return 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  const val = encodeURIComponent(token);
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  return `session=${val}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
