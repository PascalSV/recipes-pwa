import { test, expect } from '@playwright/test';
import { login } from './helpers.ts';

// Real extraction output from Private LLM for a 9-ingredient/9-step recipe —
// this exact payload previously exposed the UNITS/UNIT_LABELS var-ordering bug.
const KARDAMOMKUCHEN = {
  name: 'Kardamomkuchen',
  defaultPortions: 8,
  cookingTime: 25,
  ingredients: [
    { amount: 75, unit: 'g', name: 'Butter', remark: '' },
    { amount: 150, unit: 'ml', name: 'Streuzucker', remark: '' },
    { amount: 1, unit: 'piece', name: 'Ei', remark: '' },
    { amount: 2, unit: 'tbsp', name: 'Kardamomsamen', remark: '' },
    { amount: 200, unit: 'ml', name: 'Weizenmehl', remark: '' },
    { amount: 2, unit: 'tsp', name: 'Backpulver', remark: '' },
    { amount: 0.5, unit: 'krm', name: 'Salz', remark: '' }, // unit outside the schema on purpose
    { amount: 150, unit: 'ml', name: 'Filmjölk', remark: '' },
    { amount: 1, unit: 'EL', name: 'Hagelzucker', remark: 'zum Bestreuen' }, // ditto
  ],
  procedure: [
    'Den Backofen auf 175 °C vorheizen.',
    'Eine Springform mit ca. 24 cm Durchmesser (für 8 Stücke) einfetten und mit Paniermehl bestreuen oder ein Backpapier auf den Boden legen.',
    'Die Butter in einem Topf schmelzen lassen, etwas abkühlen lassen.',
    'Zucker und Ei schaumig rühren.',
    'Die Kardamomsamen zerstoßen und mit allen trockenen Zutaten vermischen.',
    'Die trockenen Zutaten, die Butter und die Filmjölk zur Eiermasse geben und zu einem klumpenfreien Teig verrühren.',
    'Den Teig in die Form gießen und mit dem Hagelzucker bestreuen.',
    'Den Kuchen in der Mitte des Ofens ca. 25 Minuten backen. Mit einem Stäbchen prüfen, ob der Kuchen durchgebacken ist.',
    'Herausnehmen und den Kuchen abkühlen lassen, bevor er aus der Form gelöst wird.',
  ],
};

// Real extraction output from Private LLM for the Avocado-Carbonara recipe. The model
// closed the top-level object prematurely (a stray "}" after "soeders"), then kept adding
// "procedure" — so the raw text is NOT valid JSON. It also invented a "soeders" field and
// emitted numeric units. This exact payload previously made JSON.parse throw and the whole
// import crash; it must now be repaired and imported best-effort (17 ingredients, 9 steps).
const MALFORMED_AVOCADO =
  '{\n' +
  '  "name": "Avocado-Carbonara",\n' +
  '  "defaultPortions": 2,\n' +
  '  "cookingTime": 30,\n' +
  '  "ingredients": [\n' +
  '    { "amount": 1, "unit": 1, "name": "Avocado" },\n' +
  '    { "amount": 1, "unit": 1 },\n' +
  '    { "amount": 0.5, "unit": "Tasse", "name": "Sahne", "remark": "120 ml" },\n' +
  '    { "amount": 1, "unit": "piece", "name": "Knoblauchzehe" },\n' +
  '    { "amount": 0.5, "unit": "piece", "name": "Zitrone", "remark": "Saft" },\n' +
  '    { "amount": 0.5, "unit": "Tasse", "name": "Parmesankäse", "remark": "55 g, gerieben" },\n' +
  '    { "amount": 3, "unit": "piece", "name": "Speck", "remark": "Streifen" },\n' +
  '    { "amount": 0.5, "unit": "lb", "name": "Spaghetti", "remark": "225 g" },\n' +
  '    { "amount": 1, "unit": "EL", "name": "Olivenöl" }\n' +
  '  ],\n' +
  '  "soeders": [\n' +
  '    { "amount": 1, "unit": 1, "name": "Salz" },\n' +
  '    { "amount": 1, "unit": 1, "name": "Pfeffer" },\n' +
  '    { "amount": 1, "unit": 1, "name": "Crème fraîche" },\n' +
  '    { "amount": 1, "unit": 1, "name": "Ei" },\n' +
  '    { "amount": 1, "unit": 1, "name": "Parmesankäse" },\n' +
  '    { "amount": 1, "unit": 1, "name": "Avocado" },\n' +
  '    { "amount": 1, "unit": 1, "name": "Sahne" },\n' +
  '    { "amount": 1, "unit": 1, "name": "Zitrone" }\n' +
  '  ]\n' +
  '  }\n' +
  '  ,\n' +
  '  "procedure": [\n' +
  '    "Avocado halbieren, entkernen und in Spalten schneiden.",\n' +
  '    "Knoblauch schälen und fein hacken.",\n' +
  '    "Speck in Streifen schneiden und in Olivenöl ausbraten.",\n' +
  '    "Knoblauch kurz mitbraten, Sahne und Eigelb zugeben und cremig rühren.",\n' +
  '    "Parmesankäse, Zitronensaft, Salz und Pfeffer unterrühren.",\n' +
  '    "Spaghetti in Salzwasser bissfest kochen.",\n' +
  '    "Nudeln abgießen, ein wenig Kochwasser aufheben.",\n' +
  '    "Nudeln, Avocado und Soße vermengen und mit Kochwasser binden.",\n' +
  '    "Anrichten und mit restlichem Parmesankäse bestreuen."\n' +
  '  ]\n' +
  '}';

