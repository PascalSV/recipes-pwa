export type Lang = 'de' | 'en';

const T: Record<string, Record<Lang, string>> = {
  // Navigation
  'back':                   { de: 'Zurück',                         en: 'Back' },
  'cancel':                 { de: 'Abbrechen',                      en: 'Cancel' },
  'delete':                 { de: 'Löschen',                        en: 'Delete' },
  'share':                  { de: 'Teilen',                         en: 'Share' },

  // Login
  'login.choose_user':      { de: 'Benutzer wählen',                en: 'Choose user' },
  'login.password':         { de: 'Passwort',                       en: 'Password' },
  'login.password_ph':      { de: 'Passwort eingeben',              en: 'Enter password' },
  'login.pw_toggle':        { de: 'Passwort anzeigen',              en: 'Show password' },
  'login.sign_in':          { de: 'Anmelden',                       en: 'Sign in' },
  'login.error':            { de: 'Ungültiges Passwort. Bitte erneut versuchen.', en: 'Invalid password. Please try again.' },

  // List
  'list.title':             { de: 'Pascals Rezeptesammlung',        en: "Pascal's Recipe Collection" },
  'list.search_ph':         { de: 'Rezepte suchen…',                en: 'Search recipes…' },
  'list.empty':             { de: 'Noch keine Rezepte vorhanden.',  en: 'No recipes yet.' },
  'list.new':               { de: 'Neues Rezept',                   en: 'New recipe' },

  // Detail
  'detail.portions':        { de: 'Portionen',                      en: 'Portions' },
  'detail.portion':         { de: 'Portion',                        en: 'Portion' },
  'detail.ingredients':     { de: 'Zutaten',                        en: 'Ingredients' },
  'detail.preparation':     { de: 'Zubereitung',                    en: 'Preparation' },

  // New recipe
  'new.title':              { de: 'Neues Rezept',                   en: 'New Recipe' },
  'new.paste_label':        { de: 'Rezepttext einfügen',            en: 'Paste recipe text' },
  'new.paste_ph':           { de: 'Rezepttext hier einfügen – Zutaten und Schritte werden automatisch erkannt…', en: 'Paste recipe text here – ingredients and steps will be detected automatically…' },
  'new.parse_error':        { de: 'Rezept konnte nicht extrahiert werden.', en: 'Could not extract recipe.' },
  'new.extract':            { de: 'Extrahieren',                    en: 'Extract' },
  'new.skip_parse':         { de: 'Direkt eingeben',               en: 'Skip – enter directly' },
  'new.paste_clipboard':    { de: 'Aus Zwischenablage einfügen',   en: 'Paste from clipboard' },
  'new.processing':         { de: 'Private LLM verarbeitet dein Rezept …', en: 'Private LLM is processing your recipe …' },
  'new.name':               { de: 'Rezeptname',                     en: 'Recipe name' },
  'new.category':           { de: 'Kategorie',                      en: 'Category' },
  'new.portions':           { de: 'Portionen',                      en: 'Portions' },
  'new.time':               { de: 'Kochzeit (Min.)',                 en: 'Cook time (min)' },
  'new.ingredients':        { de: 'Zutaten',                        en: 'Ingredients' },
  'new.add_ingredient':     { de: '+ Zutat hinzufügen',             en: '+ Add ingredient' },
  'new.preparation':        { de: 'Zubereitung',                    en: 'Preparation' },
  'new.add_step':           { de: '+ Schritt hinzufügen',           en: '+ Add step' },
  'new.save':               { de: 'Speichern',                      en: 'Save' },
  'new.ing_amount':         { de: 'Menge',                          en: 'Amount' },
  'new.ing_name':           { de: 'Zutat',                          en: 'Ingredient' },
  'new.step_ph':            { de: 'Schritt beschreiben…',           en: 'Describe step…' },

  // Edit recipe
  'edit.title':           { de: 'Rezept bearbeiten',               en: 'Edit Recipe' },

  // Settings
  'settings.title':         { de: 'Einstellungen',                  en: 'Settings' },
  'settings.appearance':    { de: 'Darstellung',                    en: 'Appearance' },
  'settings.theme':         { de: 'Design',                         en: 'Theme' },
  'settings.sys':           { de: 'System',                         en: 'System' },
  'settings.light':         { de: 'Hell',                           en: 'Light' },
  'settings.dark':          { de: 'Dunkel',                         en: 'Dark' },
  'settings.display':       { de: 'Display',                        en: 'Display' },
  'settings.wake_lock':     { de: 'Bildschirm anlassen',            en: 'Keep screen on' },
  'settings.wake_sub':      { de: 'Verhindert das Abdunkeln beim Lesen', en: 'Prevents screen dimming while reading' },
  'settings.language':      { de: 'Sprache',                        en: 'Language' },
  'settings.account':       { de: 'Konto',                          en: 'Account' },
  'settings.logged_in_as':  { de: 'Angemeldet als',                 en: 'Signed in as' },
  'settings.sign_out':      { de: 'Abmelden',                       en: 'Sign out' },
  'settings.about':         { de: 'Über',                           en: 'About' },
  'settings.version':       { de: 'Version',                        en: 'Version' },
};

export function t(key: string, lang: Lang): string {
  const entry = T[key];
  if (!entry) return key;
  return entry[lang] ?? entry['de'] ?? key;
}

export function getLangFromCookie(cookieHeader: string): Lang {
  const m = cookieHeader.match(/(?:^|;\s*)lang=([^;]+)/);
  return m?.[1] === 'en' ? 'en' : 'de';
}
