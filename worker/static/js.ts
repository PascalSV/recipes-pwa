export const JS = `
(function () {
'use strict';

// ---- Language ----
var _lang = document.body.dataset.lang || 'de';
var _T = {
  de: { amount:'Menge', ingredient:'Zutat', describe_step:'Schritt beschreiben…', offline:'Offline gespeichert – wird synchronisiert', copied:'In Zwischenablage kopiert', share_fail:'Teilen fehlgeschlagen', portions:'Portionen', portion:'Portion', save:'Speichern', extract:'Extrahieren', add_ingredient:'Zutat hinzufügen' },
  en: { amount:'Amount', ingredient:'Ingredient', describe_step:'Describe step…', offline:'Saved offline – will sync', copied:'Copied to clipboard', share_fail:'Sharing failed', portions:'Portions', portion:'Portion', save:'Save', extract:'Extract', add_ingredient:'Add ingredient' }
};
function jst(key) { return (_T[_lang] || _T.de)[key] || key; }

window.setLang = function(l) {
  document.cookie = 'lang=' + l + '; path=/; max-age=31536000; SameSite=Lax';
  location.reload();
};

// ---- Theme (also inlined in <head> for flash prevention) ----
function applyTheme(t) {
  const html = document.documentElement;
  const dark = t === 'dark' || (t === 'system' && matchMedia('(prefers-color-scheme:dark)').matches);
  html.classList.toggle('dark', dark);
  html.classList.toggle('light', t === 'light');
}

// ---- API helper ----
async function api(path, opts) {
  opts = opts || {};
  const token = localStorage.getItem('token');
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    token ? { 'Authorization': 'Bearer ' + token } : {},
    opts.headers || {}
  );
  let res;
  try {
    res = await fetch(path, Object.assign({}, opts, { headers }));
  } catch {
    return null; // offline
  }
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    location.href = '/login';
    return null;
  }
  return res;
}

window.logout = async function () {
  await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  location.href = '/login';
};

function fmt(n) {
  const r = Math.round(n * 10) / 10;
  return r % 1 === 0 ? String(r) : String(r);
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

function showDialog(opts) {
  var overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  var sheet = document.createElement('div');
  sheet.className = 'dialog-sheet';
  function close() { overlay.remove(); sheet.remove(); }
  overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
  if (opts.title) { var ti = document.createElement('div'); ti.className = 'dialog-title'; ti.textContent = opts.title; sheet.appendChild(ti); }
  if (opts.message) { var mi = document.createElement('div'); mi.className = 'dialog-msg'; mi.textContent = opts.message; sheet.appendChild(mi); }
  var ok = document.createElement('button');
  ok.className = 'dialog-action ' + (opts.isDanger ? 'dialog-action-danger' : 'btn btn-primary');
  ok.textContent = opts.confirmText || 'OK';
  ok.onclick = function() { close(); opts.onConfirm(); };
  var cancel = document.createElement('button');
  cancel.className = 'dialog-action dialog-action-cancel';
  cancel.textContent = opts.cancelText || 'Abbrechen';
  cancel.onclick = close;
  sheet.appendChild(ok);
  sheet.appendChild(cancel);
  document.body.appendChild(overlay);
  document.body.appendChild(sheet);
}

// ---- Token restoration ----
// If localStorage.token is missing on a protected page, restore it from the
// session cookie via /api/auth/me so that API calls include a Bearer token.
if (document.body.dataset.page !== 'login' && !localStorage.getItem('token')) {
  fetch('/api/auth/me').then(function(r) { return r.ok ? r.json() : null; }).then(function(d) {
    if (d && d.token) { localStorage.setItem('token', d.token); localStorage.setItem('user', d.user || ''); }
  }).catch(function(){});
}

// ---- Page router ----
const page = document.body.dataset.page;
if (page === 'list')     initList();
if (page === 'detail')   initDetail();
if (page === 'new')      initNew();
if (page === 'edit')     initEdit();
if (page === 'settings') initSettings();
if (page === 'login')    initLogin();


// ---- List ----
function initList() {
  var CHEVRON_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
  var EMPTY_TEXT = _lang === 'en' ? 'No recipes yet.' : 'Noch keine Rezepte vorhanden.';

  async function refreshList() {
    var res = await api('/api/recipes');
    if (!res || !res.ok) return;
    var index = await res.json();
    var recipes = index.recipes || [];

    var pageEl = document.querySelector('.page');
    if (!pageEl) return;

    Array.from(pageEl.querySelectorAll('[data-group], .empty')).forEach(function (el) { el.remove(); });

    if (recipes.length === 0) {
      var empty = document.createElement('div');
      empty.className = 'empty';
      empty.innerHTML = '<p>' + EMPTY_TEXT + '</p>';
      pageEl.appendChild(empty);
      return;
    }

    var grouped = {};
    recipes.forEach(function (r) {
      var g = r.group || 'Sonstiges';
      if (!grouped[g]) grouped[g] = [];
      grouped[g].push(r);
    });
    Object.keys(grouped).sort(function (a, b) { return a.localeCompare(b, 'de'); })
      .forEach(function (group) {
        var items = grouped[group].slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'de'); });
        var div = document.createElement('div');
        div.dataset.group = group;
        div.innerHTML =
          '<div class="group-title">' + esc(group) + '</div>' +
          '<div class="recipe-list">' +
          items.map(function (r) {
            return '<a href="/recipe/' + esc(r.id) + '" class="list-item" data-recipe-name="' + esc(r.name) + '">' +
              '<span class="list-item-text">' + esc(r.name) + '</span>' +
              '<span class="list-chevron">' + CHEVRON_SVG + '</span>' +
              '</a>';
          }).join('') +
          '</div>';
        pageEl.appendChild(div);
      });
  }

  window.addEventListener('pageshow', function () { refreshList(); });

  var search = document.getElementById('search');
  if (!search) return;
  search.addEventListener('input', function () {
    var q = this.value.toLowerCase().trim();
    document.querySelectorAll('[data-recipe-name]').forEach(function (item) {
      item.style.display = !q || item.dataset.recipeName.toLowerCase().includes(q) ? '' : 'none';
    });
    document.querySelectorAll('[data-group]').forEach(function (group) {
      var any = Array.from(group.querySelectorAll('[data-recipe-name]')).some(function (i) {
        return i.style.display !== 'none';
      });
      group.style.display = any ? '' : 'none';
    });
  });
}

// ---- Detail ----
function initDetail() {
  // Keep the screen on while the user is following a recipe
  acquireWakeLock();
  // Release when navigating away (pagehide is more reliable than beforeunload on mobile)
  window.addEventListener('pagehide', releaseWakeLock);

  const body = document.body;
  let portions = parseInt(body.dataset.portions || '4', 10);
  const defPortions = parseInt(body.dataset.defaultPortions || '4', 10);

  window.changePortions = function (delta) {
    portions = Math.max(1, portions + delta);
    const lbl = document.getElementById('portions-count');
    if (lbl) lbl.textContent = portions + ' ' + (portions === 1 ? jst('portion') : jst('portions'));
    document.querySelectorAll('[data-amount]').forEach(function (el) {
      el.textContent = fmt((parseFloat(el.dataset.amount) / defPortions) * portions);
    });
  };

  window.shareRecipe = function () {
    if (navigator.share) {
      navigator.share({ title: document.title, url: window.location.href }).catch(function () {});
    } else {
      window.print();
    }
  };
}

// ---- New Recipe ----
var parsedData = null;

function initNew() {
  var textarea = document.getElementById('paste-input');
  var parseBtn = document.getElementById('parse-btn');
  if (!textarea || !parseBtn) return;

  textarea.addEventListener('input', function () {
    parseBtn.disabled = !this.value.trim();
  });

  window.handleParse = async function () {
    var text = textarea.value.trim();
    if (!text) return;
    parseBtn.disabled = true;
    parseBtn.innerHTML = '<span class="spinner"></span>';
    var errEl = document.getElementById('parse-error');
    if (errEl) errEl.classList.add('hidden');

    var res = await api('/api/recipes/parse', {
      method: 'POST',
      body: JSON.stringify({ text: text })
    });

    if (!res || !res.ok) {
      parseBtn.disabled = false;
      parseBtn.textContent = jst('extract') || 'Extrahieren';
      if (errEl) errEl.classList.remove('hidden');
      return;
    }

    parsedData = await res.json();
    var paste = document.getElementById('paste-phase');
    var form  = document.getElementById('form-phase');
    if (paste) paste.classList.add('hidden');
    if (form)  form.classList.remove('hidden');
    populateForm(parsedData);
  };

  window.handleSave = async function () {
    var name = (document.getElementById('recipe-name') || {}).value || '';
    name = name.trim();
    if (!name) {
      var n = document.getElementById('recipe-name');
      if (n) n.focus();
      return;
    }
    var saveBtn = document.getElementById('save-btn');
    if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spinner"></span> Speichern'; }

    var id = crypto.randomUUID();
    var now = new Date().toISOString();
    var cookingTimeVal = parseInt((document.getElementById('recipe-time') || {}).value || '0', 10);
    var recipe = {
      id: id,
      name: name,
      group: (document.getElementById('recipe-group') || {}).value || 'Sonstiges',
      defaultPortions: parseInt((document.getElementById('recipe-portions') || {}).value || '4', 10),
      ingredientSections: collectIngredientSections(),
      ingredients: collectIngredients(),
      procedure: collectProcedure(),
      createdAt: now,
      updatedAt: now
    };
    if (cookingTimeVal > 0) recipe.cookingTime = cookingTimeVal;

    var res = await api('/api/recipes/' + id, {
      method: 'PUT',
      body: JSON.stringify(recipe)
    });

    if (res && res.ok) {
      location.href = '/recipe/' + id;
    } else if (!res) {
      // Network error — queue for later sync
      var queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
      queue.push({ id: id, recipe: recipe });
      localStorage.setItem('offlineQueue', JSON.stringify(queue));
      toast(jst('offline'));
      setTimeout(function () { location.href = '/'; }, 1500);
    } else {
      // Server error — show status and re-enable button
      if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = jst('save'); }
      toast('Error ' + res.status + ' – ' + (res.statusText || 'save failed'));
    }
  };

  window.addSection = function () {
    var container = document.getElementById('ing-sections');
    if (!container) return;
    container.appendChild(createSection({ name: '', ingredients: [] }));
    updateSectionDeleteBtns();
  };

  // Initialize one default section if the container is empty
  var _sectionsEl = document.getElementById('ing-sections');
  if (_sectionsEl && _sectionsEl.children.length === 0) {
    _sectionsEl.appendChild(createSection({ name: '', ingredients: [] }));
    updateSectionDeleteBtns();
  }

  window.addStep = function () {
    var list = document.getElementById('steps-list');
    if (!list) return;
    var idx = list.querySelectorAll('.step-swipe-wrap').length;
    list.appendChild(createStepRow('', idx));
  };

  window.renumberSteps = function () {
    document.querySelectorAll('#steps-list .step-num').forEach(function (el, i) {
      el.textContent = String(i + 1).padStart(2, '0');
    });
  };
}

// ---- Edit Recipe ----
function initEdit() {
  var recipeId = document.body.dataset.recipeId;
  if (!recipeId) return;
  initNew();

  window.handleCancel = function() {
    showDialog({
      title: 'Änderungen verwerfen?',
      message: 'Alle nicht gespeicherten Änderungen gehen verloren.',
      confirmText: 'Verwerfen',
      isDanger: true,
      onConfirm: function() { location.href = '/recipe/' + recipeId; }
    });
  };

  window.handleDeleteRecipe = function() {
    showDialog({
      title: 'Rezept löschen?',
      message: 'Diese Aktion kann nicht rückgängig gemacht werden.',
      confirmText: 'Löschen',
      isDanger: true,
      onConfirm: async function() {
        var res = await api('/api/recipes/' + recipeId, { method: 'DELETE' });
        if (res && res.ok) {
          location.href = '/';
        } else {
          toast('Fehler beim Löschen');
        }
      }
    });
  };

  // Fetch recipe from API — source of truth, guarantees ingredients/steps are current
  api('/api/recipes/' + recipeId).then(function(res) {
    if (!res || !res.ok) return null;
    return res.json();
  }).then(function(data) {
    if (!data) return;
    var _recipe = data;
    // Populate all fields from server data
    populateForm(_recipe);
    // Also sync the SSR-rendered fields (name, group, portions, time) in case they differ
    var nameEl = document.getElementById('recipe-name');
    if (nameEl) nameEl.value = _recipe.name || '';
    var groupEl = document.getElementById('recipe-group');
    if (groupEl && _recipe.group) groupEl.value = _recipe.group;
    var portionsEl = document.getElementById('recipe-portions');
    if (portionsEl) portionsEl.value = _recipe.defaultPortions || 4;
    var timeEl = document.getElementById('recipe-time');
    if (timeEl) timeEl.value = _recipe.cookingTime || '';

    // Override handleSave to keep original ID and createdAt
    window.handleSave = function handleEditSave() {
      var name = (document.getElementById('recipe-name') || {}).value || '';
      name = name.trim();
      if (!name) { var n = document.getElementById('recipe-name'); if (n) n.focus(); return; }
      var saveBtn = document.getElementById('save-btn');
      if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<span class="spinner"></span> ' + jst('save'); }
      var now = new Date().toISOString();
      var cookingTimeVal = parseInt((document.getElementById('recipe-time') || {}).value || '0', 10);
      var updated = {
        id: _recipe.id,
        name: name,
        group: (document.getElementById('recipe-group') || {}).value || 'Sonstiges',
        defaultPortions: parseInt((document.getElementById('recipe-portions') || {}).value || '4', 10),
        ingredientSections: collectIngredientSections(),
        ingredients: collectIngredients(),
        procedure: collectProcedure(),
        createdAt: _recipe.createdAt,
        updatedAt: now
      };
      if (cookingTimeVal > 0) updated.cookingTime = cookingTimeVal;
      api('/api/recipes/' + _recipe.id, { method: 'PUT', body: JSON.stringify(updated) }).then(function(res) {
        if (res && res.ok) {
          location.href = '/recipe/' + _recipe.id;
        } else if (!res) {
          var queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
          var found = false;
          for (var qi = 0; qi < queue.length; qi++) { if (queue[qi].id === _recipe.id) { queue[qi].recipe = updated; found = true; break; } }
          if (!found) queue.push({ id: _recipe.id, recipe: updated });
          localStorage.setItem('offlineQueue', JSON.stringify(queue));
          toast(jst('offline'));
          setTimeout(function () { location.href = '/recipe/' + _recipe.id; }, 1500);
        } else {
          if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = jst('save'); }
          toast('Error ' + res.status);
        }
      });
    };
  }).catch(function() {});
}

function populateForm(recipe) {
  var nameEl = document.getElementById('recipe-name');
  if (nameEl && recipe.name) nameEl.value = recipe.name;
  var timeEl = document.getElementById('recipe-time');
  if (timeEl && recipe.cookingTime) timeEl.value = recipe.cookingTime;
  var portionsEl = document.getElementById('recipe-portions');
  if (portionsEl && recipe.defaultPortions) portionsEl.value = recipe.defaultPortions;
  var sectionsEl = document.getElementById('ing-sections');
  if (sectionsEl) {
    sectionsEl.innerHTML = '';
    if (recipe.ingredientSections && recipe.ingredientSections.length > 0) {
      recipe.ingredientSections.forEach(function(s) { sectionsEl.appendChild(createSection(s)); });
    } else {
      sectionsEl.appendChild(createSection({ name: '', ingredients: recipe.ingredients || [] }));
    }
    updateSectionDeleteBtns();
  }
  var steps = document.getElementById('steps-list');
  if (steps) {
    steps.innerHTML = '';
    (recipe.procedure || []).forEach(function(step, i) {
      steps.appendChild(createStepRow(step, i));
    });
  }
}

var UNITS = ['', 'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'piece', 'pck', 'prise'];
var UNIT_LABELS = { '': '—', g: 'g', kg: 'kg', ml: 'ml', l: 'l', tbsp: 'EL', tsp: 'TL', cup: 'Tasse', piece: 'Stk', pck: 'Päck.', prise: 'Prise' };

// ---- Swipe-to-delete for ingredient rows ----
var _openSwipe = null;

function closeAllSwipes(except) {
  if (_openSwipe && _openSwipe !== except) {
    var r = _openSwipe.querySelector('.ing-editor-row, .step-row');
    if (r) { r.style.transition = 'transform .25s ease'; r.style.transform = ''; }
    _openSwipe._swOpen = false;
    _openSwipe = null;
  }
}

document.addEventListener('touchstart', function(e) {
  if (_openSwipe && !_openSwipe.contains(e.target)) closeAllSwipes(null);
}, { passive: true });

function createIngRow(ing) {
  var div = document.createElement('div');
  div.className = 'ing-editor-row';
  // Store the original parsed data as attributes — collectIngredients reads these as
  // the authoritative source so DOM parsing quirks can never drop an ingredient.
  div.dataset.ingName   = ing.name   || '';
  div.dataset.ingAmount = String(ing.amount || 0);
  div.dataset.ingUnit   = ing.unit   || '';
  div.dataset.ingRemark = ing.remark || '';
  var opts = UNITS.map(function (u) {
    return '<option value="' + u + '"' + (ing.unit === u ? ' selected' : '') + '>' + UNIT_LABELS[u] + '</option>';
  }).join('');
  // Merge remark into name field as "(remark)" for inline display
  var nameVal = (ing.name || '') + (ing.remark ? ' (' + ing.remark + ')' : '');
  // amount=0 means free-form ingredient with no quantity — leave input empty
  var amountVal = ing.amount > 0 ? esc(ing.amount) : '';
  div.innerHTML =
    '<input type="number" class="input ing-amount" placeholder="' + jst('amount') + '" min="0" step="any" value="' + amountVal + '">' +
    '<select class="select ing-unit">' + opts + '</select>' +
    '<input type="text" class="input ing-name" placeholder="' + jst('ingredient') + '" value="' + esc(nameVal) + '">';

  var wrap = document.createElement('div');
  wrap.className = 'ing-swipe-wrap';

  var delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'ing-swipe-delete';
  delBtn.textContent = 'Löschen';
  delBtn.addEventListener('click', function() { wrap.remove(); });

  wrap.appendChild(div);
  wrap.appendChild(delBtn);

  var DEL_W = 80;
  var swStartX, swStartY, swTracking, swBase;

  div.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1) return;
    swStartX = e.touches[0].clientX;
    swStartY = e.touches[0].clientY;
    swTracking = null;
    swBase = wrap._swOpen ? -DEL_W : 0;
    div.style.transition = 'none';
  }, { passive: true });

  div.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 1) return;
    var dx = e.touches[0].clientX - swStartX;
    var dy = e.touches[0].clientY - swStartY;
    if (!swTracking) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      swTracking = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    }
    if (swTracking !== 'h') return;
    e.preventDefault();
    var offset = Math.max(-DEL_W, Math.min(0, swBase + dx));
    div.style.transform = 'translateX(' + offset + 'px)';
  }, { passive: false });

  div.addEventListener('touchend', function(e) {
    if (swTracking !== 'h') return;
    var dx = e.changedTouches[0].clientX - swStartX;
    div.style.transition = 'transform .25s ease';
    var open = wrap._swOpen ? dx < DEL_W / 2 : -dx >= DEL_W / 2;
    if (open) {
      closeAllSwipes(wrap);
      div.style.transform = 'translateX(-' + DEL_W + 'px)';
      wrap._swOpen = true;
      _openSwipe = wrap;
    } else {
      div.style.transform = '';
      wrap._swOpen = false;
      if (_openSwipe === wrap) _openSwipe = null;
    }
  }, { passive: true });

  return wrap;
}

function updateSectionDeleteBtns() {
  var sections = document.querySelectorAll('#ing-sections .ing-section');
  var count = sections.length;
  sections.forEach(function(s) {
    var btn = s.querySelector('.ing-section-del');
    if (btn) btn.style.visibility = count > 1 ? 'visible' : 'hidden';
  });
}

function createSection(sectionData) {
  var section = document.createElement('div');
  section.className = 'ing-section';

  var headerRow = document.createElement('div');
  headerRow.className = 'ing-section-header-row';

  var nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'ing-section-name';
  nameInput.placeholder = _lang === 'en' ? 'Section (e.g. Dough, Filling…)' : 'Abschnitt (z.B. Teig, Füllung…)';
  nameInput.value = sectionData.name || '';

  var delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'del-btn ing-section-del';
  delBtn.textContent = '×';
  delBtn.addEventListener('click', function() {
    section.remove();
    updateSectionDeleteBtns();
  });

  headerRow.appendChild(nameInput);
  headerRow.appendChild(delBtn);

  var list = document.createElement('div');
  list.className = 'ing-section-list';
  (sectionData.ingredients || []).forEach(function(ing) {
    list.appendChild(createIngRow(ing));
  });

  var addIngBtn = document.createElement('button');
  addIngBtn.type = 'button';
  addIngBtn.className = 'btn btn-secondary btn-block btn-sm mt-8';
  addIngBtn.textContent = jst('add_ingredient');
  addIngBtn.addEventListener('click', function() {
    list.appendChild(createIngRow({}));
  });

  section.appendChild(headerRow);
  section.appendChild(list);
  section.appendChild(addIngBtn);
  return section;
}

function createStepRow(text, idx) {
  var wrap = document.createElement('div');
  wrap.className = 'step-swipe-wrap';

  var delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'ing-swipe-delete';
  delBtn.textContent = 'Löschen';
  delBtn.addEventListener('click', function() { wrap.remove(); if (window.renumberSteps) window.renumberSteps(); });

  var row = document.createElement('div');
  row.className = 'step-row';

  var num = document.createElement('span');
  num.className = 'step-num';
  num.textContent = String(idx + 1).padStart(2, '0');

  var ta = document.createElement('textarea');
  ta.className = 'textarea step-input';
  ta.rows = 2;
  ta.style.flex = '1';
  ta.placeholder = jst('describe_step');
  if (text) ta.value = text;

  row.appendChild(num);
  row.appendChild(ta);
  wrap.appendChild(delBtn);
  wrap.appendChild(row);

  var DEL_W = 80;
  var swStartX, swStartY, swTracking, swBase;

  row.addEventListener('touchstart', function(e) {
    if (e.touches.length !== 1) return;
    swStartX = e.touches[0].clientX;
    swStartY = e.touches[0].clientY;
    swTracking = null;
    swBase = wrap._swOpen ? -DEL_W : 0;
    row.style.transition = 'none';
  }, { passive: true });

  row.addEventListener('touchmove', function(e) {
    if (e.touches.length !== 1) return;
    var dx = e.touches[0].clientX - swStartX;
    var dy = e.touches[0].clientY - swStartY;
    if (!swTracking) {
      if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
      swTracking = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
    }
    if (swTracking !== 'h') return;
    e.preventDefault();
    var offset = Math.max(-DEL_W, Math.min(0, swBase + dx));
    row.style.transform = 'translateX(' + offset + 'px)';
  }, { passive: false });

  row.addEventListener('touchend', function(e) {
    if (swTracking !== 'h') return;
    var dx = e.changedTouches[0].clientX - swStartX;
    row.style.transition = 'transform .25s ease';
    var open = wrap._swOpen ? dx < DEL_W / 2 : -dx >= DEL_W / 2;
    if (open) {
      closeAllSwipes(wrap);
      row.style.transform = 'translateX(-' + DEL_W + 'px)';
      wrap._swOpen = true;
      _openSwipe = wrap;
    } else {
      row.style.transform = '';
      wrap._swOpen = false;
      if (_openSwipe === wrap) _openSwipe = null;
    }
  }, { passive: true });

  return wrap;
}

function splitNameRemark(raw) {
  var m = raw.match(/^(.*?)\\s*\\(([^)]+)\\)\\s*$/);
  if (!m) return { name: raw.trim(), remark: '' };
  return { name: m[1].trim(), remark: m[2].trim() };
}

function collectIngredientsFromList(list) {
  if (!list) return [];
  return Array.from(list.querySelectorAll('.ing-editor-row')).map(function(row) {
    var nameEl   = row.querySelector('.ing-name');
    var amountEl = row.querySelector('.ing-amount');
    var unitEl   = row.querySelector('.ing-unit');
    var rawName   = nameEl   ? nameEl.value.trim()               : '';
    var rawAmount = amountEl ? (parseFloat(amountEl.value) || 0) : 0;
    var rawUnit   = unitEl   ? unitEl.value                      : '';
    var storedName   = row.dataset.ingName   || '';
    var storedAmount = parseFloat(row.dataset.ingAmount || '0') || 0;
    var storedUnit   = row.dataset.ingUnit   || '';
    var storedRemark = row.dataset.ingRemark || '';
    var effectiveName   = rawName   || storedName;
    var effectiveAmount = rawName ? rawAmount : storedAmount;
    var effectiveUnit   = rawUnit   || storedUnit;
    var parsed      = splitNameRemark(effectiveName);
    var finalName   = parsed.name   || effectiveName;
    var finalRemark = parsed.remark || (rawName ? '' : storedRemark);
    if (!finalName) return null;
    var ing = { amount: effectiveAmount, name: finalName };
    if (effectiveUnit) ing.unit = effectiveUnit;
    if (finalRemark)   ing.remark = finalRemark;
    return ing;
  }).filter(function(i) { return i !== null && i.name; });
}

function collectIngredientSections() {
  return Array.from(document.querySelectorAll('#ing-sections .ing-section')).map(function(section) {
    var nameEl = section.querySelector('.ing-section-name');
    var name = nameEl ? nameEl.value.trim() : '';
    var list = section.querySelector('.ing-section-list');
    return { name: name, ingredients: collectIngredientsFromList(list) };
  }).filter(function(s) { return s.ingredients.length > 0; });
}

function collectIngredients() {
  var sections = collectIngredientSections();
  return sections.reduce(function(acc, s) { return acc.concat(s.ingredients); }, []);
}

function collectProcedure() {
  return Array.from(document.querySelectorAll('.step-input'))
    .map(function (t) { return t.value.trim(); })
    .filter(Boolean);
}

// ---- Settings ----
function initSettings() {
  var theme = localStorage.getItem('theme') || 'system';
  document.querySelectorAll('[data-theme]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  document.querySelectorAll('[data-lang-btn]').forEach(function (btn) {
    btn.classList.toggle('active', btn.dataset.langBtn === _lang);
  });

  window.setTheme = function (t) {
    localStorage.setItem('theme', t);
    applyTheme(t);
    document.querySelectorAll('[data-theme]').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.theme === t);
    });
  };

  var wl = document.getElementById('wake-lock-toggle');
  if (wl) {
    if (!('wakeLock' in navigator)) {
      var row = wl.closest('.settings-item');
      if (row) row.style.display = 'none';
    } else {
      wl.checked = localStorage.getItem('wakeLock') === 'true';
      wl.addEventListener('change', function () {
        localStorage.setItem('wakeLock', String(wl.checked));
        if (wl.checked) acquireWakeLock(); else releaseWakeLock();
      });
    }
  }
}

// ---- Wake Lock ----
var wakeLock = null;

async function acquireWakeLock() {
  if (!('wakeLock' in navigator) || wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', function () { wakeLock = null; });
  } catch (_) {
    // Device refused (low battery, power-saving mode, etc.) — silently ignore
  }
}

async function releaseWakeLock() {
  if (!wakeLock) return;
  await wakeLock.release().catch(function(){});
  wakeLock = null;
}

// Re-acquire after OS forces a release (e.g. screen turned off, tab switched).
// Covers: detail page always keeps screen on; global toggle respects user preference.
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState !== 'visible') return;
  var onDetail = document.body.dataset.page === 'detail';
  var globallyEnabled = localStorage.getItem('wakeLock') === 'true';
  if (onDetail || globallyEnabled) acquireWakeLock();
});

// On app start: activate if user had it enabled globally
if (localStorage.getItem('wakeLock') === 'true') acquireWakeLock();

// ---- Login ----
function initLogin() {
  var selectedUser = '';
  var tokenInput = document.getElementById('token-input');
  var signInBtn  = document.getElementById('sign-in-btn');
  var errorEl    = document.getElementById('login-error');

  document.querySelectorAll('.user-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      selectedUser = btn.dataset.user;
      document.querySelectorAll('.user-btn').forEach(function (b) { b.classList.toggle('selected', b === btn); });
      if (tokenInput) tokenInput.focus();
      if (signInBtn) signInBtn.disabled = !(selectedUser && tokenInput && tokenInput.value.trim());
    });
  });

  if (tokenInput) {
    tokenInput.addEventListener('input', function () {
      if (signInBtn) signInBtn.disabled = !(selectedUser && this.value.trim());
    });
    tokenInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !signInBtn.disabled) doLogin();
    });
  }

  window.handleLogin = doLogin;

  async function doLogin() {
    var token = tokenInput ? tokenInput.value.trim() : '';
    if (!selectedUser || !token) return;
    if (signInBtn) { signInBtn.disabled = true; signInBtn.innerHTML = '<span class="spinner"></span>'; }
    if (errorEl) errorEl.classList.add('hidden');

    var res;
    try {
      res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: selectedUser, token: token })
      });
    } catch {
      if (signInBtn) { signInBtn.disabled = false; signInBtn.textContent = 'Anmelden'; }
      if (errorEl) errorEl.classList.remove('hidden');
      return;
    }

    if (res.ok) {
      var data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', data.user);

      // Flush offline queue — only clear items that synced successfully
      var queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
      var remaining = [];
      for (var i = 0; i < queue.length; i++) {
        var item = queue[i];
        try {
          var syncRes = await fetch('/api/recipes/' + item.id, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + data.token },
            body: JSON.stringify(item.recipe)
          });
          if (!syncRes.ok) remaining.push(item);
        } catch (_) {
          remaining.push(item);
        }
      }
      if (remaining.length) localStorage.setItem('offlineQueue', JSON.stringify(remaining));
      else localStorage.removeItem('offlineQueue');
      location.href = '/';
    } else {
      if (signInBtn) { signInBtn.disabled = false; signInBtn.textContent = 'Anmelden'; }
      if (errorEl) errorEl.classList.remove('hidden');
    }
  }
}

// ---- Service Worker ----
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(function(){});
}

})();
`;
