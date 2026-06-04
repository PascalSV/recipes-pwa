import { describe, it, expect } from 'vitest';
import { formatAmount, scaleAmount, formatIngredientLine } from '../lib/shareIngredients';
import type { Ingredient } from '../types';

describe('scaleAmount', () => {
  it('scales proportionally', () => {
    expect(scaleAmount(200, 4, 2)).toBe(100);
    expect(scaleAmount(200, 4, 6)).toBe(300);
    expect(scaleAmount(200, 4, 4)).toBe(200);
  });

  it('handles fractional results', () => {
    expect(scaleAmount(100, 3, 1)).toBeCloseTo(33.33, 1);
  });
});

describe('formatAmount', () => {
  it('drops trailing zero decimal', () => {
    expect(formatAmount(100)).toBe('100');
    expect(formatAmount(100.0)).toBe('100');
  });

  it('keeps one decimal place when needed', () => {
    expect(formatAmount(33.3)).toBe('33.3');
    expect(formatAmount(1.5)).toBe('1.5');
  });

  it('rounds to 1 decimal', () => {
    expect(formatAmount(33.33)).toBe('33.3');
  });
});

describe('formatIngredientLine', () => {
  it('formats with unit', () => {
    const ing: Ingredient = { amount: 200, unit: 'g', name: 'Pasta' };
    const line = formatIngredientLine(ing, 4, 4);
    expect(line).toContain('200');
    expect(line).toContain('Pasta');
  });

  it('omits unit when absent', () => {
    const ing: Ingredient = { amount: 1, name: 'Zwiebel' };
    const line = formatIngredientLine(ing, 4, 4);
    expect(line).toBe('1 Zwiebel');
  });

  it('appends remark in parentheses', () => {
    const ing: Ingredient = { amount: 1, name: 'Zwiebel', remark: 'gehackt' };
    const line = formatIngredientLine(ing, 4, 4);
    expect(line).toBe('1 Zwiebel (gehackt)');
  });

  it('scales amount when portions change', () => {
    const ing: Ingredient = { amount: 400, unit: 'g', name: 'Dosentomaten' };
    const line = formatIngredientLine(ing, 4, 2);
    expect(line).toContain('200');
  });
});
