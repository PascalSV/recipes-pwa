import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './i18n';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { useWakeLock } from './hooks/useWakeLock';
import { useRecipes } from './hooks/useRecipes';
import { getPrefs, savePrefs } from './lib/db';
import { LoginScreen } from './components/LoginScreen';
import { RecipeList } from './components/RecipeList';
import { RecipeDetail } from './components/RecipeDetail';
import { SettingsView } from './components/SettingsView';
import { NewRecipeView } from './components/NewRecipeView';
import type { Prefs } from './types';

const DEFAULT_PREFS: Prefs = { language: 'de', theme: 'system', wakeLock: false };

export default function App() {
  const { session, loading: authLoading, login, logout } = useAuth();
  const { setTheme } = useTheme();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useWakeLock(prefs.wakeLock);

  useEffect(() => {
    getPrefs().then(setPrefs);
  }, []);

  const handlePrefsChange = async (next: Prefs) => {
    setPrefs(next);
    await savePrefs(next);
    setTheme(next.theme);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<RecipeListRoute token={session.token} onLogout={logout} />}
        />
        <Route path="/recipe/:id" element={<RecipeDetail token={session.token} />} />
        <Route
          path="/settings"
          element={
            <SettingsView
              prefs={prefs}
              onPrefsChange={handlePrefsChange}
              onLogout={logout}
              user={session.user}
            />
          }
        />
        <Route path="/new" element={<NewRecipeView token={session.token} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function RecipeListRoute({ token, onLogout }: { token: string; onLogout: () => void }) {
  const { recipes, loading } = useRecipes(token);
  return <RecipeList recipes={recipes} loading={loading} onLogout={onLogout} />;
}
