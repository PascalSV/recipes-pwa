import { Hono } from 'hono';
import type { Env } from '../index';
import { requireAuth } from './middleware';

export const recipeRoutes = new Hono<{ Bindings: Env }>();

recipeRoutes.use('*', requireAuth);

recipeRoutes.get('/', async (c) => {
  const obj = await c.env.RECIPES_BUCKET.get('index.json');
  if (!obj) {
    return c.json({ version: 1, recipes: [] });
  }
  const text = await obj.text();
  return c.json(JSON.parse(text));
});

recipeRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  // Guard: parse route uses this same prefix
  if (id === 'parse') return c.notFound();

  const obj = await c.env.RECIPES_BUCKET.get(`recipes/${id}.json`);
  if (!obj) return c.json({ error: 'Not found' }, 404);
  const text = await obj.text();
  return c.json(JSON.parse(text));
});

recipeRoutes.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();

  // Update the recipe file
  await c.env.RECIPES_BUCKET.put(
    `recipes/${id}.json`,
    JSON.stringify(body),
    { httpMetadata: { contentType: 'application/json' } }
  );

  // Update index.json
  const indexObj = await c.env.RECIPES_BUCKET.get('index.json');
  const index = indexObj
    ? JSON.parse(await indexObj.text())
    : { version: 1, recipes: [] };

  const existing = index.recipes.findIndex((r: { id: string }) => r.id === id);
  const meta = { id, name: body.name, group: body.group, updatedAt: body.updatedAt };
  if (existing >= 0) {
    index.recipes[existing] = meta;
  } else {
    index.recipes.push(meta);
  }

  await c.env.RECIPES_BUCKET.put(
    'index.json',
    JSON.stringify(index),
    { httpMetadata: { contentType: 'application/json' } }
  );

  return c.json({ ok: true });
});
