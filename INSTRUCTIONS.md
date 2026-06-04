# Recipes PWA — Build Instructions

## Overview

A Progressive Web App for managing and viewing recipes on iOS devices. Recipes are stored in Cloudflare R2 (JSON files). A Cloudflare Worker proxies all R2 access and handles authentication. The app runs offline-first using IndexedDB for local caching and syncs with R2 when a recipe is opened.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend framework | React 18 + TypeScript + Vite | Fast builds, excellent PWA tooling |
| UI components | Konsta UI + Tailwind CSS | Pixel-perfect iOS-style components |
| PWA | vite-plugin-pwa (Workbox) | Service worker + install prompt |
| Backend | Cloudflare Workers + Hono | Lightweight, runs at edge, R2 bindings |
| Storage | Cloudflare R2 | Object storage for recipe JSON files |
| Local cache | IndexedDB (idb library) | Offline recipe access |
| i18n | i18next + react-i18next | EN/DE translations, auto language detection |
| Dark mode | Tailwind `dark:` + `prefers-color-scheme` | System-aware, manually overridable |
| Testing | Vitest + React Testing Library | Fast unit/component tests |
| Deployment | Cloudflare Pages (frontend) + Workers (API) | Same infrastructure as R2 |

---

## Project Structure

```
recipes-pwa/
├── src/                          # React frontend
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── LoginScreen.tsx
│   │   ├── RecipeList.tsx
│   │   ├── RecipeDetail.tsx
│   │   ├── SettingsView.tsx
│   │   ├── NewRecipeView.tsx
│   │   ├── IngredientEditor.tsx
│   │   ├── IngredientsList.tsx
│   │   ├── SearchBar.tsx
│   │   └── PortionControl.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useRecipes.ts
│   │   ├── useRecipeDetail.ts
│   │   └── useWakeLock.ts
│   ├── lib/
│   │   ├── api.ts               # API client (fetch wrapper)
│   │   ├── db.ts                # IndexedDB helpers (idb)
│   │   ├── parseRecipe.ts       # Client-side noise removal before parse API call
│   │   └── shareIngredients.ts  # Web Share API export
│   ├── i18n/
│   │   ├── index.ts             # i18next setup + language detection
│   │   ├── en.json              # English translations
│   │   └── de.json              # German translations
│   ├── types/
│   │   └── index.ts             # Shared TypeScript types
│   └── __tests__/               # Unit & component tests
│       ├── fixtures/
│       │   └── bohnen-auflauf-raw.txt   # Raw paste fixture (full text incl. noise)
│       ├── LoginScreen.test.tsx
│       ├── RecipeList.test.tsx
│       ├── RecipeDetail.test.tsx
│       ├── PortionControl.test.tsx
│       ├── shareIngredients.test.ts
│       ├── i18n.test.ts
│       ├── useWakeLock.test.ts
│       ├── SettingsView.test.tsx
│       ├── NewRecipeView.test.tsx
│       ├── IngredientEditor.test.tsx
│       ├── parseRecipe.test.ts
│       └── api.test.ts
├── worker/                       # Cloudflare Worker (API backend)
│   ├── index.ts                  # Hono app entry point
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── recipes.ts
│   │   └── parse.ts             # POST /api/recipes/parse → Anthropic API
│   └── __tests__/
│       ├── auth.test.ts
│       ├── recipes.test.ts
│       └── parse.test.ts
├── migrations/                   # R2 seed data (JSON)
│   └── seed.ts                   # Script to upload initial recipe data
├── public/
│   ├── manifest.json             # PWA manifest (iOS meta tags)
│   └── icons/                    # App icons (180x180, 192x192, 512x512)
├── wrangler.toml
├── vite.config.ts
├── tailwind.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

---

## Data Model

### R2 Object Layout

```
pascals-recipes/            # existing Cloudflare R2 bucket
├── index.json              # Recipe index (metadata only, no ingredients)
└── recipes/
    ├── {uuid}.json         # Full recipe objects
    └── ...