// Real extraction output from Private LLM (a second Avocado-Carbonara run). This time the
// model double-closed three ingredient objects — each ends with "}}" instead of "}" (Sahne,
// Zitrone, Parmesankäse). That is 3 stray "}" (13 "}" vs 10 "{") so the raw text is NOT valid
// JSON, and it is a DIFFERENT malformation than MALFORMED_AVOCADO: the extra closers sit inside
// the ingredients array rather than a premature top-level close. It must be repaired (drop the
// 3 extra closers) and imported best-effort (9 ingredients, 9 steps).
const MALFORMED_AVOCADO_EXTRA_BRACES =
  '{"name":"Avocado-Carbonara","defaultPortions":2,"cookingTime":30,"ingredients":[{"amount":1,"unit":"piece","name":"Avocado","remark":""},{"amount":1,"unit":"piece","name":"Eigelb","remark":""},{"amount":0.5,"unit":"tbsp","name":"Sahne","remark":"(120 ml)"}},{"amount":1,"unit":"piece","name":"Knoblauchzehe","remark":""},{"amount":0.5,"unit":"cup","name":"Zitrone","remark":"Saft"}},{"amount":0.5,"unit":"cup","name":"Parmesankäse","remark":"(55 g), gerieben"}},{"amount":3,"unit":"piece","name":"Speck","remark":"Streifen"},{"amount":0.5,"unit":"lb","name":"Spaghetti","remark":"(225 g)"},{"amount":1,"unit":"tbsp","name":"Olivenöl","remark":""}],"procedure":["Avocado halbieren und den Kern entfernen.","Eigelb mit der Sahne verquirlen, bis die Masse cremig ist.","Knoblauch fein reiben und zusammen mit dem Zitronensaft unterrühren.","Speckstreifen in einer Pfanne knusprig auslassen.","Spaghetti in Salzwasser al dente kochen.","Parmesankäse unter die Sahne-Mischung rühren, bis sie geschmeidig ist.","Pasta mit der Soße und dem Avocado vermengen.","Mit Salz und Pfeffer abschmecken.","Sofort servieren, gerne mit etwas mehr Parmesankäse."]}';

function assertNoErrors(pageErrors: string[]) {
  expect(pageErrors, `Unexpected JS errors: ${pageErrors.join('\n')}`).toEqual([]);
}

