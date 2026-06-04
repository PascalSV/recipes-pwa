import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { RecipeMeta } from '../types';
import { getCategoryStyle, getCategoryColors } from '../lib/categoryColors';

interface Props {
  recipes: RecipeMeta[];
  loading: boolean;
}

export function RecipeList({ recipes, loading }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const allGroups = useMemo(
    () => Array.from(new Set(recipes.map(r => r.group))).sort(),
    [recipes]
  );

  const filtered = useMemo(() => {
    let list = recipes;
    if (search) list = list.filter(r =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
    if (selectedGroup) list = list.filter(r => r.group === selectedGroup);
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [recipes, search, selectedGroup]);

  // Group for display (only when showing all)
  const grouped = useMemo(() => {
    if (selectedGroup) return null;
    const map = new Map<string, RecipeMeta[]>();
    for (const r of filtered) {
      const g = map.get(r.group) ?? [];
      g.push(r);
      map.set(r.group, g);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered, selectedGroup]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="safe-top" />
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('nav.recipes')}
          </h1>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100 dark:border-gray-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" className="text-gray-400 flex-shrink-0">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('recipeList.searchPlaceholder')}
              className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm outline-none placeholder:text-gray-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        {allGroups.length > 0 && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
            <CategoryChip
              label="Alle"
              active={selectedGroup === null}
              onClick={() => setSelectedGroup(null)}
              color={null}
            />
            {allGroups.map(g => (
              <CategoryChip
                key={g}
                label={g}
                active={selectedGroup === g}
                onClick={() => setSelectedGroup(g === selectedGroup ? null : g)}
                color={getCategoryColors(g)[0]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pb-28">
        {loading && recipes.length === 0 && (
          <div className="flex justify-center pt-20">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 mt-20">
            {t('recipeList.noResults')}
          </p>
        )}

        {/* Grouped grid (All view) */}
        {grouped && grouped.map(([group, items]) => (
          <div key={group} className="mb-2">
            <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              {group}
            </h2>
            <RecipeGrid recipes={items} onSelect={id => navigate(`/recipe/${id}`)} />
          </div>
        ))}

        {/* Flat grid (filtered view) */}
        {!grouped && filtered.length > 0 && (
          <div className="mt-2">
            <RecipeGrid recipes={filtered} onSelect={id => navigate(`/recipe/${id}`)} />
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeGrid({ recipes, onSelect }: { recipes: RecipeMeta[]; onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 px-4">
      {recipes.map(recipe => (
        <RecipeCard key={recipe.id} recipe={recipe} onSelect={onSelect} />
      ))}
    </div>
  );
}

function RecipeCard({ recipe, onSelect }: { recipe: RecipeMeta; onSelect: (id: string) => void }) {
  const style = getCategoryStyle(recipe.group);
  return (
    <button
      onClick={() => onSelect(recipe.id)}
      className="relative h-36 rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform text-left"
      style={style}
    >
      {/* Decorative circles */}
      <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-3 bottom-4 w-16 h-16 rounded-full bg-white/10" />
      <div className="absolute left-3 -bottom-6 w-20 h-20 rounded-full bg-black/10" />

      {/* Content */}
      <div className="absolute inset-0 p-3 flex flex-col justify-end">
        <span className="text-white font-semibold text-sm leading-snug line-clamp-3" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
          {recipe.name}
        </span>
      </div>
    </button>
  );
}

function CategoryChip({
  label, active, onClick, color,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  color: string | null;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active
          ? 'text-white shadow-sm'
          : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
      }`}
      style={active ? { backgroundColor: color ?? '#E8642A' } : undefined}
    >
      {label}
    </button>
  );
}
