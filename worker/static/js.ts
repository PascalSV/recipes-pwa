export const JS = `
(function () {
'use strict';

// ---- Language ----
var _lang = document.body.dataset.lang || 'de';
var _T = {
  de: { amount:'Menge', ingredient:'Zutat', describe_step:'Schritt beschreiben…', offline:'Offline gespeichert – wird synchronisiert', copied:'In Zwischenablage kopiert', share_fail:'Teilen fehlgeschlagen', portions:'Portionen', portion:'Portion', save:'Speichern', extract:'Extrahieren' },
  en: { amount:'Amount', ingredient:'Ingredient', describe_step:'Describe step…', offline:'Saved offline – will sync', copied:'Copied to clipboard', share_fail:'Sharing failed', portions:'Portions', portion:'Portion', save:'Save', extract:'Extract' }
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
  const search = document.getElementById('search');
  if (!search) return;
  search.addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    document.querySelectorAll('[data-recipe-name]').forEach(function (item) {
      item.style.display = !q || item.dataset.recipeName.toLowerCase().includes(q) ? '' : 'none';
    });
    document.querySelectorAll('[data-group]').forEach(function (group) {
      const any = Array.from(group.querySelectorAll('[data-recipe-name]')).some(function(i) {
        return i.style.display !== 'none';
      });
      group.style.display = any ? '' : 'none';
    });
  });
}

// ---- Detail ----
function initDetail() {
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

  window.shareIngredients = async function () {
    const lines = [];
    document.querySelectorAll('.ingredient-row').forEach(function (row) {
      const amount = (row.querySelector('.ing-amount') || {}).textContent || '';
      const unit   = (row.querySelector('.ing-unit')   || {}).textContent || '';
      const name   = (row.querySelector('.ing-name,.ing-free') || {}).textContent || '';
      const remark = (row.querySelector('.ing-remark') || {}).textContent || '';
      let line = [amount.trim(), unit.trim(), name.trim()].filter(Boolean).join(' ');
      if (remark.trim()) line += ' (' + remark.trim() + ')';
      if (line.trim()) lines.push(line);
    });
    const text = lines.join('\\n');
    try {
      if (navigator.share) {
        await navigator.share({ text: text });
      } else {
        await navigator.clipboard.writeText(text);
        toast(jst('copied'));
      }
    } catch (err) {
      if (err && err.name !== 'AbortError') toast(jst('share_fail'));
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

  window.addIngredient = function () {
    var list = document.getElementById('ing-list');
    if (list) list.appendChild(createIngRow({}));
  };

  window.addStep = function () {
    var list = document.getElementById('steps-list');
    if (!list) return;
    var idx = list.querySelectorAll('.step-row').length;
    var div = document.createElement('div');
    div.className = 'step-row';
    div.style.cssText = 'display:flex;align-items:flex-start;gap:8px;margin-top:8px';
    div.innerHTML =
      '<span class="step-num">' + (idx + 1) + '</span>' +
      '<textarea class="textarea step-input" rows="2" placeholder="' + jst('describe_step') + '" style="flex:1"></textarea>' +
      '<button type="button" class="del-btn" onclick="this.closest(\\'.step-row\\').remove();renumberSteps()">×</button>';
    list.appendChild(div);
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
  var list = document.getElementById('ing-list');
  if (list) {
    list.innerHTML = '';
    (recipe.ingredients || []).forEach(function (ing) {
      list.appendChild(createIngRow(ing));
    });
  }
  var steps = document.getElementById('steps-list');
  if (steps) {
    steps.innerHTML = '';
    (recipe.procedure || []).forEach(function (step, i) {
      var div = document.createElement('div');
      div.className = 'step-row';
      div.style.cssText = 'display:flex;align-items:flex-start;gap:8px;' + (i > 0 ? 'margin-top:8px' : '');
      div.innerHTML =
        '<span class="step-num">' + (i + 1) + '</span>' +
        '<textarea class="textarea step-input" rows="2" style="flex:1">' + esc(step) + '</textarea>' +
        '<button type="button" class="del-btn" onclick="this.closest(\\'.step-row\\').remove();renumberSteps()">×</button>';
      steps.appendChild(div);
    });
  }
}

var UNITS = ['', 'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'piece'];
var UNIT_LABELS = { '': '—', g: 'g', kg: 'kg', ml: 'ml', l: 'l', tbsp: 'EL', tsp: 'TL', cup: 'Tasse', piece: 'Stk' };

function createIngRow(ing) {
  var div = document.createElement('div');
  div.className = 'ing-editor-row';
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
    '<input type="text" class="input ing-name" placeholder="' + jst('ingredient') + '" value="' + esc(nameVal) + '">' +
    '<button type="button" class="del-btn" onclick="this.closest(\\'.ing-editor-row\\').remove()">×</button>';
  return div;
}

function splitNameRemark(raw) {
  var m = raw.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (!m) return { name: raw.trim(), remark: '' };
  return { name: m[1].trim(), remark: m[2].trim() };
}

function collectIngredients() {
  return Array.from(document.querySelectorAll('.ing-editor-row')).map(function (row) {
    var nameEl   = row.querySelector('.ing-name');
    var amountEl = row.querySelector('.ing-amount');
    var unitEl   = row.querySelector('.ing-unit');
    var parsed = splitNameRemark(nameEl ? nameEl.value.trim() : '');
    var ing = {
      amount: amountEl ? (parseFloat(amountEl.value) || 0) : 0,
      name: parsed.name
    };
    var unit = unitEl ? unitEl.value : '';
    if (unit) ing.unit = unit;
    if (parsed.remark) ing.remark = parsed.remark;
    return ing;
  }).filter(function (i) { return i.name; });
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
  } catch (_) {}
}
async function releaseWakeLock() {
  if (!wakeLock) return;
  await wakeLock.release().catch(function(){});
  wakeLock = null;
}
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible' && localStorage.getItem('wakeLock') === 'true') acquireWakeLock();
});
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
