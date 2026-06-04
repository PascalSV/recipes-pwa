import { useTranslation } from 'react-i18next';
import type { ThemePreference, Language, Prefs } from '../types';
import { useWakeLock } from '../hooks/useWakeLock';

interface Props {
  prefs: Prefs;
  onPrefsChange: (p: Prefs) => void;
  onLogout: () => void;
  user: string;
}

export function SettingsView({ prefs, onPrefsChange, onLogout, user }: Props) {
  const { t, i18n } = useTranslation();
  const { isSupported } = useWakeLock(false);

  const setTheme = (theme: ThemePreference) => onPrefsChange({ ...prefs, theme });
  const setLanguage = (language: Language) => {
    i18n.changeLanguage(language);
    onPrefsChange({ ...prefs, language });
  };
  const setWakeLock = (wakeLock: boolean) => onPrefsChange({ ...prefs, wakeLock });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="safe-top" />
        <div className="px-4 pt-4 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('settings.title')}
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 pb-28 flex flex-col gap-6">
        {/* Appearance */}
        <section>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('settings.appearance')}
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Theme */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-900 dark:text-white text-base">{t('settings.theme')}</span>
              <SegmentedControl
                options={[
                  { value: 'system', label: t('settings.themeSystem') },
                  { value: 'light', label: t('settings.themeLight') },
                  { value: 'dark', label: t('settings.themeDark') },
                ]}
                value={prefs.theme}
                onChange={v => setTheme(v as ThemePreference)}
              />
            </div>
            {/* Language */}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-gray-900 dark:text-white text-base">{t('settings.language')}</span>
              <SegmentedControl
                options={[
                  { value: 'de', label: 'Deutsch' },
                  { value: 'en', label: 'English' },
                ]}
                value={prefs.language}
                onChange={v => setLanguage(v as Language)}
              />
            </div>
          </div>
        </section>

        {/* Display */}
        <section>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('settings.display')}
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="text-gray-900 dark:text-white text-base">{t('settings.keepScreenOn')}</span>
                {!isSupported && (
                  <p className="text-xs text-gray-400 mt-0.5">{t('settings.keepScreenOnUnsupported')}</p>
                )}
              </div>
              <Toggle
                checked={prefs.wakeLock}
                onChange={setWakeLock}
                disabled={!isSupported}
              />
            </div>
          </div>
        </section>

        {/* Account */}
        <section>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 px-1">
            {t('settings.account')}
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-base">{t('settings.loggedInAs')}</span>
              <span className="text-gray-900 dark:text-white text-base font-medium">{user}</span>
            </div>
            <button
              onClick={onLogout}
              className="w-full text-left px-4 py-3 text-red-500 text-base"
            >
              {t('settings.signOut')}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SegmentedControl({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg bg-gray-100 dark:bg-gray-700 p-0.5">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            value === opt.value
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`relative w-12 h-7 rounded-full transition-colors ${
        checked ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
      } ${disabled ? 'opacity-40' : ''}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}
