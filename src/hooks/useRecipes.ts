import { useState, useEffect, useCallback } from 'react';
import type { RecipeMeta } from '../types';
import { getRecipeIndex, saveRecipeIndex } from '../lib/db';
import { fetchRecipeIndex } from '../lib/api';

export function useRecipes(token: string) {
  const [recipes, setRecipes] = useState<RecipeMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // Show cached data immediately
    const cached = await getRecipeIndex();
    if (cached) {
      setRecipes(cached.recipes);
      setLoading(false);
    }
    // Then refresh from network
    try {
      const fresh = await fetchRecipeIndex(token);
      await saveRecipeIndex(fresh);
      setRecipes(fresh.recipes);
    } catch (e) {
      if (!cached) setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  return { recipes, loading, error, refresh: load };
}
