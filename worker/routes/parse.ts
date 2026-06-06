import { Hono } from 'hono';
import type { Env } from '../types.ts';
import { requireApi } from '../lib/auth.ts';
import { parseRecipeText } from '../lib/parseRecipe.ts';

export const parseRoutes = new Hono<{ Bindings: Env }>();

parseRoutes.post('/', async (c) => {
  if (!requireApi(c)) return c.json({ error: 'Unauthorized' }, 401);

  const body = await c.req.json<{ text?: string }>();
  if (!body?.text?.trim()) return c.json({ error: 'Missing text' }, 400);

  return c.json(parseRecipeText(body.text.trim()));
});
