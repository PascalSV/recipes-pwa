import { pageLayout, esc } from './layout.ts';
import { t, type Lang } from '../lib/i18n.ts';
import type { Recipe } from '../types.ts';

const BACK = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;
const TRASH_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

const GROUPS = [
  'Fleisch', 'Fisch', 'Pasta', 'Suppe', 'Salat',
  'Beilage', 'Vorspeise', 'Dessert', 'Backen', 'Sonstiges',
];

export function newRecipePage(lang: Lang): string {
  return recipePage({ lang });
}

export function editRecipePage(recipe: Recipe, lang: Lang): string {
  return recipePage({ lang, recipe });
}

function recipePage({ lang, recipe }: { lang: Lang; recipe?: Recipe }): string {
  const isEdit = !!recipe;
  const title = isEdit ? t('edit.title', lang) : t('new.title', lang);
  const page  = isEdit ? 'edit' : 'new';

  const navLeft   = isEdit
    ? `<a href="/recipe/${recipe!.id}" class="nav-btn">${BACK} ${t('back', lang)}</a> <button type="button" class="nav-btn" onclick="handleCancel()">${t('cancel', lang)}</button>`
    : `<a href="/" class="nav-btn">${BACK} ${t('back', lang)}</a>`;
  const navRight  = isEdit
    ? `<button type="button" class="nav-btn nav-btn-danger" onclick="handleDeleteRecipe()">${TRASH_ICON}</button>`
    : '';
  const groupOptions = GROUPS.map(g =>
    `<option value="${esc(g)}"${isEdit && recipe!.group === g ? ' selected' : ''}>${esc(g)}</option>`
  ).join('');

  // Embed existing recipe JSON for fast pre-fill (fallback: initEdit also fetches via API)
  const recipeScript = isEdit
    ? `<script>try{window.__recipe__=${JSON.stringify(recipe).replace(/<\//g, '<\\/')};}catch(e){}<\/script>`
    : '';

  const content = `
    ${recipeScript}

    <!-- Phase 0: waiting for Private LLM (shown after tapping "Extrahieren") -->
    <div id="processing-phase" class="hidden" style="text-align:center;padding:80px 20px">
      <span class="spinner spinner-green" style="width:40px;height:40px;border-width:4px"></span>
      <p style="margin-top:20px;color:var(--text-2)">${t('new.processing', lang)}</p>
    </div>

    <!-- Phase 1: paste area (new only) -->
    <div id="paste-phase"${isEdit ? ' class="hidden"' : ''}>
      <div class="form-section">
        <button id="paste-clipboard-btn" type="button" class="btn btn-primary btn-block mt-16 mb-16 hidden"
          onclick="handlePasteFromClipboard()">
          ${t('new.paste_clipboard', lang)}
        </button>
        <button id="skip-parse-btn" type="button" class="btn btn-primary btn-block mt-16 mb-16"
          onclick="handleSkipParse()">
          ${t('new.skip_parse', lang)}
        </button>
        <div id="paste-normal-fields" class="field">
          <label class="field-label" for="paste-input">${t('new.paste_label', lang)}</label>
          <textarea id="paste-input" class="textarea" rows="10"
            placeholder="${esc(t('new.paste_ph', lang))}"
            style="min-height:180px"></textarea>
        </div>
        <div id="parse-error" class="alert alert-error hidden" style="margin-top:12px">
          ${t('new.parse_error', lang)}
        </div>
        <button id="parse-btn" type="button" class="btn btn-primary btn-block mt-16"
          disabled onclick="handleParse()">
          ${t('new.extract', lang)}
        </button>
      </div>
    </div>

    <!-- Phase 2: editable form -->
    <div id="form-phase"${isEdit ? '' : ' class="hidden"'}>
      <div class="form-section">
        <div class="field">
          <label class="field-label" for="recipe-name">${t('new.name', lang)}</label>
          <input id="recipe-name" type="text" class="input" placeholder="${esc(t('new.name', lang))}"${isEdit ? ` value="${esc(recipe!.name)}"` : ''}>
        </div>
      </div>

      <div class="form-section">
        <div style="display:grid;grid-template-columns:1fr;gap:12px;@media (min-width: 640px) { grid-template-columns: 1fr 1fr 1fr; }">
          <div class="field">
            <label class="field-label" for="recipe-group">${t('new.category', lang)}</label>
            <select id="recipe-group" class="select">${groupOptions}</select>
          </div>
          <div class="field">
            <label class="field-label" for="recipe-portions">${t('new.portions', lang)}</label>
            <input id="recipe-portions" type="number" class="input" value="${isEdit ? recipe!.defaultPortions : 4}" min="1" max="20">
          </div>
          <div class="field">
            <label class="field-label" for="recipe-time">${t('new.time', lang)}</label>
            <input id="recipe-time" type="number" class="input" placeholder="–" min="1" max="1440"${isEdit && recipe!.cookingTime ? ` value="${recipe!.cookingTime}"` : ''}>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="field-label" style="padding-bottom:8px">${t('new.ingredients', lang)}</div>
        <div class="form-card">
          <div class="form-card-padded">
            <div id="ing-sections"></div>
            <button type="button" class="btn btn-secondary btn-block btn-sm mt-8" onclick="addSection()">
              + ${lang === 'en' ? 'Add section' : 'Abschnitt hinzufügen'}
            </button>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="field-label" style="padding-bottom:8px">${t('new.preparation', lang)}</div>
        <div class="form-card">
          <div class="form-card-padded">
            <div id="steps-list"></div>
            <button type="button" class="btn btn-secondary btn-block btn-sm mt-8" onclick="addStep()">
              ${t('new.add_step', lang)}
            </button>
          </div>
        </div>
      </div>

      <div class="form-section" style="padding-bottom:40px">
        <button id="save-btn" type="button" class="btn btn-primary btn-block mt-16" onclick="handleSave()">
          ${t('new.save', lang)}
        </button>
      </div>
    </div>
  `;

  return pageLayout({
    title, page, lang, navLeft, navRight, content,
    bodyAttrs: isEdit ? `data-recipe-id="${esc(recipe!.id)}"` : undefined,
  });
}
