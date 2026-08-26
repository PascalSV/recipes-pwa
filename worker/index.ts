import { Hono } from 'hono';
import type { Env } from './types.ts';
import { requirePage } from './lib/auth.ts';
import { getIndex, getRecipe } from './lib/r2.ts';
import { getLangFromCookie, type Lang } from './lib/i18n.ts';
import { authRoutes } from './routes/auth.ts';
import { recipeRoutes } from './routes/recipes.ts';
import { CSS } from './static/css.ts';
import {
  FONT_D_DIN,
  FONT_D_DIN_BOLD,
  FONT_D_DIN_ITALIC,
  FONT_D_DINCONDENSED,
  FONT_D_DINCONDENSED_BOLD,
} from './static/fontdata.ts';
import { JS } from './static/js.ts';
import { SW } from './static/sw.ts';
import { ICON_PNG } from './static/icondata.ts';
import { loginPage } from './views/login.ts';
import { listPage } from './views/list.ts';
import { detailPage } from './views/detail.ts';
import { newRecipePage, editRecipePage } from './views/new-recipe.ts';
import { settingsPage } from './views/settings.ts';
import { recipeNotFoundPage } from './views/layout.ts';

const app = new Hono<{ Bindings: Env }>();

function lang(c: { req: { header: (k: string) => string | undefined } }): Lang {
  return getLangFromCookie(c.req.header('Cookie') ?? '');
}

// ---- Static assets ----

app.get('/styles.css', (c) =>
  c.text(CSS, 200, { 'Content-Type': 'text/css;charset=UTF-8', 'Cache-Control': 'public,max-age=86400' })
);

const FONT_CACHE = 'public,max-age=31536000,immutable';
function serveFont(b64: string): Response {
  const bytes = Uint8Array.from(atob(b64), ch => ch.charCodeAt(0));
  return new Response(bytes, { headers: { 'Content-Type': 'font/otf', 'Cache-Control': FONT_CACHE } });
}

app.get('/fonts/D-DIN.otf',              () => serveFont(FONT_D_DIN));
app.get('/fonts/D-DIN-Bold.otf',         () => serveFont(FONT_D_DIN_BOLD));
app.get('/fonts/D-DIN-Italic.otf',       () => serveFont(FONT_D_DIN_ITALIC));
app.get('/fonts/D-DINCondensed.otf',     () => serveFont(FONT_D_DINCONDENSED));
app.get('/fonts/D-DINCondensed-Bold.otf',() => serveFont(FONT_D_DINCONDENSED_BOLD));

app.get('/app.js', (c) =>
  c.text(JS, 200, { 'Content-Type': 'application/javascript;charset=UTF-8', 'Cache-Control': 'public,max-age=86400' })
);

app.get('/sw.js', (c) =>
  c.text(SW, 200, { 'Content-Type': 'application/javascript;charset=UTF-8', 'Cache-Control': 'no-store' })
);

app.get('/manifest.json', (c) =>
  c.json({
    name: 'Pascals Rezeptesammlung',
    short_name: 'Pascals Rezepte',
    description: "Pascal's Recipe Collection",
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f2f7',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon.png', type: 'image/png', sizes: '512x512', purpose: 'any maskable' },
    ],
  }, 200, { 'Cache-Control': 'public,max-age=86400' })
);

app.get('/icon.png', () => {
  const bytes = Uint8Array.from(atob(ICON_PNG), ch => ch.charCodeAt(0));
  return new Response(bytes, { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public,max-age=86400' } });
});

// ---- API routes ----

app.route('/api/auth', authRoutes);
app.route('/api/recipes', recipeRoutes);

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
  if (!recipe) return c.html(recipeNotFoundPage(lang(c)), 404);
  return c.html(detailPage(recipe, lang(c)));
});

app.get('/recipe/:id/edit', async (c) => {
  const session = requirePage(c);
  if (!session) return c.redirect('/login');
  const recipe = await getRecipe(c.env.RECIPES_BUCKET, c.req.param('id'));
  if (!recipe) return c.html(recipeNotFoundPage(lang(c)), 404);
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