test.describe('LLM import — clipboard hand-off (Private LLM Shortcut)', () => {
  test('fromClipboard shows only the dedicated clipboard screen, nothing else', async ({ page }) => {
    await login(page);
    await page.goto('/recipe/new?fromClipboard=1');

    await expect(page.locator('#clipboard-phase')).toBeVisible();
    await expect(page.locator('#paste-clipboard-btn')).toBeVisible();
    await expect(page.locator('#paste-phase')).toBeHidden();
    await expect(page.locator('#processing-phase')).toBeHidden();
    await expect(page.locator('#form-phase')).toBeHidden();
  });

  // Regression test: iOS aggressively reloads backgrounded Safari tabs (exactly what
  // happens switching Shortcuts -> Private LLM -> back to Safari). If the query string
  // gets stripped from the URL bar before the user finishes pasting, that reload lands
  // back on the plain paste screen with the clipboard hand-off silently lost.
  test('?fromClipboard=1 survives a reload before the paste button is tapped', async ({ page }) => {
    await login(page);
    await page.goto('/recipe/new?fromClipboard=1');
    await expect(page.locator('#clipboard-phase')).toBeVisible();

    await page.reload();

    await expect(page.locator('#clipboard-phase')).toBeVisible();
    await expect(page.locator('#paste-phase')).toBeHidden();
  });

  test('pasting valid JSON populates every field correctly', async ({ page, context, baseURL, browserName }) => {
    // 'clipboard-write' isn't a grantable permission in WebKit (mobile project) — only
    // Chromium needs/accepts it explicitly for programmatic clipboard writes to succeed.
    const clipPerms = browserName === 'webkit' ? ['clipboard-read'] : ['clipboard-read', 'clipboard-write'];
    await context.grantPermissions(clipPerms, { origin: baseURL });
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page);
    await page.goto('/recipe/new?fromClipboard=1');
    await page.bringToFront(); // clipboard writes need document focus, which parallel workers can steal
    await page.evaluate((json) => navigator.clipboard.writeText(json), JSON.stringify(KARDAMOMKUCHEN));
    await page.click('#paste-clipboard-btn');

    await expect(page.locator('#form-phase')).toBeVisible();
    await expect(page.locator('#clipboard-phase')).toBeHidden();
    await expect(page.locator('#parse-error')).toBeHidden();
    // Only cleaned up now, on success — not eagerly on load (see the reload regression test above).
    expect(new URL(page.url()).search).toBe('');

    await expect(page.locator('#recipe-name')).toHaveValue('Kardamomkuchen');
    await expect(page.locator('#recipe-time')).toHaveValue('25');
    await expect(page.locator('#recipe-portions')).toHaveValue('8');
    await expect(page.locator('.ing-editor-row')).toHaveCount(9);
    await expect(page.locator('#steps-list')).toHaveCount(1);
    const stepCount = await page.locator('#steps-list').evaluate((el) => el.children.length);
    expect(stepCount).toBe(9);

    // Spot-check an ingredient with an out-of-schema unit still renders (dropdown just won't preselect it)
    const lastIng = page.locator('.ing-editor-row').last();
    await expect(lastIng.locator('.ing-name')).toHaveValue('Hagelzucker (zum Bestreuen)');

    assertNoErrors(pageErrors);
  });

  test('malformed clipboard content shows the JSON error, not a crash', async ({ page, context, baseURL, browserName }) => {
    // 'clipboard-write' isn't a grantable permission in WebKit (mobile project) — only
    // Chromium needs/accepts it explicitly for programmatic clipboard writes to succeed.
    const clipPerms = browserName === 'webkit' ? ['clipboard-read'] : ['clipboard-read', 'clipboard-write'];
    await context.grantPermissions(clipPerms, { origin: baseURL });
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page);
    await page.goto('/recipe/new?fromClipboard=1');
    await page.bringToFront();
    await page.evaluate(() => navigator.clipboard.writeText('not valid json {'));
    await page.click('#paste-clipboard-btn');

    await expect(page.locator('#parse-error')).toBeVisible();
    await expect(page.locator('#form-phase')).toBeHidden();
    assertNoErrors(pageErrors);
  });

  // The Avocado-Carbonara payload is long enough that Shortcuts would hand it back via the
  // clipboard rather than the URL — so the premature-close repair must work on this path too.
  test('malformed clipboard JSON (premature top-level close) is repaired and imported', async ({ page, context, baseURL, browserName }) => {
    const clipPerms = browserName === 'webkit' ? ['clipboard-read'] : ['clipboard-read', 'clipboard-write'];
    await context.grantPermissions(clipPerms, { origin: baseURL });
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page);
    await page.goto('/recipe/new?fromClipboard=1');
    await page.bringToFront();
    await page.evaluate((json) => navigator.clipboard.writeText(json), MALFORMED_AVOCADO);
    await page.click('#paste-clipboard-btn');

    await expect(page.locator('#form-phase')).toBeVisible();
    await expect(page.locator('#parse-error')).toBeHidden();
    await expect(page.locator('#recipe-name')).toHaveValue('Avocado-Carbonara');
    await expect(page.locator('.ing-editor-row')).toHaveCount(17);
    assertNoErrors(pageErrors);
  });
});

