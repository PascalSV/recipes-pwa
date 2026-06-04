import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import { BottomTabBar } from './components/BottomTabBar';
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
        <Route element={<TabLayout />}>
          <Route path="/" element={<RecipeListRoute token={session.token} />} />
          <Route path="/recipe/:id" element={<RecipeDetail token={session.token} />} />
          <Route path="/import" element={<NewRecipeView token={session.token} />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

function TabLayout() {
  return (
    <>
      <Outlet />
      <BottomTabBar />
    </>
  );
}

function RecipeListRoute({ token }: { token: string }) {
  const { recipes, loading } = useRecipes(token);
  return <RecipeList recipes={recipes} loading={loading} />;
}
