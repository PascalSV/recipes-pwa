# Recipes PWA — Build Instructions

## Overview

A Progressive Web App for managing and viewing recipes on iOS/mobile devices. Recipes are stored in Cloudflare R2 (JSON files). A single Cloudflare Worker handles **both** server-side rendering (HTML pages via Hono SSR) and the JSON API. The app supports offline use via a Service Worker and localStorage queue.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Server + Frontend | Cloudflare Workers + Hono (SSR) | Single deployment, HTML rendered at edge |
| Storage | Cloudflare R2 | Object storage for recipe JSON files |
| Offline queue | localStorage | Pending saves queued when offline |
| PWA | Handwritten Service Worker | Cache-first assets, network-first pages |
| Styling | Custom CSS (green theme, CSS variables) | No build pipeline needed |
| Client JS | Vanilla JS (bundled as string in Worker) | No framework, no bundler |

---

## Project Structure

```
recipes-pwa/
├── worker/
│   ├── index.ts                  # Hono app — all routes (pages + API + assets)
│   ├── types.ts                  # Shared TypeScript types
│   ├── lib/
│   │   ├── auth.ts               # Session cookie + bearer token validation
│   │   └── r2.ts                 # R2 read/write helpers
│   ├── routes/
│   │   ├── auth.ts               # POST /api/auth/login, POST /api/auth/logout
│   │   ├── recipes.ts            # GET/PUT /api/recipes
│   │   └── parse.ts              # POST /api/recipes/parse (Anthropic API)
│   ├── views/
│   │   ├── layout.ts             # HTML layout helpers, shared icon SVG, escHtml
│   │   ├── login.ts              # /login page
│   │   ├── list.ts               # / recipe list page
│   │   ├── detail.ts             # /recipe/:id detail page
│   │   ├── new-recipe.ts         # /recipe/new page
│   │   └── settings.ts           # /settings page
│   └── static/
│       ├── css.ts                # Full CSS as exported string constant
│       ├── js.ts                 # Client-side JS as exported string constant
│       └── sw.ts                 # Service Worker JS as exported string constant
├── wrangler.toml
├── tsconfig.json
├── package.json
└── .github/workflows/deploy.yml
```

---

## Routes

### Page Routes (SSR HTML)

| Route | Auth | Description |
|---|---|---|
| `GET /` | Session cookie | Recipe list, grouped by category |
| `GET /login` | — | Login form |
| `GET /recipe/new` | Session cookie | New recipe (paste + parse) |
| `GET /recipe/:id` | Session cookie | Recipe detail with portion control |
| `GET /settings` | Session cookie | Theme + wake lock + logout |

### API Routes (JSON)

| Route | Auth | Description |
|---|---|---|
| `POST /api/auth/login` | — | `{user, token}` → sets session cookie + returns `{user, token}` |
| `POST /api/auth/logout` | — | Clears session cookie |
| `GET /api/recipes` | Bearer / cookie | Returns `RecipeIndex` from R2 |
| `GET /api/recipes/:id` | Bearer / cookie | Returns `Recipe` from R2 |
| `PUT /api/recipes/:id` | Bearer / cookie | Saves recipe to R2, updates index |
| `POST /api/recipes/parse` | Bearer / cookie | Regex/rule-based extraction of ingredients and procedure from raw text |

### Static Assets

| Route | Description |
|---|---|
| `GET /styles.css` | CSS (served from string constant in Worker) |
| `GET /app.js` | Client JS (served from string constant) |
| `GET /sw.js` | Service Worker (no-store cache header) |
| `GET /manifest.json` | PWA web app manifest |
| `GET /icon.svg` | App icon — cooking spoon + list |

---

## Design System

### Color Palette

Main brand color: **`#2a9d6e`** (emerald sage green)

| Variable | Light | Dark |
|---|---|---|
| `--green` | `#2a9d6e` | `#3ec88a` |
| `--green-2` | `#22865c` | `#52d899` |
| `--green-3` | `#e6f5ee` | `#0a2016` |
| `--bg` | `#f0f4f1` | `#0c1810` |
| `--bg-card` | `#ffffff` | `#132018` |
| `--text` | `#1a2820` | `#ddf0e6` |

Dark mode activates via:
1. `prefers-color-scheme: dark` media query (when no class on `<html>`)
2. `.dark` class on `<html>` (user forced dark)
3. `.light` class on `<html>` (user forced light)

Theme stored in `localStorage.theme`: `'system'` | `'light'` | `'dark'`.

### App Icon

SVG cooking spoon + list (defined in `worker/views/layout.ts` as `ICON_SVG`):
- Circle bowl at top-left (spoon head)
- Vertical handle extending down
- Three horizontal lines to the right (representing a recipe list)

Used as the login screen brand icon, PWA `icon.svg`, and browser favicon via manifest.

---

## Authentication

Two hardcoded users: **Claudia** and **Pascal**.

Each has a static bearer token stored as a Worker secret:
- `TOKEN_CLAUDIA`
- `TOKEN_PASCAL`

### Login flow

1. User opens `/login` (server-rendered)
2. Selects user + enters token
3. JS calls `POST /api/auth/login` with `{user, token}`
4. Worker validates via constant-time comparison
5. On success: sets HTTP-only `session` cookie (30 days) + returns `{user, token}` JSON
6. JS stores `token` and `user` in `localStorage`; redirects to `/`

### Session maintenance

- **Page routes**: Worker reads `session` cookie → validates → serves page or redirects to `/login`
- **API calls from JS**: `Authorization: Bearer <token>` header (token from `localStorage`)
- **Logout**: `POST /api/auth/logout` clears cookie; JS clears `localStorage`; redirect

