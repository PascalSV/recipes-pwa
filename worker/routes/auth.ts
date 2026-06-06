import { Hono } from 'hono';
import type { Env } from '../types.ts';
import { resolveUserToken, resolveToken, sessionCookie } from '../lib/auth.ts';

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ user?: string; token?: string }>();
  const { user, token } = body;

  if (!user || !token) {
    return c.json({ error: 'Missing user or token' }, 400);
  }

  // Find the canonical username (case-insensitive match against ALLOWED_USERS)
  const canonicalUser = c.env.ALLOWED_USERS
    .split(',')
    .map(u => u.trim())
    .find(u => u.toLowerCase() === user.toLowerCase());

  if (!canonicalUser) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // Validate token against this specific user (not a full scan)
  const session = resolveUserToken(c.env, canonicalUser, token);
  if (!session) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  c.header('Set-Cookie', sessionCookie(token));
  return c.json({ user: canonicalUser, token });
});

authRoutes.get('/me', (c) => {
  const cookie = c.req.header('Cookie') ?? '';
  const m = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  if (!m) return c.json({ error: 'Unauthorized' }, 401);
  const session = resolveToken(c.env, decodeURIComponent(m[1]));
  if (!session) return c.json({ error: 'Unauthorized' }, 401);
  return c.json({ user: session.user, token: session.token });
});

authRoutes.post('/logout', (c) => {
  c.header('Set-Cookie', sessionCookie('', true));
  return c.json({ ok: true });
});
