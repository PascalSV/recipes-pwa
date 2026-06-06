import { Hono } from 'hono';
import type { Env } from './types.ts';
import { requirePage } from './lib/auth.ts';
import { getIndex, getRecipe } from './lib/r2.ts';
import { getLangFromCookie, type Lang } from './lib/i18n.ts';
import { authRoutes } from './routes/auth.ts';
import { recipeRoutes } from './routes/recipes.ts';
import { parseRoutes } from './routes/parse.ts';
import { CSS } from './static/css.ts';
import { JS } from './static/js.ts';
import { SW } from './static/sw.ts';
import { loginPage } from './views/login.ts';
import { listPage } from './views/list.ts';
import { detailPage } from './views/detail.ts';
import { newRecipePage, editRecipePage } from './views/new-recipe.ts';
import { settingsPage } from './views/settings.ts';
import { ICON_SVG } from './views/layout.ts';

const app = new Hono<{ Bindings: Env }>();

function lang(c: { req: { header: (k: string) => string | undefined } }): Lang {
  return getLangFromCookie(c.req.header('Cookie') ?? '');
}

// ---- Static assets ----

app.get('/styles.css', (c) =>
  c.text(CSS, 200, { 'Content-Type': 'text/css;charset=UTF-8', 'Cache-Control': 'public,max-age=86400' })
);

app.get('/app.js', (c) =>
  c.text(JS, 200, { 'Content-Type': 'application/javascript;charset=UTF-8', 'Cache-Control': 'public,max-age=86400' })
);

app.get('/sw.js', (c) =>
  c.text(SW, 200, { 'Content-Type': 'application/javascript;charset=UTF-8', 'Cache-Control': 'no-store' })
);

app.get('/manifest.json', (c) =>
  c.json({
    name: 'Rezepte',
    short_name: 'Rezepte',
    description: 'Meine Rezeptsammlung',
    start_url: '/',
    display: 'standalone',
    background_color: '#f0f4f1',
    theme_color: '#2a9d6e',
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any maskable' },
    ],
  }, 200, { 'Cache-Control': 'public,max-age=86400' })
);

app.get('/icon.svg', (c) =>
  c.text(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#2a9d6e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_SVG.replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>`,
    200,
    { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public,max-age=86400' }
  )
);

// ---- API routes ----

app.route('/api/auth', authRoutes);
app.route('/api/recipes', recipeRoutes);
app.route('/api/recipes/parse', parseRoutes);

// ---- Page routes ----

app.get('/login', (c) => {
  const session = requirePage(c);
  if (session) return c.redirect('/');
  return c.html(loginPage(lang(c)));
});

app.get('/', async (c) => {
  const session = requirePage(c);
  if (!session) return c.redirect('/login');
  const index = await getIndex(c.env.RECIPES_BUCKET);
  return c.html(listPage(index.recipes, lang(c)));
});

app.get('/recipe/new', (c) => {
  const session = requirePage(c);
  if (!session) return c.redirect('/login');
  return c.html(newRecipePage(lang(c)));
});

app.get('/recipe/:id', async (c) => {
  const session = requirePage(c);
  if (!session) return c.redirect('/login');
  const recipe = await getRecipe(c.env.RECIPES_BUCKET, c.req.param('id'));
  if (!recipe) return c.notFound();
  return c.html(detailPage(recipe, lang(c)));
});

app.get('/recipe/:id/edit', async (c) => {
  const session = requirePage(c);
  if (!session) return c.redirect('/login');
  const recipe = await getRecipe(c.env.RECIPES_BUCKET, c.req.param('id'));
  if (!recipe) return c.notFound();
  return c.html(editRecipePage(recipe, lang(c)));
});

app.get('/settings', (c) => {
  const session = requirePage(c);
  if (!session) return c.redirect('/login');
  return c.html(settingsPage(session.user, lang(c)));
});

// ---- 404 ----
app.notFound((c) => c.html(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:32px"><h1>404</h1><p>Seite nicht gefunden. <a href="/">Zur Startseite</a></p></body></html>`, 404));

export default app;
