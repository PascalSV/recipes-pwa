import { loginLayout, esc } from './layout.ts';
import { t, type Lang } from '../lib/i18n.ts';

export function loginPage(lang: Lang, error?: string): string {
  return loginLayout(`
<div class="login-wrap">
  <div class="login-brand">
    <div class="login-icon"><img src="/icon.png" alt="" style="width:46px;height:46px;object-fit:contain;filter:brightness(0)invert(1)"></div>
    <div class="login-title">Pascals Rezeptesammlung</div>
  </div>
  <div class="login-card">
    <div class="field-label" style="text-align:center">${t('login.choose_user', lang)}</div>
    <div class="user-btns">
      <button type="button" class="user-btn" data-user="Claudia">Claudia</button>
      <button type="button" class="user-btn" data-user="Pascal">Pascal</button>
    </div>
    <div class="field">
      <label class="field-label" for="token-input">${t('login.password', lang)}</label>
      <div style="position:relative">
        <input id="token-input" type="password" class="input" placeholder="${esc(t('login.password_ph', lang))}" autocomplete="current-password" style="padding-right:44px">
        <button type="button" id="toggle-pw" aria-label="${esc(t('login.pw_toggle', lang))}"
          onclick="(function(){var i=document.getElementById('token-input'),b=document.getElementById('toggle-pw');i.type=i.type==='password'?'text':'password';b.querySelector('.eye-closed').style.display=i.type==='password'?'block':'none';b.querySelector('.eye-open').style.display=i.type==='password'?'none':'block';})()"
          style="position:absolute;right:0;top:0;height:100%;width:44px;background:none;border:none;display:flex;align-items:center;justify-content:center;color:var(--text-3);cursor:pointer;padding:0">
          <svg class="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;display:block"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg class="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:20px;height:20px;display:none"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
      </div>
    </div>
    ${error
      ? `<div id="login-error" class="alert alert-error">${t('login.error', lang)}</div>`
      : `<div id="login-error" class="alert alert-error hidden">${t('login.error', lang)}</div>`}
    <button id="sign-in-btn" type="button" class="btn btn-primary btn-block" disabled onclick="handleLogin()">
      ${t('login.sign_in', lang)}
    </button>
  </div>
</div>`, lang);
}
