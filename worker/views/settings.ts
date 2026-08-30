import { pageLayout, esc, BACK_ICON } from './layout.ts';
import { t, type Lang } from '../lib/i18n.ts';
import { getCommitSha } from '../lib/version.ts';

export function settingsPage(user: string, lang: Lang): string {
  const navLeft = `<a href="/" class="nav-btn nav-btn-icon" title="${esc(t('back', lang))}">${BACK_ICON}</a>`;

  const content = `
    <div class="settings-group-title">${t('settings.appearance', lang)}</div>
    <div class="settings-card">
      <div class="settings-item">
        <span class="settings-item-label">${t('settings.theme', lang)}</span>
        <div class="segment" style="min-width:180px">
          <button type="button" class="seg-btn" data-theme="system" onclick="setTheme('system')">${t('settings.sys', lang)}</button>
          <button type="button" class="seg-btn" data-theme="light"  onclick="setTheme('light')">${t('settings.light', lang)}</button>
          <button type="button" class="seg-btn" data-theme="dark"   onclick="setTheme('dark')">${t('settings.dark', lang)}</button>
        </div>
      </div>
      <div class="settings-item">
        <span class="settings-item-label">${t('settings.language', lang)}</span>
        <div class="segment" style="min-width:110px">
          <button type="button" class="seg-btn" data-lang-btn="de" onclick="setLang('de')">DE</button>
          <button type="button" class="seg-btn" data-lang-btn="en" onclick="setLang('en')">EN</button>
        </div>
      </div>
    </div>

    <div class="settings-group-title">${t('settings.display', lang)}</div>
    <div class="settings-card">
      <div class="settings-item">
        <div style="flex:1">
          <div class="settings-item-label">${t('settings.wake_lock', lang)}</div>
          <div class="settings-item-sub">${t('settings.wake_sub', lang)}</div>
        </div>
        <label class="toggle">
          <input type="checkbox" id="wake-lock-toggle">
          <span class="toggle-track"></span>
        </label>
      </div>
    </div>

    <div class="settings-group-title">${t('settings.account', lang)}</div>
    <div class="settings-card">
      <div class="settings-item">
        <span class="settings-item-label">${t('settings.logged_in_as', lang)}</span>
        <span style="color:var(--text-2);font-size:15px">${esc(user)}</span>
      </div>
      <button type="button" class="settings-item"
        style="width:100%;border:none;background:var(--bg-card);font-size:17px;color:var(--danger);cursor:pointer;text-align:left;border-radius:0"
        onclick="logout()">
        ${t('settings.sign_out', lang)}
      </button>
    </div>

    <div class="settings-group-title">${t('settings.about', lang)}</div>
    <div class="settings-card">
      <div class="settings-item">
        <span class="settings-item-label">${t('settings.version', lang)}</span>
        <span style="color:var(--text-2);font-size:15px;font-family:ui-monospace,monospace">${esc(getCommitSha())}</span>
      </div>
    </div>
  `;

  return pageLayout({
    title: t('settings.title', lang),
    page: 'settings',
    lang,
    navLeft,
    content,
  });
}
