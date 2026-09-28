import { describe, it, expect } from 'vitest';
import { newRecipePage } from '../views/new-recipe.ts';

describe('newRecipePage', () => {
  it('sets data-page="new" on body', () => {
    const html = newRecipePage('de');
    expect(html).toContain('data-page="new"');
  });

  it('shows the paste phase immediately on the new page', () => {
    const html = newRecipePage('de');
    expect(html).not.toMatch(/id="paste-phase"[^>]*class="hidden"/);
  });

  it('keeps the save button hidden until the form phase', () => {
    const html = newRecipePage('de');
    expect(html).toContain('id="save-btn" type="button" class="nav-btn nav-btn-icon nav-btn-prominent hidden"');
  });

  it('back button triggers dirty-check navigation instead of a plain link', () => {
    const html = newRecipePage('de');
    expect(html).toContain('onclick="handleBack()"');
    expect(html).not.toContain('<a href="/" class="nav-btn');
  });
});
