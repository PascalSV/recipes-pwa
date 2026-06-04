import type { Ingredient, Unit } from '../types';
import i18n from '../i18n';

function scaleAmount(amount: number, defaultPortions: number, currentPortions: number): number {
  return (amount / defaultPortions) * currentPortions;
}

function formatAmount(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
}

function formatIngredientLine(ing: Ingredient, defaultPortions: number, currentPortions: number): string {
  const amount = formatAmount(scaleAmount(ing.amount, defaultPortions, currentPortions));
  const unit = ing.unit ? i18n.t(`units.${ing.unit}` as `units.${Unit}`) : null;
  const parts = [amount, unit, ing.name].filter(Boolean).join(' ');
  return ing.remark ? `${parts} (${ing.remark})` : parts;
}

export async function shareIngredients(
  ingredients: Ingredient[],
  defaultPortions: number,
  currentPortions: number,
  recipeName: string
): Promise<void> {
  const lines = ingredients.map(ing =>
    formatIngredientLine(ing, defaultPortions, currentPortions)
  );
  const text = lines.join('\n');

  if (navigator.share) {
    await navigator.share({ title: recipeName, text });
  } else {
    await navigator.clipboard.writeText(text);
  }
}

export { formatAmount, scaleAmount, formatIngredientLine };
