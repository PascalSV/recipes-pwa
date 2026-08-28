import { pageLayout, esc, PLUS_ICON, CHEVRON, SETTINGS_ICON } from './layout.ts';
import type { RecipeMeta } from '../types.ts';
import { t, type Lang } from '../lib/i18n.ts';

export function listPage(recipes: RecipeMeta[], lang: Lang): string {
  const grouped = groupByCategory(recipes);

  const navRight = `
    <a href="/recipe/new" class="nav-btn" title="${esc(t('list.new', lang))}">${PLUS_ICON}</a>
    <a href="/settings" class="nav-btn" title="${esc(t('settings.title', lang))}">${SETTINGS_ICON}</a>
  `;

  const listContent = grouped.length === 0
    ? `<div class="empty"><p>${t('list.empty', lang)}</p></div>`
    : grouped.map(({ group, items }) => `
      <div data-group="${esc(group)}">
        <div class="group-title">${esc(group)}</div>
        <div class="recipe-list">
          ${items.map(r => `
            <a href="/recipe/${esc(r.id)}" class="list-item" data-recipe-name="${esc(r.name)}">
              <span class="list-item-text">${esc(r.name)}</span>
              <span class="list-chevron">${CHEVRON}</span>
            </a>`).join('')}
        </div>
      </div>`).join('');

  const content = `
    <div class="search-wrap">
      <input id="search" type="search" class="search-input" placeholder="${esc(t('list.search_ph', lang))}" autocomplete="off">
    </div>
    ${listContent}
  `;

  return pageLayout({
    title: t('list.title', lang),
    page: 'list',
    lang,
    navRight,
    content,
  });
}

function groupByCategory(recipes: RecipeMeta[]): { group: string; items: RecipeMeta[] }[] {
  const map = new Map<string, RecipeMeta[]>();
  for (const r of recipes) {
    const g = r.group || 'Sonstiges';
    if (!map.has(g)) map.set(g, []);
    map.get(g)!.push(r);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'de'))
    .map(([group, items]) => ({
      group,
      items: items.sort((a, b) => a.name.localeCompare(b.name, 'de')),
    }));
}