test.describe('LLM import — URL hand-off (short recipes)', () => {
  test('llmResult in the URL populates the form directly, no button needed', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page);
    const url = '/recipe/new?llmResult=' + encodeURIComponent(JSON.stringify(KARDAMOMKUCHEN));
    await page.goto(url);

    await expect(page.locator('#form-phase')).toBeVisible();
    await expect(page.locator('#recipe-name')).toHaveValue('Kardamomkuchen');
    await expect(page.locator('.ing-editor-row')).toHaveCount(9);
    assertNoErrors(pageErrors);
  });

  test('malformed llmResult (premature top-level close) is repaired and imported', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page);
    await page.goto('/recipe/new?llmResult=' + encodeURIComponent(MALFORMED_AVOCADO));

    await expect(page.locator('#form-phase')).toBeVisible();
    await expect(page.locator('#parse-error')).toBeHidden();
    await expect(page.locator('#recipe-name')).toHaveValue('Avocado-Carbonara');
    await expect(page.locator('#recipe-time')).toHaveValue('30');
    await expect(page.locator('#recipe-portions')).toHaveValue('2');
    await expect(page.locator('.ing-editor-row')).toHaveCount(17);
    const stepCount = await page.locator('#steps-list').evaluate((el) => el.children.length);
    expect(stepCount).toBe(9);
    assertNoErrors(pageErrors);
  });

  // Regression: the model double-closes ingredient objects ("}}") inside the ingredients
  // array. The lenient parser must drop the extra closers and import the recipe, not fail.
  test('malformed llmResult (extra "}}" closers inside ingredients) is repaired and imported', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page);
    await page.goto('/recipe/new?llmResult=' + encodeURIComponent(MALFORMED_AVOCADO_EXTRA_BRACES));

    await expect(page.locator('#form-phase')).toBeVisible();
    await expect(page.locator('#parse-error')).toBeHidden();
    await expect(page.locator('#recipe-name')).toHaveValue('Avocado-Carbonara');
    await expect(page.locator('#recipe-time')).toHaveValue('30');
    await expect(page.locator('#recipe-portions')).toHaveValue('2');
    await expect(page.locator('.ing-editor-row')).toHaveCount(9);
    const stepCount = await page.locator('#steps-list').evaluate((el) => el.children.length);
    expect(stepCount).toBe(9);
    assertNoErrors(pageErrors);
  });

  test('llmResult wrapped in a markdown fence is unwrapped and imported', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page);
    const fenced = '```json\n' + JSON.stringify(KARDAMOMKUCHEN) + '\n```';
    await page.goto('/recipe/new?llmResult=' + encodeURIComponent(fenced));

    await expect(page.locator('#form-phase')).toBeVisible();
    await expect(page.locator('#parse-error')).toBeHidden();
    await expect(page.locator('#recipe-name')).toHaveValue('Kardamomkuchen');
    await expect(page.locator('.ing-editor-row')).toHaveCount(9);
    assertNoErrors(pageErrors);
  });

  test('valid JSON that is not a recipe shows the not-a-recipe error, not a crash', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await login(page);
    await page.goto('/recipe/new?llmResult=' + encodeURIComponent('{"foo": 1}'));

    await expect(page.locator('#parse-error')).toBeVisible();
    await expect(page.locator('#parse-error')).toContainText('kein erkennbares Rezept');
    await expect(page.locator('#form-phase')).toBeHidden();
    assertNoErrors(pageErrors);
  });
});

test.describe('LLM import — "Extrahieren" trigger', () => {
  test('shows the processing screen immediately and keeps it up indefinitely', async ({ page }) => {
    // No auto-revert-to-error on a timeout: Safari gives no reliable signal for whether a
    // custom URL scheme actually opened (worse on macOS), and Private LLM's inference time
    // varies a lot — a timeout guess previously showed a false "not found" error while the
    // Shortcut was still working. So the spinner must stay up until the user cancels or the
    // Shortcut redirects back on its own.
    await login(page);
    await page.goto('/recipe/new');
    await page.fill('#paste-input', 'Testrezept: 1 Ei, 200 ml Milch.');
    await page.click('#parse-btn');

    await expect(page.locator('#processing-phase')).toBeVisible();
    await expect(page.locator('#paste-phase')).toBeHidden();

    await page.waitForTimeout(3000); // well past the old 1.5s timeout
    await expect(page.locator('#processing-phase')).toBeVisible();
    await expect(page.locator('#paste-phase')).toBeHidden();
    await expect(page.locator('#parse-error')).toBeHidden();
  });

  test('cancel button on the processing screen returns to the paste screen', async ({ page }) => {
    await login(page);
    await page.goto('/recipe/new');
    await page.fill('#paste-input', 'Testrezept: 1 Ei, 200 ml Milch.');
    await page.click('#parse-btn');
    await expect(page.locator('#processing-phase')).toBeVisible();

    await page.click('#processing-phase button');

    await expect(page.locator('#paste-phase')).toBeVisible();
    await expect(page.locator('#processing-phase')).toBeHidden();
  });
});

test.describe('LLM import — static asset caching', () => {
  test('app.js, styles.css, manifest.json are never cached by the browser', async ({ request }) => {
    for (const path of ['/app.js', '/styles.css', '/manifest.json', '/sw.js']) {
      const res = await request.get(path);
      expect(res.headers()['cache-control'], `${path} cache-control`).toBe('no-store');
    }
  });
});
