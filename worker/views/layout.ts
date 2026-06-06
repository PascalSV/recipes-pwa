import type { Lang } from '../lib/i18n.ts';

export function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg"><circle cx="7" cy="7" r="4"/><line x1="7" y1="11" x2="7" y2="21"/><line x1="13" y1="8" x2="22" y2="8"/><line x1="13" y1="13" x2="22" y2="13"/><line x1="13" y1="18" x2="22" y2="18"/></svg>`;

const THEME_SCRIPT = `<script>(function(){var t=localStorage.getItem('theme')||'system';if(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark');else if(t==='light')document.documentElement.classList.add('light');}());<\/script>`;

const MANIFEST_LINK = `<link rel="manifest" href="/manifest.json">`;

const IOS_META = `
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Rezepte">`.trim();

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
<title>${esc(opts.title)} — Rezepte</title>
${MANIFEST_LINK}
<link rel="stylesheet" href="/styles.css">
${THEME_SCRIPT}
</head>
<body data-page="${esc(opts.page)}" data-lang="${opts.lang}"${opts.bodyAttrs ? ' ' + opts.bodyAttrs : ''}>
<nav class="nav">
  <div style="display:flex;align-items:center;min-width:44px">${opts.navLeft ?? ''}</div>
  <span class="nav-title">${esc(opts.title)}</span>
  <div style="display:flex;align-items:center;justify-content:flex-end;min-width:44px">${opts.navRight ?? ''}</div>
</nav>
<div class="page">
${opts.content}
</div>
<script src="/app.js"><\/script>
</body>
</html>`;
}

export function loginLayout(content: string, lang: Lang): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#1c1c1e" media="(prefers-color-scheme: dark)">
${IOS_META}
<title>${lang === 'en' ? 'Sign in' : 'Anmelden'} — Rezepte</title>
${MANIFEST_LINK}
<link rel="stylesheet" href="/styles.css">
${THEME_SCRIPT}
</head>
<body data-page="login" data-lang="${lang}">
${content}
<script src="/app.js"><\/script>
</body>
</html>`;
}
