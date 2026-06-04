import { Hono } from 'hono';
import type { Env } from '../index';

export const authRoutes = new Hono<{ Bindings: Env }>();

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

authRoutes.post('/login', async (c) => {
  const body = await c.req.json<{ user?: string; token?: string }>();
  const { user, token } = body;

  if (!user || !token) {
    return c.json({ error: 'Missing user or token' }, 400);
  }

  const validUsers = (c.env.ALLOWED_USERS ?? 'Claudia,Pascal').split(',');
  if (!validUsers.includes(user)) {
    return c.json({ error: 'Unknown user' }, 401);
  }

  const expectedToken = user === 'Claudia' ? c.env.TOKEN_CLAUDIA : c.env.TOKEN_PASCAL;
  if (!expectedToken || !timingSafeEqual(token, expectedToken)) {
    return c.json({ error: 'Invalid token' }, 401);
  }

  return c.json({ user, token });
});
