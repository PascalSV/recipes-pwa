import { openDB, type IDBPDatabase } from 'idb';
import type { Recipe, RecipeIndex, AuthSession, Prefs } from '../types';

const DB_NAME = 'recipes-pwa';
const DB_VERSION = 1;

type RecipesDB = {
  recipes: { key: string; value: Recipe; indexes: { group: string; updatedAt: string } };
  index: { key: string; value: RecipeIndex };
  auth: { key: string; value: AuthSession };
  prefs: { key: string; value: Prefs };
};

let _db: IDBPDatabase<RecipesDB> | null = null;

async function getDB(): Promise<IDBPDatabase<RecipesDB>> {
  if (_db) return _db;
  _db = await openDB<RecipesDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('recipes')) {
        const store = db.createObjectStore('recipes', { keyPath: 'id' });
        store.createIndex('group', 'group');
        store.createIndex('updatedAt', 'updatedAt');
      }
      if (!db.objectStoreNames.contains('index')) {
        db.createObjectStore('index');
      }
      if (!db.objectStoreNames.contains('auth')) {
        db.createObjectStore('auth');
      }
      if (!db.objectStoreNames.contains('prefs')) {
        db.createObjectStore('prefs');
      }
    },
  });
  return _db;
}

export async function getRecipeIndex(): Promise<RecipeIndex | undefined> {
  const db = await getDB();
  return db.get('index', 'singleton');
}

export async function saveRecipeIndex(index: RecipeIndex): Promise<void> {
  const db = await getDB();
  await db.put('index', index, 'singleton');
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  const db = await getDB();
  return db.get('recipes', id);
}

export async function saveRecipe(recipe: Recipe): Promise<void> {
  const db = await getDB();
  await db.put('recipes', recipe);
}

export async function getSession(): Promise<AuthSession | undefined> {
  const db = await getDB();
  return db.get('auth', 'session');
}

export async function saveSession(session: AuthSession): Promise<void> {
  const db = await getDB();
  await db.put('auth', session, 'session');
}

export async function clearSession(): Promise<void> {
  const db = await getDB();
  await db.delete('auth', 'session');
}

const DEFAULT_PREFS: Prefs = { language: 'de', theme: 'system', wakeLock: false };

export async function getPrefs(): Promise<Prefs> {
  const db = await getDB();
  const stored = await db.get('prefs', 'singleton');
  return stored ?? DEFAULT_PREFS;
}

export async function savePrefs(prefs: Prefs): Promise<void> {
  const db = await getDB();
  await db.put('prefs', prefs, 'singleton');
  // Mirror theme to localStorage for the flash-prevention script
  try {
    const existing = JSON.parse(localStorage.getItem('recipes-prefs') ?? '{}');
    localStorage.setItem('recipes-prefs', JSON.stringify({ ...existing, theme: prefs.theme }));
    localStorage.setItem('recipes-lang', prefs.language);
  } catch (_) {}
}
