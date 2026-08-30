import { describe, it, expect } from 'vitest';
import { editRecipePage } from '../views/new-recipe.ts';
import type { Recipe } from '../types.ts';

const RECIPE: Recipe = {
  id: 'abc-123',
  name: 'Palocleves (Ungarischer Eintopf)',
  group: 'Suppe',
  defaultPortions: 4,
  cookingTime: 120,
  ingredients: [
    { amount: 500, unit: 'g', name: 'Kartoffeln', remark: 'festkochend' },
    { amount: 2, name: 'Zwiebeln' },
    { amount: 0, name: 'Salz' },
  ],
  procedure: [
    'Kartoffeln schälen und würfeln.',
    'Zwiebeln glasig anschwitzen.',
  ],
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-01T00:00:00Z',
};

describe('editRecipePage', () => {
  it('sets data-page="edit" on body', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain('data-page="edit"');
  });

  it('sets data-recipe-id on body', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain(`data-recipe-id="${RECIPE.id}"`);
  });

  it('embeds recipe JSON in inline script', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain('window.__recipe__');
    expect(html).toContain(RECIPE.id);
    expect(html).toContain('Palocleves');
  });

  it('escapes </script> in embedded JSON', () => {
    const dangerous: Recipe = {
      ...RECIPE,
      procedure: ['Close tag </script> exploit'],
    };
    const html = editRecipePage(dangerous, 'de');
    // The raw </script> must not appear inside the embedded <script> block
    // (it should be escaped as <\/)
    const scriptBlock = html.match(/<script>window\.__recipe__.*?<\/script>/s)?.[0] ?? '';
    expect(scriptBlock).not.toContain('</script>exploit');
  });

  it('pre-fills recipe name in the input', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain(`value="${RECIPE.name}"`);
  });

  it('pre-fills defaultPortions', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain(`value="${RECIPE.defaultPortions}"`);
  });

  it('pre-fills cookingTime', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain(`value="${RECIPE.cookingTime}"`);
  });

  it('pre-selects the correct group', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain(`value="Suppe" selected`);
  });

  it('hides paste phase in edit mode', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain('id="paste-phase" class="hidden"');
  });

  it('shows form phase immediately in edit mode', () => {
    const html = editRecipePage(RECIPE, 'de');
    // form-phase should NOT have class="hidden"
    expect(html).not.toMatch(/id="form-phase"[^>]*class="hidden"/);
  });

  it('uses "Rezept bearbeiten" title in German', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain('Rezept bearbeiten');
  });

  it('uses "Edit Recipe" title in English', () => {
    const html = editRecipePage(RECIPE, 'en');
    expect(html).toContain('Edit Recipe');
  });

  it('back button triggers dirty-check navigation instead of a plain link', () => {
    const html = editRecipePage(RECIPE, 'de');
    expect(html).toContain('onclick="handleBack()"');
  });
});
