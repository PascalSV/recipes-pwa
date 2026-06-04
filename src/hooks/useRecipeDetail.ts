import { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { getRecipe, saveRecipe } from '../lib/db';
import { fetchRecipe } from '../lib/api';

export function useRecipeDetail(id: string, token: string) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const cached = await getRecipe(id);
        if (cached && !cancelled) setRecipe(cached);

        const fresh = await fetchRecipe(id, token);
        if (!cancelled) {
          // Only update if newer or not cached
          if (!cached || fresh.updatedAt > cached.updatedAt) {
            await saveRecipe(fresh);
            setRecipe(fresh);
          }
        }
      } catch (e) {
        if (!cancelled && !recipe) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id, token]);

  return { recipe, loading, error };
}
