import type { RecipeIndex, Recipe, AuthSession, ParsedRecipe } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE ?? '';

async function apiFetch<T>(path: string, token: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options?.headers ?? {}),
    },
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`API ${path} → ${res.status}`, body);
    throw new Error(`HTTP_${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function login(user: string, token: string): Promise<AuthSession> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, token }),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(`HTTP_${res.status}`);
  return res.json() as Promise<AuthSession>;
}

export async function fetchRecipeIndex(token: string): Promise<RecipeIndex> {
  return apiFetch<RecipeIndex>('/api/recipes', token);
}

export async function fetchRecipe(id: string, token: string): Promise<Recipe> {
  return apiFetch<Recipe>(`/api/recipes/${id}`, token);
}

export async function saveRecipeToCloud(recipe: Recipe, token: string): Promise<void> {
  await apiFetch<void>(`/api/recipes/${recipe.id}`, token, {
    method: 'PUT',
    body: JSON.stringify(recipe),
  });
}

export async function parseRecipeText(text: string, token: string): Promise<ParsedRecipe> {
  return apiFetch<ParsedRecipe>('/api/recipes/parse', token, {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
