import type { Context, Next } from 'hono';
import type { Env } from '../index';

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
  const auth = c.req.header('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.slice(7);
  const validTokens = [c.env.TOKEN_CLAUDIA, c.env.TOKEN_PASCAL].filter(Boolean);
  if (!validTokens.includes(token)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
}
