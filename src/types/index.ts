export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'tbsp' | 'tsp' | 'cup' | 'piece';

export interface Ingredient {
  amount: number;
  unit?: Unit;
  name: string;
  remark?: string;
}

export interface Recipe {
  id: string;
  name: string;
  group: string;
  defaultPortions: number;
  ingredients: Ingredient[];
  procedure: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeMeta {
  id: string;
  name: string;
  group: string;
  updatedAt: string;
}

export interface RecipeIndex {
  version: number;
  recipes: RecipeMeta[];
}

export type ThemePreference = 'light' | 'dark' | 'system';
export type Language = 'en' | 'de';

export interface Prefs {
  language: Language;
  theme: ThemePreference;
  wakeLock: boolean;
}

export interface AuthSession {
  user: string;
  token: string;
}

export interface ParsedRecipe {
  ingredients: Ingredient[];
  procedure: string[];
}