```

### `index.json` shape

```json
{
  "version": 1,
  "recipes": [
    {
      "id": "uuid-v4",
      "name": "Spaghetti Carbonara",
      "group": "Pasta",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### `recipes/{id}.json` shape

```typescript
interface Recipe {
  id: string;
  name: string;
  group: string;           // e.g. "Appetizers", "Meat", "Dessert", "Pasta", "Soup"
  defaultPortions: number;
  ingredients: Ingredient[];
  procedure: string[];     // ordered steps as plain text
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}

type Unit = 'g' | 'kg' | 'ml' | 'l' | 'tbsp' | 'tsp' | 'cup' | 'piece';

interface Ingredient {
  amount: number;     // numeric amount for defaultPortions
  unit?: Unit;        // omit for naturally countable items (eggs, cloves, etc.)
  name: string;       // e.g. "Parmesan"
  remark?: string;    // parenthetical note, e.g. "drained and rinsed" or "grated"
}
```

### IndexedDB schema (local cache)

```
Database: "recipes-pwa"
Store: "recipes"      key: id, indexes: [group, updatedAt]
Store: "index"        key: "singleton" (stores the full index.json)
Store: "auth"         key: "session" (stores { user, token, expiresAt })
Store: "prefs"        key: "singleton" (stores { language: 'en'|'de', theme: 'light'|'dark'|'system', wakeLock: boolean })
```

---

## Authentication

- Two hardcoded users: **Claudia** and **Pascal**
- Each user has a static bearer token stored as a Cloudflare Worker Secret:
  - `TOKEN_CLAUDIA`
  - `TOKEN_PASCAL`
- The login screen shows two user buttons (Claudia / Pascal) + a text input for the token
- On submit, the frontend calls `POST /api/auth/login` with `{ user, token }`
- The Worker compares the token against the matching secret (constant-time comparison)
- On success, returns `{ user, token }` — the frontend stores this in IndexedDB `auth` store and in React state
- All subsequent API requests include `Authorization: Bearer <token>`
- Session persists across app restarts (loaded from IndexedDB on mount)
- Logout clears IndexedDB auth store

---

## Cloudflare Worker API

### Routes (Hono framework)

```
POST /api/auth/login        { user, token } → { user, token } | 401
GET  /api/recipes           → RecipeIndex (index.json from R2)
GET  /api/recipes/:id       → Recipe (recipes/{id}.json from R2)
PUT  /api/recipes/:id       → 200 (writes recipe to R2, auth required)
POST /api/recipes/parse     { text: string } → ParsedRecipe (calls Anthropic API, auth required)
```

All `/api/recipes/*` routes require valid `Authorization: Bearer <token>` header.

### wrangler.toml

```toml
name = "recipes-pwa-api"
main = "worker/index.ts"
compatibility_date = "2024-09-23"

[[r2_buckets]]
binding = "RECIPES_BUCKET"
bucket_name = "pascals-recipes"
preview_bucket_name = "pascals-recipes-preview"

[vars]
ALLOWED_USERS = "Claudia,Pascal"
```

Worker secrets (set via `wrangler secret put`):
- `TOKEN_CLAUDIA`
- `TOKEN_PASCAL`

---

## Frontend — Screen Flows

### 1. Login Screen (`LoginScreen.tsx`)

- Displayed when no valid session in IndexedDB
- Two large iOS-style buttons: **Claudia** | **Pascal** (toggles selection)
- Text input (type=password) labelled "Token"
- "Sign In" button — disabled until user selected and token non-empty
- On success: navigate to Recipe List
- On failure: show iOS-style error message under the input

### 2. Recipe List (`RecipeList.tsx`)

- Top nav bar: "Recipes" title; right side has a `+` icon (→ New Recipe), gear icon (→ Settings), and logout icon
- Search bar below nav (filters by recipe name, case-insensitive)
- Recipes grouped alphabetically by group name (sections with sticky headers)
- Each row: recipe name + chevron right
- On tap: navigate to Recipe Detail
- Data loaded from IndexedDB first (instant), then refresh index from `/api/recipes`

### 3. Settings View (`SettingsView.tsx`)

Accessible via the gear icon in the Recipe List nav bar. iOS-style grouped list layout.

**Appearance section**
- Theme: segmented control with three options — System / Light / Dark
- Language: segmented control with two options — English / Deutsch

**Display section**
- Keep Screen On: toggle switch (iOS-style)
  - When enabled, activates the Screen Wake Lock API to prevent the display from sleeping
  - Shows a warning label if the device/browser does not support Wake Lock (`'wakeLock' in navigator`)
  - Re-acquires the lock automatically if the app comes back to the foreground

**Account section**
- Logged in as: `{username}` (read-only label)
- Sign Out: destructive list item (red text)

### 4. Recipe Detail (`RecipeDetail.tsx`)

- Top nav: back button + recipe name
- On mount: check if local IndexedDB has recipe with matching `updatedAt`; if not, fetch from `/api/recipes/:id` and update cache
- **Portion control** (sticky below nav): `−` button | `{n} portions` label | `+` button
  - Min: 1, no max
  - All ingredient amounts scale proportionally: `displayed = (amount / defaultPortions) * currentPortions`
  - Amounts rounded to 1 decimal place (drop trailing zero)
- **Section 1 — Ingredients**: table/list rows with `amount unit name` and, if present, `remark` displayed as a subdued secondary line below
  - Share button (top right of section): exports ingredients via Web Share API
- **Section 2 — Procedure**: numbered steps, each as a card/block

---

## Shopping List Export

File: `src/lib/shareIngredients.ts`

- Uses `navigator.share()` (Web Share API, available on iOS Safari)
- Falls back to copying to clipboard if share not supported
- Format per ingredient (scaled to current portions):
  ```
  200 g Spaghetti
  100 g Pancetta
  3 Eggs
  ```
- Items without a unit display as `amount name` (no unit column)
- If a `remark` is present it is appended in parentheses: `200 g Cannellini Beans (drained and rinsed)`
- Each ingredient on its own line, prefixed with the scaled amount

---

## Smart Recipe Import

### Overview

A "New Recipe" view (accessible via a `+` button in the Recipe List nav bar) lets the user paste free-form recipe text. The text is sent to a Worker endpoint that calls the Claude API to extract structured recipe data. The user then reviews and edits the result before saving to R2.

### New components / files

| File | Purpose |
|---|---|
| `src/components/NewRecipeView.tsx` | Paste area + parse button + editable result form |
| `src/components/IngredientEditor.tsx` | Editable row: amount / unit picker / name / remark |
| `src/lib/parseRecipe.ts` | Client-side pre-processing (noise removal) before sending to API |
| `worker/routes/parse.ts` | Worker route calling Anthropic API |

### Client-side pre-processing (`src/lib/parseRecipe.ts`)

Before sending to the API, strip common noise patterns that appear in copy-pasted web text:

```typescript
export function preprocessRecipeText(raw: string): string {
  return raw
    // Remove lines that are clearly navigation / metadata (no digits, very short, or known patterns)
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      // Drop lines that look like article teasers: short lines with no punctuation or digits
      if (trimmed.length < 4) return false;
      // Drop lines matching known noise patterns
      if (/^(mehr zum thema|rezept für|das schmeckt|hier trifft)/i.test(trimmed)) return false;
      return true;
    })
    .join('\n');
}
```

This removes the "Mehr zum Thema / Katrin kocht / …" block from the test text before it ever reaches the API, reducing token usage and avoiding confusion.

### Worker route (`worker/routes/parse.ts`)

```
POST /api/recipes/parse
Authorization: Bearer <token>
Body: { text: string }
Response: ParsedRecipe
```

The Worker calls `https://api.anthropic.com/v1/messages` with the Anthropic SDK. The prompt asks Claude to return a single JSON object — no markdown fences, no prose.

### Extraction prompt (system + user)

**System:**
```
You are a recipe parser. Extract structured data from recipe text and return ONLY valid JSON — no markdown, no explanation.
```

**User:**
```
Extract the recipe from the following text and return this exact JSON shape:

{
  "ingredients": [
    { "amount": number, "unit": "g|kg|ml|l|tbsp|tsp|cup|piece|null", "name": "string", "remark": "string|null" }
  ],
  "procedure": ["step 1", "step 2"]
}

Rules:
- unit must be one of: g, kg, ml, l, tbsp, tsp, cup, piece — or null for countable items (onion, clove, slice)
- Map German units: EL → tbsp, TL → tsp, g → g, kg → kg, ml → ml, l → l
- For range amounts (e.g. "350 bis 400 g", "1-2") use the higher value
- Split compound lines ("2 tsp A and 2 tsp B") into separate ingredient objects; if the parenthetical note at the end applies to all split items, copy it to each
- For parenthetical notes: extract preparation instructions like "(gerieben)", "(abgetropft und abgespült)", "(im Mörser zerstoßen)" into the remark field and remove them from name
- Discard parentheticals that only clarify weight or volume (e.g. "(800 g mit Flüssigkeit)", "(ca. 400 ml)") — these contain numbers and are not useful for preparation
- If multiple qualifying parentheticals remain after discarding weight notes, join them with "; "
- Omit the remark field entirely when there is no preparation note
- Ignore any non-recipe content (navigation links, article teasers, author names)
- Procedure: split at logical action boundaries into individual steps; each step is a complete sentence or short group of related sentences; omit blank lines and non-recipe text

Text:
{preprocessedText}
```

### Parsed result type

```typescript
interface ParsedRecipe {
  ingredients: Ingredient[];   // same Ingredient type used throughout the app
  procedure: string[];
}
```

### New Recipe form flow

1. User taps `+` in Recipe List nav → `NewRecipeView` opens
2. Large text area with placeholder; "Extract Recipe" button (disabled while empty)
3. On tap: `preprocessRecipeText()` runs client-side, then `POST /api/recipes/parse` is called
4. While waiting: spinner replaces the button, text area is locked
5. On success: text area is replaced by an editable form:
   - **Name** — text input (empty, user must fill in)
   - **Category** — picker from known groups + free-text option
   - **Default Portions** — stepper (default: 4)
   - **Ingredients** — list of `IngredientEditor` rows (amount / unit / name / remark); rows can be reordered, deleted, or added
   - **Steps** — list of text areas, numbered; can be reordered, deleted, or added
6. "Save Recipe" button → generates a UUID, writes to R2 via `PUT /api/recipes/:id`, updates `index.json`, navigates back to Recipe List
7. On parse error: show error message, keep text area editable so user can fix and retry

### `IngredientEditor` row layout

```
[ amount ] [ unit ▾ ] [ name                    ] [ ✕ ]
           [ remark (optional, subdued)           ]
```

- Amount: numeric input, narrow
- Unit: tap-to-select sheet with all `Unit` values + "—" for none
- Name: text input, expands
- Remark: secondary text input, shown below in smaller grey text; placeholder "e.g. drained and rinsed"
- ✕: delete row

### Worker secret required

```
wrangler secret put ANTHROPIC_API_KEY
```

The Worker uses `@anthropic-ai/sdk` (or a direct `fetch` to `api.anthropic.com`). Recommended model: `claude-haiku-4-5-20251001` — fast and cheap for structured extraction tasks.

### Update to `wrangler.toml`

Add the new parse route to the existing Worker; no new infrastructure needed.

### Testing

| File | What to test |
|---|---|
| `parseRecipe.test.ts` | Uses `bohnen-auflauf-raw.txt` fixture: noise block lines absent after preprocessing, ingredient + procedure lines preserved, blank lines stripped |
| `NewRecipeView.test.tsx` | Parse button disabled when empty, spinner shown during call, form populated on success, error shown on failure |
| `IngredientEditor.test.tsx` | Amount/unit/name/remark inputs render and update correctly, delete removes row |
| `worker/parse.test.ts` | Uses `bohnen-auflauf-raw.txt` fixture with mocked Anthropic response matching expected JSON: 15 ingredients, 7 steps, weight note absent from remark, range amounts resolved, compound line split, German units mapped |

**Reference test fixture** — embed verbatim in `src/__tests__/fixtures/bohnen-auflauf-raw.txt` and import in both `parseRecipe.test.ts` and `worker/parse.test.ts`:

```
480 g (800 g mit Flüssigkeit) Cannellini- oder Weiße Bohnen aus dem Glas (abgetropft und abgespült)

350 bis 400 g Dosentomaten

3 EL Olivenöl

1 Zwiebel (gehackt)

4 Knoblauchzehen (gerieben)

25 g frischer Ingwer (gerieben)

2 TL Kreuzkümmelsamen und 2 TL Koriandersamen (im Mörser zerstoßen)

1 TL Paprikapulver

3 EL Tomatenmark

1 TL Zucker

25 g frischer Koriander (gehackt)

100 g geriebener Käse

120 g Frischkäse

1-2 Brotscheiben pro Person

Öl in einer großen ofenfesten Pfanne erhitzen. Zwiebel und ⅛ Teelöffel Salz zufügen, Hitze auf mittlere Stufe reduzieren und Zwiebel 10 Minuten anbraten, bis sie weich und sehr hell ist. Knoblauch, Ingwer, Gewürze und Tomatenmark zugeben und alles weitere 2–3 Minuten braten, bis die Masse tiefrot ist. Backofen auf die höchste Stufe vorheizen und einen Backrost auf die oberste Schiene schieben.
Mehr zum Thema

    Katrin kocht
    Blumenkohl mit Trauben
    Rezept für Chicorée
    Das schmeckt nicht nur Meerschweinchen
    Rezept für Gnocchi
    Hier trifft Süßes auf Salziges

Dann Tomaten, Zucker, etwas Salz, 450 ml Wasser und Bohnen zu den Zwiebeln geben und die Sauce unter gelegentlichem Rühren etwa 12 Minuten kochen lassen, bis sie leicht eingedickt ist. Koriander unterrühren und vom Herd nehmen. Frischkäse und Reibekäse unterrühren. Pfanne in den Ofen schieben und 12 bis 15 Minuten backen, oder bis die Oberfläche gebräunt ist und Blasen wirft. Währenddessen Brotscheiben in einer Pfanne mit Öl rösten. Dazu passt ein grüner Salat.
```

**Expected output of `preprocessRecipeText(fixture)`** — assert these lines are absent:
- `Mehr zum Thema`
- `Katrin kocht`
- `Blumenkohl mit Trauben`
- `Rezept für Chicorée`
- `Das schmeckt nicht nur Meerschweinchen`
- `Rezept für Gnocchi`
- `Hier trifft Süßes auf Salziges`

And assert these lines are present (sample):
- `480 g (800 g mit Flüssigkeit) Cannellini- oder Weiße Bohnen aus dem Glas (abgetropft und abgespült)`
- `Öl in einer großen ofenfesten Pfanne erhitzen.`

**Expected parsed result** (used as the assertion fixture in `worker/parse.test.ts` by mocking the Anthropic response):

```json
{
  "ingredients": [
    { "amount": 480, "unit": "g", "name": "Cannellini- oder Weiße Bohnen aus dem Glas", "remark": "abgetropft und abgespült" },
    { "amount": 400, "unit": "g", "name": "Dosentomaten" },
    { "amount": 3, "unit": "tbsp", "name": "Olivenöl" },
    { "amount": 1, "name": "Zwiebel", "remark": "gehackt" },
    { "amount": 4, "name": "Knoblauchzehen", "remark": "gerieben" },
    { "amount": 25, "unit": "g", "name": "frischer Ingwer", "remark": "gerieben" },
    { "amount": 2, "unit": "tsp", "name": "Kreuzkümmelsamen", "remark": "im Mörser zerstoßen" },
    { "amount": 2, "unit": "tsp", "name": "Koriandersamen", "remark": "im Mörser zerstoßen" },
    { "amount": 1, "unit": "tsp", "name": "Paprikapulver" },
    { "amount": 3, "unit": "tbsp", "name": "Tomatenmark" },
    { "amount": 1, "unit": "tsp", "name": "Zucker" },
    { "amount": 25, "unit": "g", "name": "frischer Koriander", "remark": "gehackt" },
    { "amount": 100, "unit": "g", "name": "geriebener Käse" },
    { "amount": 120, "unit": "g", "name": "Frischkäse" },
    { "amount": 2, "name": "Brotscheiben", "remark": "pro Person" }
  ],
  "procedure": [
    "Öl in einer großen ofenfesten Pfanne erhitzen. Zwiebel und ⅛ Teelöffel Salz zufügen, Hitze auf mittlere Stufe reduzieren und Zwiebel 10 Minuten anbraten, bis sie weich und sehr hell ist.",
    "Knoblauch, Ingwer, Gewürze und Tomatenmark zugeben und alles weitere 2–3 Minuten braten, bis die Masse tiefrot ist.",
    "Backofen auf die höchste Stufe vorheizen und einen Backrost auf die oberste Schiene schieben.",
    "Tomaten, Zucker, etwas Salz, 450 ml Wasser und Bohnen zu den Zwiebeln geben und die Sauce unter gelegentlichem Rühren etwa 12 Minuten kochen lassen, bis sie leicht eingedickt ist.",
    "Koriander unterrühren und vom Herd nehmen. Frischkäse und Reibekäse unterrühren.",
    "Pfanne in den Ofen schieben und 12 bis 15 Minuten backen, oder bis die Oberfläche gebräunt ist und Blasen wirft.",
    "Währenddessen Brotscheiben in einer Pfanne mit Öl rösten. Dazu passt ein grüner Salat."
  ]
}
```

Key assertions to make in `worker/parse.test.ts`:
- Ingredient 1: `remark` is `"abgetropft und abgespült"` — the `(800 g mit Flüssigkeit)` weight note is **not** present in remark
- Ingredient 2: `amount` is `400` (higher of `350 bis 400`), no remark
- Ingredients 7 + 8: both have `remark: "im Mörser zerstoßen"` (note copied to both split items)
- Ingredient 15: `amount` is `2` (higher of `1-2`), no unit, `remark: "pro Person"`
- Procedure has exactly 7 steps; noise block produces no steps

---

## Internationalisation (i18n)

### Library

`i18next` + `react-i18next` + `i18next-browser-languagedetector`

### Scope of translation

**UI controls only** — all recipe content (ingredient names, remarks, procedure steps, recipe names, group names) is stored and displayed in German as-is. Translation applies only to static UI strings: navigation labels, button text, section headers, placeholders, error messages, and settings labels.

This means:
- No multilingual fields in the recipe data model — `name`, `group`, `ingredients[].name`, `ingredients[].remark`, and `procedure[]` are always German strings
- `t()` is never called on recipe data — only on hard-coded UI chrome
- Unit abbreviations in the UI (e.g. `tbsp` → `EL`) **are** translated because they are display labels, not recipe content

### Language detection order

1. User preference stored in IndexedDB `prefs` store (explicit user choice)
2. Browser/OS language (`navigator.language`)
3. Fallback: `de` (German, since all recipe content is in German)

### Language switcher

Language is changed via the Settings view (segmented control). The choice is persisted to IndexedDB `prefs`.

### Translation file structure (`src/i18n/en.json` and `de.json`)

```json
{
  "nav": {
    "recipes": "Recipes",
    "back": "Back"
  },
  "login": {
    "title": "Sign In",
    "selectUser": "Select user",
    "tokenLabel": "Token",
    "signIn": "Sign In",
    "error": "Invalid token. Please try again."
  },
  "recipeList": {
    "searchPlaceholder": "Search recipes…",
    "noResults": "No recipes found"
  },
  "recipeDetail": {
    "ingredients": "Ingredients",
    "procedure": "Procedure",
    "portions": "Portions",
    "share": "Share shopping list",
    "shareCopied": "Copied to clipboard"
  },
  "newRecipe": {
    "title": "New Recipe",
    "pasteLabel": "Paste recipe text",
    "pastePlaceholder": "Paste any recipe text here — ingredients and steps will be extracted automatically…",
    "parseButton": "Extract Recipe",
    "parsing": "Extracting…",
    "parseError": "Could not extract a recipe from this text. Please check the input.",
    "name": "Recipe Name",
    "group": "Category",
    "portions": "Default Portions",
    "ingredients": "Ingredients",
    "procedure": "Steps",
    "addIngredient": "Add Ingredient",
    "addStep": "Add Step",
    "save": "Save Recipe",
    "remarkPlaceholder": "e.g. drained and rinsed"
  },
  "settings": {
    "title": "Settings",
    "appearance": "Appearance",
    "theme": "Theme",
    "themeSystem": "System",
    "themeLight": "Light",
    "themeDark": "Dark",
    "language": "Language",
    "display": "Display",
    "keepScreenOn": "Keep Screen On",
    "keepScreenOnUnsupported": "Not supported on this device",
    "account": "Account",
    "loggedInAs": "Logged in as",
    "signOut": "Sign Out"
  },
  "units": {
    "g": "g",
    "kg": "kg",
    "ml": "ml",
    "l": "l",
    "tbsp": "tbsp",
    "tsp": "tsp",
    "cup": "cup",
    "piece": "pc"
  }
}
```

German units worth noting: `tbsp` → `EL` (Esslöffel), `tsp` → `TL` (Teelöffel), `cup` → `Tasse`, `piece` → `Stk`.

### i18next setup (`src/i18n/index.ts`)

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './en.json';
import de from './de.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, de: { translation: de } },
    fallbackLng: 'de',
    supportedLngs: ['en', 'de'],
    interpolation: { escapeValue: false },
  });

export default i18n;
```

---

## Dark / Light Mode

### Approach

Tailwind CSS `dark:` variant with `darkMode: 'class'` in `tailwind.config.ts`. A `dark` class on `<html>` enables dark styles globally.

### Theme preference

Three options stored in IndexedDB `prefs.theme`: `'light'` | `'dark'` | `'system'` (default).

- `system`: follow `prefers-color-scheme` media query, update dynamically if OS theme changes
- `light` / `dark`: fixed override regardless of OS setting

### `useTheme` hook

```typescript
// src/hooks/useTheme.ts
// Reads prefs from IndexedDB, applies/removes 'dark' class on document.html,
// listens to prefers-color-scheme media query when theme === 'system'
```

### Theme toggle

Theme is changed via the segmented control in the Settings view. Persisted to IndexedDB `prefs`.

### Konsta UI dark mode

Pass `dark` prop to the root `<App>` component from Konsta UI:

```tsx
<KonstaApp theme="ios" dark={isDark}>
```

### Tailwind config

```typescript
import konstaConfig from 'konsta/config';
export default konstaConfig({
  darkMode: 'class',
  content: ['./src/**/*.{tsx,ts}'],
  konsta: { colors: { primary: '#007AFF' } }
});
```

---

## Screen Wake Lock

File: `src/hooks/useWakeLock.ts`

### Purpose

Prevents the device display from sleeping while the user is reading a recipe. Controlled by the "Keep Screen On" toggle in Settings and persisted in IndexedDB `prefs.wakeLock`.

### Browser support

- iOS Safari 16.4+: supported
- iOS installed PWA: had a bug until iOS 18.4 — warn users on older iOS
- Check availability with `'wakeLock' in navigator` before attempting to request

### `useWakeLock` hook API

```typescript
interface UseWakeLockReturn {
  isSupported: boolean;       // 'wakeLock' in navigator
  isActive: boolean;          // lock is currently held
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}
```

### Implementation pattern

```typescript
// src/hooks/useWakeLock.ts
import { useEffect, useRef, useState } from 'react';

export function useWakeLock(enabled: boolean): UseWakeLockReturn {
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const isSupported = 'wakeLock' in navigator;

  const acquire = async () => {
    if (!isSupported || lockRef.current) return;
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
      lockRef.current.addEventListener('release', () => {
        lockRef.current = null;
      });
    } catch {
      // device refused (low battery, user preference) — fail silently
    }
  };

  const release = async () => {
    await lockRef.current?.release();
    lockRef.current = null;
  };

  // Re-acquire when tab becomes visible again (iOS releases lock on backgrounding)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [enabled]);

  // Acquire / release when `enabled` changes
  useEffect(() => {
    if (enabled) acquire(); else release();
    return () => { release(); };
  }, [enabled]);

  return { isSupported, isActive: lockRef.current !== null, enable: acquire, disable: release };
}
```

### Key behaviours

- The lock is held **app-wide** (not just on the recipe detail screen) — the user controls it via Settings
- iOS (and most mobile browsers) automatically release the wake lock when the app is backgrounded; the `visibilitychange` listener re-acquires it when the user returns
- If the device refuses the request (low battery, power-saving mode), the app continues normally — never throw to the user
- The toggle in Settings is disabled and labelled "Not supported on this device" when `isSupported === false`

---

## PWA Configuration

### `public/manifest.json`

```json
{
  "name": "Recipes",
  "short_name": "Recipes",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#007AFF",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### iOS-specific meta tags in `index.html`

```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Recipes">
<link rel="apple-touch-icon" href="/icons/icon-180.png">
```

### Service Worker (via vite-plugin-pwa)

- Strategy: `NetworkFirst` for API calls, `CacheFirst` for static assets
- Pre-caches all built assets
- Background sync not required — sync happens on explicit recipe open

---

## Konsta UI Setup

```typescript
// vite.config.ts — include Konsta UI theme
// tailwind.config.ts:
import konstaConfig from 'konsta/config';
export default konstaConfig({
  content: ['./src/**/*.{tsx,ts}'],
  konsta: { colors: { primary: '#007AFF' } }
});
```

Use Konsta UI components: `Page`, `Navbar`, `List`, `ListItem`, `Block`, `Button`, `Searchbar`, `Sheet`.

---

## Testing Strategy

Run tests with: `npm test` (Vitest in watch mode) or `npm run test:run` (CI single-pass).

### Unit Tests to Implement

| File | What to test |
|---|---|
| `shareIngredients.test.ts` | Amount scaling, text formatting, omits unit when absent |
| `api.test.ts` | Correct headers sent, 401 handling, JSON parsing |
| `PortionControl.test.tsx` | Increment/decrement, min boundary (1), scaled amounts displayed correctly |
| `LoginScreen.test.tsx` | User selection toggle, button disabled state, error display on 401 |
| `RecipeList.test.tsx` | Grouping logic, search filter, empty state |
| `RecipeDetail.test.tsx` | Loads from cache, fetches when stale, portion scaling integration |
| `i18n.test.ts` | EN/DE translations resolve, unit keys translate correctly, language switch |
| `useTheme.test.ts` | `system` follows media query, `dark`/`light` override apply `dark` class |
| `useWakeLock.test.ts` | acquires lock when enabled, releases on disable, re-acquires on visibilitychange, handles unsupported gracefully |
| `SettingsView.test.tsx` | theme segmented control updates prefs, language switch changes i18n, wake lock toggle calls enable/disable, sign out navigates to login |
| `parseRecipe.test.ts` | Uses `bohnen-auflauf-raw.txt` fixture: noise lines absent, ingredient lines present, blank lines stripped |
| `NewRecipeView.test.tsx` | Parse button disabled when empty, spinner during call, form populated on success, error shown on failure |
| `IngredientEditor.test.tsx` | Amount/unit/name/remark inputs update correctly, delete removes row |
| `worker/auth.test.ts` | Valid token → 200, wrong token → 401, missing header → 401 |
| `worker/recipes.test.ts` | GET index returns R2 object, GET by id returns correct object, 404 for missing id |
| `worker/parse.test.ts` | Uses `bohnen-auflauf-raw.txt` fixture: 15 ingredients, 7 steps, weight note absent from remark, range resolved, compound line split, German units mapped |

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
```

---

## Build Steps (Iteration Order)

1. **Scaffold** — `npm create vite@latest . -- --template react-ts`, install deps
2. **Types** — define all TypeScript interfaces in `src/types/index.ts` (including `Unit` enum)
3. **Worker** — implement Hono Worker with auth + R2 routes, write worker tests
4. **IndexedDB** — implement `src/lib/db.ts` including `prefs` store
5. **API client** — implement `src/lib/api.ts`, write api tests
6. **i18n** — implement `src/i18n/index.ts` + `en.json` + `de.json`, write i18n tests
7. **Theme** — implement `useTheme` hook, write theme tests
8. **Wake Lock** — implement `useWakeLock` hook, write wake lock tests
9. **Auth** — implement `useAuth` hook + `LoginScreen`, write login tests
10. **Recipe list** — implement `useRecipes` hook + `RecipeList` (`+` / gear / logout in nav), write list tests
11. **Settings** — implement `SettingsView` (theme, language, wake lock, sign out), write settings tests
12. **Recipe detail** — implement `useRecipeDetail` hook + `RecipeDetail` + `PortionControl`, write detail/portion tests
13. **Share** — implement `shareIngredients.ts`, write share tests
14. **Smart import** — implement `parseRecipe.ts` (noise removal) + `worker/routes/parse.ts` (Anthropic call) + `NewRecipeView` + `IngredientEditor`, write all parse/import tests
14. **PWA** — add vite-plugin-pwa, manifest, iOS meta tags, icons
15. **Seed data** — write `migrations/seed.ts` to upload sample recipes to R2
16. **Deploy** — `wrangler deploy` for worker, `wrangler pages deploy dist` for frontend

After each step: run `npm run test:run` — fix any failures before moving to the next step.

---

## Setup Commands

```bash
# Install dependencies
npm create vite@latest . -- --template react-ts
npm install konsta tailwindcss postcss autoprefixer
npm install hono @cloudflare/workers-types
npm install idb
npm install i18next react-i18next i18next-browser-languagedetector
npm install @anthropic-ai/sdk
npm install -D vite-plugin-pwa workbox-window
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @types/node

# Tailwind
npx tailwindcss init -p

# Wrangler
npm install -g wrangler
wrangler login
# R2 bucket "pascals-recipes" already exists — no need to create it
# Create a separate preview bucket for local dev only:
wrangler r2 bucket create pascals-recipes-preview

# Set secrets
wrangler secret put TOKEN_CLAUDIA
wrangler secret put TOKEN_PASCAL
wrangler secret put ANTHROPIC_API_KEY
```

---

## Key Implementation Notes

- **R2 access**: R2 cannot be accessed directly from the browser — all reads/writes go through the Worker
- **CORS**: Worker must return `Access-Control-Allow-Origin: *` (or your Pages domain) for browser fetch to work
- **Token security**: Tokens are static secrets stored in Worker environment — never exposed in the frontend bundle
- **Portion scaling**: always compute `(amount / defaultPortions) * currentPortions`, never mutate stored data
- **iOS standalone mode**: use `window.matchMedia('(display-mode: standalone)')` to detect PWA mode and adjust layout (e.g. safe-area-inset padding)
- **Back navigation**: use React Router `useNavigate(-1)` for the back button in Recipe Detail; on iOS standalone this matches native feel
- **Group sorting**: sort groups alphabetically; within each group sort recipes alphabetically by name
- **Search**: filter is applied before grouping, so empty groups after filtering are hidden
- **Recipe content is always German**: never wrap recipe data (ingredient names, remarks, procedure steps, recipe names, groups) in `t()` — only UI chrome strings are translated
- **Unit display**: always translate unit keys via `t('units.g')` etc. — never render raw unit strings; omit unit column entirely when `ingredient.unit` is undefined
- **Dark mode flash**: apply theme class synchronously in a `<script>` tag in `index.html` (before React hydrates) to prevent a light flash on dark-mode startup
- **Language + theme persistence**: load from IndexedDB `prefs` in `App.tsx` before first render; show a neutral loading state until prefs resolve to avoid flicker
- **Wake lock scope**: hold the lock in a top-level context (e.g. `App.tsx`) driven by `prefs.wakeLock`; do not create per-screen locks — the Settings toggle is the single source of truth
- **Wake lock re-acquisition**: iOS releases the lock whenever the app is backgrounded; the `visibilitychange` handler in `useWakeLock` re-acquires it transparently on return without any user action
- **Smart import model**: use `claude-haiku-4-5-20251001` for the parse endpoint — fast and cheap for structured JSON extraction; the full recipe text is small enough to fit in a single request
- **Parse prompt output**: instruct Claude to return raw JSON only (no markdown fences); parse with `JSON.parse()` and validate the shape before returning to the client — return 422 if the response is not valid JSON or missing required fields
- **Noise removal is client-side**: `preprocessRecipeText()` runs in the browser before the API call, reducing token usage; the Worker receives already-cleaned text
- **Remark display**: render `remark` as a smaller, secondary-coloured line below the ingredient name in both `IngredientsList` and `IngredientEditor`; include it in shopping list export in parentheses
