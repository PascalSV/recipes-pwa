export const CSS = `
@font-face{font-family:'D-DIN';font-style:normal;font-weight:400;font-display:swap;src:url('/fonts/D-DIN.otf') format('opentype')}
@font-face{font-family:'D-DIN';font-style:italic;font-weight:400;font-display:swap;src:url('/fonts/D-DIN-Italic.otf') format('opentype')}
@font-face{font-family:'D-DIN';font-style:normal;font-weight:700;font-display:swap;src:url('/fonts/D-DIN-Bold.otf') format('opentype')}
@font-face{font-family:'D-DIN Condensed';font-style:normal;font-weight:400;font-display:swap;src:url('/fonts/D-DINCondensed.otf') format('opentype')}
@font-face{font-family:'D-DIN Condensed';font-style:normal;font-weight:700;font-display:swap;src:url('/fonts/D-DINCondensed-Bold.otf') format('opentype')}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
body{font-family:'D-DIN',-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:var(--bg);color:var(--text);min-height:100dvh;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}
a{color:inherit;text-decoration:none}
button{cursor:pointer;font:inherit;-webkit-tap-highlight-color:transparent}
input,textarea,select{font:inherit}
img,svg{display:block}

:root{
  --green:#2a9d6e;--green-2:#22865c;--green-3:#e8f5ee;--green-4:#d0edd8;
  --bg:#f2f2f7;--bg-card:#fff;--bg-input:#f2f2f7;--bg-sel:#e8f5ee;
  --text:#1c1c1e;--text-2:#6c6c70;--text-3:#8e8e93;--text-inv:#fff;
  --border:#e5e5ea;--border-2:#f2f2f7;
  --danger:#ff3b30;--danger-bg:#fff1f0;
  --radius:14px;--radius-s:10px;--radius-xs:8px;
  --shadow-s:0 1px 4px rgba(0,0,0,.06);--shadow:0 2px 14px rgba(0,0,0,.09);
  --nav-h:88px;--safe-t:env(safe-area-inset-top,0px);--safe-b:env(safe-area-inset-bottom,0px)
}

@media(prefers-color-scheme:dark){
  :root:not(.light){
    --green:#34c978;--green-2:#2db869;--green-3:#0c2016;--green-4:#122a1c;
    --bg:#000;--bg-card:#1c1c1e;--bg-input:#2c2c2e;--bg-sel:#0c2016;
    --text:#fff;--text-2:#8e8e93;--text-3:#636366;--text-inv:#000;
    --border:#38383a;--border-2:#2c2c2e;
    --danger:#ff453a;--danger-bg:#1a0808;
    --shadow-s:0 1px 4px rgba(0,0,0,.5);--shadow:0 2px 14px rgba(0,0,0,.6)
  }
}
.dark{
  --green:#34c978;--green-2:#2db869;--green-3:#0c2016;--green-4:#122a1c;
  --bg:#000;--bg-card:#1c1c1e;--bg-input:#2c2c2e;--bg-sel:#0c2016;
  --text:#fff;--text-2:#8e8e93;--text-3:#636366;--text-inv:#000;
  --border:#38383a;--border-2:#2c2c2e;
  --danger:#ff453a;--danger-bg:#1a0808;
  --shadow-s:0 1px 4px rgba(0,0,0,.5);--shadow:0 2px 14px rgba(0,0,0,.6)
}

/* ── Nav ── */
.nav{position:sticky;top:0;z-index:100;background:var(--bg);padding-top:var(--safe-t);border-bottom:1px solid var(--border-2)}
.nav-row{display:flex;align-items:center;height:44px;padding-inline:4px}
.nav-left{display:flex;align-items:center}
.nav-right{display:flex;align-items:center;margin-left:auto}
.nav-title{font-size:26px;font-weight:700;letter-spacing:-.5px;color:var(--text);padding:2px 16px 12px;line-height:1.15;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nav-btn{display:flex;align-items:center;justify-content:center;min-width:44px;height:44px;background:transparent;border:none;color:var(--green);border-radius:var(--radius-xs);flex-shrink:0;transition:background .15s;font-size:14px;font-weight:500;gap:4px;padding-inline:10px;white-space:nowrap;text-decoration:none}
.nav-btn svg{width:22px;height:22px;flex-shrink:0}
.nav-btn:active{background:var(--green-3)}
.nav-btn-danger{color:var(--danger)}
.nav-btn-danger:active{background:var(--danger-bg)}

/* ── Page ── */
.page{padding-bottom:calc(44px + var(--safe-b));max-width:700px;margin:0 auto}

/* ── Recipe list ── */
.group-title{padding:32px 20px 10px;font-size:24px;font-weight:700;letter-spacing:-.4px;color:var(--text)}
.recipe-list{background:var(--bg-card);border-radius:var(--radius);margin:0 16px;box-shadow:var(--shadow-s);overflow:hidden}
.list-item{display:flex;align-items:center;padding:14px 16px;gap:12px;border-bottom:1px solid var(--border-2);position:relative}
.list-item:last-child{border-bottom:none}
a.list-item:active{background:var(--bg-sel)}
.list-item-text{flex:1;font-size:17px;font-weight:500;color:var(--text);line-height:1.3}
.list-item-sub{font-size:13px;color:var(--text-2);margin-top:2px}
.list-chevron{color:var(--border);flex-shrink:0}
.list-chevron svg{width:14px;height:14px}

/* ── Search ── */
.search-wrap{padding:14px 16px 6px}
.search-input{width:100%;padding:10px 14px 10px 40px;background:var(--bg-card);border:none;border-radius:12px;font-size:16px;color:var(--text);outline:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2' stroke-linecap='round'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'/%3E%3C/svg%3E");background-repeat:no-repeat;background-size:18px;background-position:12px center;box-shadow:var(--shadow-s)}
.search-input::placeholder{color:var(--text-3)}

/* ── Buttons ── */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:14px 22px;border-radius:var(--radius-s);font-size:16px;font-weight:600;border:none;transition:background .15s,opacity .15s;cursor:pointer;user-select:none}
.btn:disabled{opacity:.4;pointer-events:none}
.btn-primary{background:var(--green);color:#fff}
.btn-primary:active{background:var(--green-2)}
.btn-secondary{background:var(--green-3);color:var(--green)}
.btn-secondary:active{background:var(--green-4)}
.btn-danger{background:var(--danger-bg);color:var(--danger)}
.btn-block{width:100%}
.btn-sm{padding:9px 14px;font-size:14px;border-radius:var(--radius-xs)}

/* ── Forms ── */
.field{display:flex;flex-direction:column;gap:6px}
.field-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--text-2)}
.input,.textarea,.select{width:100%;padding:12px 14px;background:var(--bg-card);border:1.5px solid var(--border);border-radius:var(--radius-s);font-size:16px;color:var(--text);outline:none;transition:border-color .15s}
.input:focus,.textarea:focus,.select:focus{border-color:var(--green)}
.textarea{resize:vertical;min-height:130px;line-height:1.6}
.select{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%238e8e93' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-size:18px;background-position:right 12px center;padding-right:40px}

/* ── Recipe detail sections ── */
.recipe-section{margin:16px 16px 0}
.recipe-section-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);padding:0 4px 8px}
.recipe-content{background:var(--bg-card);border-radius:var(--radius);box-shadow:var(--shadow-s);overflow:hidden}

/* ── Portion bar ── */
.portion-bar{position:sticky;top:calc(var(--nav-h) + var(--safe-t));z-index:50;background:var(--bg);border-bottom:1px solid var(--border-2);padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:0}
.portion-btn{width:32px;height:32px;border-radius:50%;background:transparent;color:var(--green);border:1.5px solid var(--green);font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center;transition:background .1s;font-weight:300}
.portion-btn:active{background:var(--green-3)}
.portion-label{font-size:15px;font-weight:600;color:var(--text);min-width:96px;text-align:center}
.portion-sep{width:1px;height:18px;background:var(--border-2);margin:0 16px}

/* ── Ingredient rows (detail page) ── */
.ingredient-row{padding:11px 20px;border-bottom:1px solid var(--border-2);display:flex;align-items:baseline;gap:12px}
.ingredient-row:last-child{border-bottom:none}
.ing-qty{min-width:72px;flex-shrink:0;text-align:right;font-size:15px;font-weight:700;color:var(--green);line-height:1.4}
.ing-amount{font-variant-numeric:tabular-nums}
.ing-unit{font-weight:400;color:var(--text-2)}
.ing-details{flex:1}
.ing-name{font-size:16px;color:var(--text);line-height:1.4}
.ing-remark{display:block;font-size:13px;color:var(--text-3);font-style:italic;margin-top:1px}
.ing-free{display:block;font-size:15px;color:var(--text-2)}

/* ── Procedure steps ── */
.step{display:flex;gap:16px;padding:14px 20px;border-bottom:1px solid var(--border-2)}
.step:last-child{border-bottom:none}
.step-num{font-size:13px;font-weight:800;color:var(--green);flex-shrink:0;min-width:20px;padding-top:3px}
.step-text{font-size:16px;line-height:1.65;color:var(--text)}

/* ── Segment control ── */
.segment{display:flex;background:var(--border-2);border-radius:var(--radius-s);padding:2px;gap:2px}
.seg-btn{flex:1;padding:7px 6px;font-size:14px;font-weight:500;border:none;border-radius:var(--radius-xs);background:transparent;color:var(--text-2);transition:all .15s;cursor:pointer}
.seg-btn.active{background:var(--bg-card);color:var(--green);font-weight:600;box-shadow:var(--shadow-s)}

/* ── Toggle ── */
.toggle-wrap{display:flex;align-items:center;justify-content:space-between;gap:12px}
.toggle{position:relative;width:51px;height:31px;flex-shrink:0}
.toggle input{opacity:0;width:0;height:0;position:absolute}
.toggle-track{position:absolute;inset:0;background:var(--border);border-radius:31px;transition:background .2s;cursor:pointer}
.toggle input:checked+.toggle-track{background:var(--green)}
.toggle-track::after{content:'';position:absolute;top:3px;left:3px;width:25px;height:25px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.2);transition:transform .2s}
.toggle input:checked+.toggle-track::after{transform:translateX(20px)}

/* ── Settings ── */
.settings-card{background:var(--bg-card);border-radius:var(--radius);box-shadow:var(--shadow-s);overflow:hidden;margin:0 16px}
.settings-group-title{font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--text-3);padding:22px 20px 8px}
.settings-item{display:flex;align-items:center;padding:14px 20px;border-bottom:1px solid var(--border-2);gap:12px}
.settings-item:last-child{border-bottom:none}
.settings-item-label{flex:1;font-size:17px;color:var(--text)}
.settings-item-sub{font-size:13px;color:var(--text-3)}

/* ── Login ── */
.login-wrap{min-height:100dvh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:32px;background:var(--bg)}
.login-brand{display:flex;flex-direction:column;align-items:center;gap:16px}
.login-icon{width:80px;height:80px;background:var(--green);border-radius:22px;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 24px rgba(42,157,110,.3)}
.login-icon svg{width:46px;height:46px;color:#fff}
.login-title{font-size:30px;font-weight:700;color:var(--text);letter-spacing:-.5px}
.login-card{background:var(--bg-card);border-radius:var(--radius);box-shadow:var(--shadow);padding:24px;width:100%;max-width:340px;display:flex;flex-direction:column;gap:16px}
.user-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.user-btn{padding:14px;border-radius:var(--radius-s);border:1.5px solid var(--border);background:var(--bg-card);color:var(--text);font-size:16px;font-weight:600;transition:all .15s;cursor:pointer}
.user-btn.selected{border-color:var(--green);background:var(--green-3);color:var(--green)}

/* ── New/Edit recipe form ── */
.form-section{padding:20px 16px 0}
.form-card{background:var(--bg-card);border-radius:var(--radius);box-shadow:var(--shadow-s);overflow:hidden}
.form-card-padded{padding:16px}
/* ── Ingredient sections (edit form) ── */
.ing-section-header-row{display:flex;align-items:center;gap:6px;padding:10px 0 6px;border-bottom:1px solid var(--border-2)}
.ing-section+.ing-section>.ing-section-header-row{margin-top:4px}
.ing-section-name{flex:1;background:transparent;border:none;border-bottom:1.5px solid transparent;outline:none;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-2);padding:2px 0;transition:border-color .15s,color .15s}
.ing-section-name:focus{border-bottom-color:var(--green);color:var(--text)}
.ing-section-name::placeholder{color:var(--text-3);font-weight:600;text-transform:none;letter-spacing:0}
/* ── Ingredient section labels (detail view) ── */
.ing-sub-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--text-3);padding:10px 20px 4px;border-top:1px solid var(--border-2)}
.recipe-content>.ing-sub-label:first-child{border-top:none}
.ing-swipe-wrap{position:relative;overflow:hidden;border-bottom:1px solid var(--border-2)}
.ing-swipe-wrap:last-child{border-bottom:none}
.ing-swipe-delete{position:absolute;right:0;top:0;bottom:0;width:80px;background:#ff3b30;color:#fff;border:none;font-size:15px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;letter-spacing:.01em}
.ing-editor-row{display:grid;grid-template-columns:60px 70px 1fr;gap:8px;align-items:center;padding:10px 0;position:relative;z-index:1;background:var(--bg-card);will-change:transform}
.ing-editor-row .input,.ing-editor-row .select{padding:9px 10px;font-size:15px}
.ing-editor-row .select{padding-right:28px}
.del-btn{width:32px;height:32px;border-radius:50%;background:transparent;color:var(--text-3);border:none;font-size:20px;display:flex;align-items:center;justify-content:center;transition:color .12s;flex-shrink:0}
.del-btn:active{color:var(--danger)}
.step-row{display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid var(--border-2)}
.step-row:last-child{border-bottom:none}
.step-row .step-num{color:var(--green);font-weight:800;font-size:13px;padding-top:14px;min-width:22px;flex-shrink:0}

/* ── Misc ── */
.spinner{display:inline-block;width:20px;height:20px;border:2.5px solid rgba(255,255,255,.3);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
.spinner-green{border-color:var(--green-3);border-top-color:var(--green)}
@keyframes spin{to{transform:rotate(360deg)}}
.alert{padding:12px 16px;border-radius:var(--radius-s);font-size:14px;line-height:1.5}
.alert-error{background:var(--danger-bg);color:var(--danger)}
.alert-ok{background:var(--green-3);color:var(--green-2)}
.empty{text-align:center;padding:52px 24px;color:var(--text-3)}
.empty svg{width:48px;height:48px;margin:0 auto 12px;opacity:.4}
.hidden{display:none!important}
.mt-8{margin-top:8px}.mt-16{margin-top:16px}.mt-20{margin-top:20px}.fw-600{font-weight:600}

/* ── Toast ── */
.toast{position:fixed;bottom:calc(24px + var(--safe-b));left:50%;transform:translateX(-50%);background:rgba(28,28,30,.9);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:#fff;padding:11px 22px;border-radius:100px;font-size:15px;font-weight:500;z-index:999;pointer-events:none;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,.2);animation:fadein .2s ease}
@keyframes fadein{from{opacity:0;transform:translateX(-50%) translateY(6px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}

/* ── Custom dialog ── */
.dialog-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:flex-end;justify-content:center;padding-bottom:calc(16px + var(--safe-b));animation:fadeIn .18s ease}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.dialog-sheet{background:var(--bg-card);border-radius:var(--radius) var(--radius) 0 0;width:100%;max-width:480px;padding:20px 16px 8px;display:flex;flex-direction:column;gap:10px;animation:slideUp .22s ease}
@keyframes slideUp{from{transform:translateY(32px)}to{transform:translateY(0)}}
.dialog-title{font-size:17px;font-weight:700;color:var(--text);text-align:center;padding-bottom:2px}
.dialog-msg{font-size:14px;color:var(--text-2);text-align:center;line-height:1.5;padding-bottom:6px}
.dialog-action{width:100%;padding:15px;border-radius:var(--radius-s);border:none;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:0}
.dialog-action-danger{background:#ff3b30;color:#fff}
.dialog-action-cancel{background:var(--border-2);color:var(--text-2);margin-bottom:8px}

.print-title{display:none}

/* ── Print / PDF ── */
@media print{
  .nav,.portion-bar{display:none!important}
  .print-title{display:block!important;font-size:22pt;font-weight:700;font-family:Georgia,serif;padding:0 20px 12pt;border-bottom:1pt solid #ccc;margin-bottom:16pt}
  body{background:#fff!important;color:#000!important}
  .page{padding:0!important;max-width:none!important;margin:0!important}
  .recipe-section{margin:0 0 16pt!important}
  .recipe-section-label{font-size:9pt!important;letter-spacing:.1em!important;color:#666!important;border-bottom:0.5pt solid #ccc;padding-bottom:4pt!important}
  .recipe-content{background:#fff!important;box-shadow:none!important;border-radius:0!important}
  .ingredient-row,.step{border-bottom:0.4pt solid #e0e0e0!important}
  @page{margin:20mm;size:A4}
}
`;
