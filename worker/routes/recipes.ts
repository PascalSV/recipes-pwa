import { Hono } from 'hono';
import type { Env, Recipe } from '../types.ts';
import { requireApi } from '../lib/auth.ts';
import { getIndex, getRecipe, saveRecipe } from '../lib/r2.ts';

export const recipeRoutes = new Hono<{ Bindings: Env }>();

recipeRoutes.get('/', async (c) => {
  if (!requireApi(c)) return c.json({ error: 'Unauthorized' }, 401);
  const index = await getIndex(c.env.RECIPES_BUCKET);
  return c.json(index);
});

recipeRoutes.get('/:id', async (c) => {
  if (!requireApi(c)) return c.json({ error: 'Unauthorized' }, 401);
  const recipe = await getRecipe(c.env.RECIPES_BUCKET, c.req.param('id'));
  if (!recipe) return c.json({ error: 'Not found' }, 404);
  return c.json(recipe);
});

recipeRoutes.put('/:id', async (c) => {
  if (!requireApi(c)) return c.json({ error: 'Unauthorized' }, 401);
  const recipe = await c.req.json<Recipe>();
  if (!recipe?.id || !recipe?.name) return c.json({ error: 'Invalid recipe' }, 400);
  await saveRecipe(c.env.RECIPES_BUCKET, recipe);
  return c.json({ ok: true });
});
