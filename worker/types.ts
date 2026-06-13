export interface Env {
  RECIPES_BUCKET: R2Bucket;
  TOKEN_CLAUDIA: string;
  TOKEN_PASCAL: string;
  ALLOWED_USERS: string;
}

export type Unit = 'g' | 'kg' | 'ml' | 'l' | 'tbsp' | 'tsp' | 'cup' | 'piece';

export interface Ingredient {
  amount: number;
  unit?: Unit;
  name: string;
  remark?: string;
}

export interface IngredientSection {
  name: string;
  ingredients: Ingredient[];
}

export interface Recipe {
  id: string;
  name: string;
  group: string;
  defaultPortions: number;
  cookingTime?: number;  // minutes
  ingredients: Ingredient[];
  ingredientSections?: IngredientSection[];
  procedure: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecipeIndex {
  version: number;
  recipes: RecipeMeta[];
}

export interface RecipeMeta {
  id: string;
  name: string;
  group: string;
  updatedAt: string;
}

export interface Session {
  user: string;
  token: string;
}