---

## Data Model

### R2 Object Layout

```
pascals-recipes/
├── index.json              # RecipeIndex (metadata only)
└── recipes/
    └── {uuid}.json         # Full Recipe objects
```

### `index.json` shape

```json
{
  "version": 1,
  "recipes": [
    { "id": "uuid", "name": "Spaghetti Carbonara", "group": "Pasta", "updatedAt": "2024-01-01T00:00:00Z" }
  ]
}
```

### Recipe shape

```typescript
interface Recipe {
  id: string;
  name: string;
  group: string;           // e.g. "Fleisch", "Pasta", "Dessert", "Suppe"
  defaultPortions: number;
  cookingTime?: number;    // total cooking time in minutes (optional)
  ingredients: Ingredient[];
  procedure: string[];     // ordered steps
  createdAt: string;       // ISO 8601
  updatedAt: string;
}

interface Ingredient {
  amount: number;
  unit?: 'g' | 'kg' | 'ml' | 'l' | 'tbsp' | 'tsp' | 'cup' | 'piece';
  name: string;
  remark?: string;
}
```

---

## Offline Support

1. **Service Worker** (`/sw.js`) installed on first visit:
   - Static assets (CSS, JS, manifest, icons): cache-first
   - HTML pages + API GETs: network-first, cache fallback
   - Mutations (PUT/POST): pass-through (not cached)

2. **Offline queue** (`localStorage.offlineQueue`): when a `PUT /api/recipes/:id` fails due to network error, the recipe is pushed onto the queue. The queue is flushed on the next successful login.

---

## Client-Side JavaScript

All client JS lives in `worker/static/js.ts`, served from `/app.js`.

Page detection: `document.body.dataset.page` → `'login'` | `'list'` | `'detail'` | `'new'` | `'settings'`.

Key functions:
| Function | Description |
|---|---|
| `api(path, opts)` | Authenticated fetch: injects Bearer token, redirects on 401 |
| `logout()` | Clears cookie + localStorage, redirects to /login |
| `changePortions(delta)` | Scales ingredient amounts via `data-amount` attributes |
| `shareIngredients()` | Web Share API + clipboard fallback |
| `handleParse()` | Calls `/api/recipes/parse`, shows form on success |
| `handleSave()` | Saves recipe or queues offline |
| `setTheme(t)` | Applies `.dark`/`.light` to `<html>`, persists to localStorage |

---

## wrangler.toml

```toml
name = "recipes-pwa-api"
main = "worker/index.ts"
compatibility_date = "2024-09-23"
workers_dev = true

routes = [
  { pattern = "recipes-pwa.everyday-apps.org", custom_domain = true }
]

[[r2_buckets]]
binding = "RECIPES_BUCKET"
bucket_name = "pascals-recipes"
preview_bucket_name = "pascals-recipes"

[vars]
ALLOWED_USERS = "Claudia,Pascal"
```

Worker secrets (set via `wrangler secret put`):
- `TOKEN_CLAUDIA`
- `TOKEN_PASCAL`

---

## Deployment

Single command — no frontend build step required:

```bash
npx wrangler deploy
```

### GitHub Actions (`.github/workflows/deploy.yml`)

On push to `main`: `npm ci` → `npx wrangler deploy`

Uses GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

### First-time setup

```bash
npm install
wrangler login
wrangler secret put TOKEN_CLAUDIA
wrangler secret put TOKEN_PASCAL
```

### Local dev

```bash
npm run dev   # wrangler dev — runs at localhost:8787
```

---

## Key Implementation Notes

- **No build pipeline**: CSS and client JS are TypeScript string constants bundled directly into the Worker. No Vite, webpack, or separate build step.
- **Single deployment unit**: One `wrangler deploy` command handles the entire app (HTML + API + static assets).
- **Session cookie**: HTTP-only, SameSite=Lax, 30-day `Max-Age`. Token also in localStorage so JS can make API calls (e.g. save recipe) without page reload.
- **Portion scaling**: Ingredient amounts rendered as `<span data-amount="X">`. JS computes `(amount / defaultPortions) * currentPortions` on each `changePortions()` call.
- **R2 access**: Strictly server-side inside the Worker. Never exposed to the browser.
- **Constant-time comparison**: `timingSafeEqual` in `worker/lib/auth.ts` prevents timing attacks on token validation.
- **Dark mode flash prevention**: Inline `<script>` in `<head>` reads `localStorage.theme` and adds `.dark` / `.light` to `<html>` synchronously before the stylesheet applies.
- **Recipe parsing**: `POST /api/recipes/parse` uses regex/rule-based extraction — no external API needed. Handles:
  - German + English units (`EL`→tbsp, `TL`→tsp, `Gramm`→g, `Tasse`→cup, etc.)
  - Unicode fractions (`½`, `¾`, mixed `1½`) and ASCII fractions (`3/4`)
  - Ranges (`350 bis 400 g`, `2 - 3 TL`) — takes the higher value
  - Two-line format: amount on one line, name on the next (`500 Gramm\nKartoffeln`)
  - Compound lines (`2 TL Salz und 2 TL Pfeffer`) split into separate ingredients
  - Parenthetical remarks (`(gehackt)`) extracted; weight clarifications (`(800 g …)`) discarded
  - `Gesamtzeit:` / `Kochzeit:` / `Zubereitungszeit:` → `cookingTime` in minutes
  - `Nährwerte pro Portion` block (nutritional data) filtered out entirely
  - `Schwierigkeitsgrad` lines filtered out
