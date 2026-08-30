import { pageLayout, esc, SHARE_ICON, BACK_ICON } from './layout.ts';
import type { Recipe, Ingredient } from '../types.ts';
import { t, type Lang } from '../lib/i18n.ts';

const EDIT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

const UNIT_DE: Record<string, string> = {
  g: 'g', kg: 'kg', ml: 'ml', l: 'l',
  tbsp: 'EL', tsp: 'TL', cup: 'Tasse', piece: 'Stk', pck: 'Päck.', prise: 'Prise', bunch: 'Bd.', can: 'Dose',
};

function fmt(n: number): string {
  const r = Math.round(n * 10) / 10;
  return String(r);
}

function formatCookingTime(minutes: number): string {
  if (minutes < 60) return `${minutes} Min.`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

const CLOCK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;flex-shrink:0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

function renderIngredientRow(ing: Ingredient): string {
  const unitLabel = ing.unit ? UNIT_DE[ing.unit] ?? ing.unit : '';
  if (ing.amount === 0) {
    return `<div class="ingredient-row">
      <div class="ing-qty"></div>
      <div class="ing-details">
        <span class="ing-free">${esc(ing.name)}${ing.remark ? ` <em style="font-style:italic;color:var(--text-3);font-size:13px">(${esc(ing.remark)})</em>` : ''}</span>
      </div>
    </div>`;
  }
  return `<div class="ingredient-row">
    <div class="ing-qty"><span class="ing-amount" data-amount="${ing.amount}">${esc(fmt(ing.amount))}</span><span class="ing-unit">${unitLabel ? '&thinsp;' + esc(unitLabel) : ''}</span></div>
    <div class="ing-details">
      <span class="ing-name">${esc(ing.name)}</span>
      ${ing.remark ? `<span class="ing-remark">${esc(ing.remark)}</span>` : ''}
    </div>
  </div>`;
}

export function detailPage(recipe: Recipe, lang: Lang): string {
  const navLeft  = `<a href="/" class="nav-btn nav-btn-icon" title="${esc(t('back', lang))}">${BACK_ICON}</a>`;
  const navRight = `
    <a href="/recipe/${esc(recipe.id)}/edit" class="nav-btn nav-btn-icon" title="${esc(t('edit.title', lang))}">${EDIT_ICON}</a>
    <button type="button" class="nav-btn nav-btn-icon" onclick="shareRecipe()" title="${esc(t('share', lang))}">${SHARE_ICON}</button>`;

  let ingredients: string;
  if (recipe.ingredientSections && recipe.ingredientSections.length > 0) {
    ingredients = recipe.ingredientSections.map(section =>
      (section.name ? `<div class="ing-sub-label">${esc(section.name)}</div>` : '') +
      section.ingredients.map(renderIngredientRow).join('')
    ).join('');
  } else {
    ingredients = recipe.ingredients.map(renderIngredientRow).join('');
  }

  const procedure = recipe.procedure.map((step, i) => `
    <div class="step">
      <span class="step-num">${String(i + 1).padStart(2, '0')}</span>
      <span class="step-text">${esc(step)}</span>
    </div>`).join('');

  const portionWord = recipe.defaultPortions === 1 ? t('detail.portion', lang) : t('detail.portions', lang);

  const content = `
    <h1 class="print-title">${esc(recipe.name)}</h1>
    <div class="portion-bar">
      <button type="button" class="portion-btn" onclick="changePortions(-1)">−</button>
      <span class="portion-label" id="portions-count">${recipe.defaultPortions} ${esc(portionWord)}</span>
      <button type="button" class="portion-btn" onclick="changePortions(1)">+</button>
      ${recipe.cookingTime ? `<span class="portion-sep"></span><span style="display:flex;align-items:center;gap:5px;font-size:14px;color:var(--text-2)">${CLOCK_ICON}${esc(formatCookingTime(recipe.cookingTime))}</span>` : ''}
    </div>

    <div class="recipe-section">
      <div class="recipe-section-label">${t('detail.ingredients', lang)}</div>
      <div class="recipe-content">${ingredients}</div>
    </div>

    <div class="recipe-section">
      <div class="recipe-section-label">${t('detail.preparation', lang)}</div>
      <div class="recipe-content">${procedure}</div>
    </div>
  `;

  return pageLayout({
    title: recipe.name,
    page: 'detail',
    lang,
    bodyAttrs: `data-portions="${recipe.defaultPortions}" data-default-portions="${recipe.defaultPortions}"`,
    navLeft,
    navRight,
    content,
  });
}
