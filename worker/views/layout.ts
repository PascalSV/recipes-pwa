import type { Lang } from '../lib/i18n.ts';

export function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


const THEME_SCRIPT = `<script>(function(){var t=localStorage.getItem('theme')||'system';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');else if(t==='light')document.documentElement.classList.add('light');}());<\/script>`;

const MANIFEST_LINK = `<link rel="manifest" href="/manifest.json">`;
const FAVICON_LINK = `<link rel="icon" href="/icon.png" type="image/png">`;

const IOS_META = `
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Pascals Rezepte">`.trim();

// Shared icons
const CHEVRON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`;
const PLUS_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const LOGOUT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`;
const SHARE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`;

export { CHEVRON, PLUS_ICON, LOGOUT_ICON, SHARE_ICON };

export function pageLayout(opts: {
  title: string;
  page: string;
  lang: Lang;
  bodyAttrs?: string;
  navLeft?: string;
  navRight?: string;
  content: string;
}): string {
  return `<!DOCTYPE html>
<html lang="${opts.lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)">
${IOS_META}
<title>${esc(opts.title)} — Pascals Rezeptesammlung</title>
${MANIFEST_LINK}
${FAVICON_LINK}
<link rel="stylesheet" href="/styles.css">
${THEME_SCRIPT}
</head>
<body data-page="${esc(opts.page)}" data-lang="${opts.lang}"${opts.bodyAttrs ? ' ' + opts.bodyAttrs : ''}>
<header class="nav">
  <div class="nav-row">
    <div class="nav-left">${opts.navLeft ?? ''}</div>
    <div class="nav-right">${opts.navRight ?? ''}</div>
  </div>
  <h1 class="nav-title">${esc(opts.title)}</h1>
</header>
<div class="page">
${opts.content}
</div>
<script src="/app.js"></script>
</body>
</html>`;
}

// Broken spatula: same shape as the app icon (wide head + 3 slots + handle),
// but the handle is snapped in two with an angle at the break.
const BROKEN_SPOON = `<svg viewBox="0 0 24 24" fill="currentColor">
  <!-- Head with 3 slot holes punched out via evenodd -->
  <path fill-rule="evenodd" d="M6.5,2 L17.5,2 C20,4 16,11 14,12.5 L14,13.5 L10,13.5 L10,12.5 C8,11 4,4 6.5,2 Z M9.5,4.5 L9.5,9.5 L10.5,9.5 L10.5,4.5 Z M11.5,4 L11.5,10 L12.5,10 L12.5,4 Z M13.5,4.5 L13.5,9.5 L14.5,9.5 L14.5,4.5 Z"/>
  <!-- Upper handle (straight, connects to head) -->
  <rect x="10" y="13.5" width="4" height="5"/>
  <!-- Lower handle (broken off, angled ~25° to the right) -->
  <polygon points="10.5,20 12,23.5 16,23.5 14.5,20"/>
</svg>`;

export function recipeNotFoundPage(lang: Lang): string {
  const isEn = lang === 'en';
  const title = isEn ? 'Recipe not found' : 'Rezept nicht gefunden';
  const headline = 'Oooops.';
  const msg = isEn
    ? "Looks like this recipe got eaten by the dog."
    : "Da ist das Rezept wohl vom Hund gefressen worden.";
  const linkText = isEn ? 'Back to all recipes' : 'Zu allen Rezepten';

  return pageLayout({
    title,
    page: 'not-found',
    lang,
    navLeft: `<a href="/" class="nav-btn" style="text-decoration:none">${BACK_ICON}${isEn ? 'Recipes' : 'Rezepte'}</a>`,
    content: `
<div class="error-page-wrap">
  <div class="error-page-card">
    <div class="error-page-icon">${BROKEN_SPOON}</div>
    <p class="error-page-headline">${headline}</p>
    <p class="error-page-msg">${msg}</p>
    <a href="/" class="btn btn-primary" style="text-align:center;text-decoration:none">${linkText}</a>
  </div>
</div>`,
  });
}

const BACK_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

export function loginLayout(content: string, lang: Lang): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)">
${IOS_META}
<title>${lang === 'en' ? 'Sign in' : 'Anmelden'} — Pascals Rezeptesammlung</title>
${MANIFEST_LINK}
${FAVICON_LINK}
<link rel="stylesheet" href="/styles.css">
${THEME_SCRIPT}
</head>
<body data-page="login" data-lang="${lang}">
${content}
<script src="/app.js"><\/script>
</body>
</html>`;
}
