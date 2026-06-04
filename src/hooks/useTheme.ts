import { useEffect, useState } from 'react';
import type { ThemePreference } from '../types';
import { getPrefs, savePrefs } from '../lib/db';

function applyTheme(theme: ThemePreference): boolean {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
  return isDark;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemePreference>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    getPrefs().then(prefs => {
      setThemeState(prefs.theme);
      setIsDark(applyTheme(prefs.theme));
    });
  }, []);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setIsDark(applyTheme('system'));
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = async (next: ThemePreference) => {
    setThemeState(next);
    setIsDark(applyTheme(next));
    const prefs = await getPrefs();
    await savePrefs({ ...prefs, theme: next });
  };

  return { theme, isDark, setTheme };
}
