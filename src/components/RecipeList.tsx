import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RecipeMeta } from '../types';

interface Props {
  recipes: RecipeMeta[];
  loading: boolean;
  onLogout: () => void;
}

export function RecipeList({ recipes, loading, onLogout }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const grouped = useMemo(() => {
    const filtered = recipes.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
    const map = new Map<string, RecipeMeta[]>();
    for (const r of filtered) {
      const list = map.get(r.group) ?? [];
      list.push(r);
      map.set(r.group, list);
    }
    // Sort groups and recipes within each group
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([group, items]) => ({
        group,
        items: items.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [recipes, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Nav bar */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 safe-top">
        <div className="flex items-center justify-between px-4 h-12">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('nav.recipes')}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/new')}
              aria-label={t('nav.newRecipe')}
              className="text-blue-500 text-2xl leading-none"
            >
              +
            </button>
            <button
              onClick={() => navigate('/settings')}
              aria-label={t('nav.settings')}
              className="text-blue-500"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
            <button
              onClick={onLogout}
              aria-label="Abmelden"
              className="text-blue-500"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
        {/* Search bar */}
        <div className="px-4 pb-3">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('recipeList.searchPlaceholder')}
            className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none"
          />
        </div>
      </div>

      {/* Content */}
      <div className="pb-8">
        {loading && recipes.length === 0 && (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && grouped.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 mt-20">
            {t('recipeList.noResults')}
          </p>
        )}
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <div className="sticky top-[96px] z-[5] px-4 py-1 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {group}
              </span>
            </div>
            <div className="bg-white dark:bg-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
              {items.map((recipe, i) => (
                <button
                  key={recipe.id}
                  onClick={() => navigate(`/recipe/${recipe.id}`)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left ${
                    i < items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
                  }`}
                >
                  <span className="text-gray-900 dark:text-white text-base">{recipe.name}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gray-300 dark:text-gray-600 flex-shrink-0">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
