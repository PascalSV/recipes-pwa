import type { Recipe, RecipeIndex } from '../types.ts';

export async function getIndex(bucket: R2Bucket): Promise<RecipeIndex> {
  const obj = await bucket.get('index.json');
  if (!obj) return { version: 1, recipes: [] };
  return obj.json<RecipeIndex>();
}

export async function getRecipe(bucket: R2Bucket, id: string): Promise<Recipe | null> {
  const obj = await bucket.get(`recipes/${id}.json`);
  if (!obj) return null;
  return obj.json<Recipe>();
}

export async function saveRecipe(bucket: R2Bucket, recipe: Recipe): Promise<void> {
  await bucket.put(`recipes/${recipe.id}.json`, JSON.stringify(recipe), {
    httpMetadata: { contentType: 'application/json' },
  });

  const index = await getIndex(bucket);
  const pos = index.recipes.findIndex(r => r.id === recipe.id);
  const meta = { id: recipe.id, name: recipe.name, group: recipe.group, updatedAt: recipe.updatedAt };
  if (pos >= 0) index.recipes[pos] = meta;
  else index.recipes.push(meta);

  await bucket.put('index.json', JSON.stringify(index), {
    httpMetadata: { contentType: 'application/json' },
  });
}
