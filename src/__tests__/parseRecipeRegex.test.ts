import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { parseRecipeWithRegex } from '../lib/parseRecipeRegex';

const fixture = readFileSync(
  join(__dirname, 'fixtures/bohnen-auflauf-raw.txt'),
  'utf-8'
);

describe('parseRecipeWithRegex — bohnen-auflauf fixture', () => {
  const result = parseRecipeWithRegex(fixture);

  it('extracts 15 ingredients', () => {
    expect(result.ingredients).toHaveLength(15);
  });

  it('ingredient 1: correct amount, unit, name, remark — weight note discarded', () => {
    const ing = result.ingredients[0];
    expect(ing.amount).toBe(480);
    expect(ing.unit).toBe('g');
    expect(ing.name).toContain('Cannellini');
    expect(ing.remark).toBe('abgetropft und abgespült');
    expect(ing.remark).not.toContain('800');
  });

  it('ingredient 2: range resolved to higher value (400)', () => {
    expect(result.ingredients[1].amount).toBe(400);
    expect(result.ingredients[1].unit).toBe('g');
    expect(result.ingredients[1].name).toBe('Dosentomaten');
  });

  it('ingredient 3: EL mapped to tbsp', () => {
    const ing = result.ingredients[2];
    expect(ing.unit).toBe('tbsp');
    expect(ing.name).toBe('Olivenöl');
  });

  it('ingredient 4: countable — no unit, remark extracted', () => {
    const ing = result.ingredients[3];
    expect(ing.unit).toBeUndefined();
    expect(ing.name).toBe('Zwiebel');
    expect(ing.remark).toBe('gehackt');
  });

  it('ingredient 7+8: compound line split into two TL entries', () => {
    const kreuzkümmel = result.ingredients.find(i => i.name.includes('Kreuzkümmelsamen'));
    const koriander   = result.ingredients.find(i => i.name.includes('Koriandersamen'));
    expect(kreuzkümmel).toBeDefined();
    expect(koriander).toBeDefined();
    expect(kreuzkümmel!.unit).toBe('tsp');
    expect(koriander!.unit).toBe('tsp');
    expect(kreuzkümmel!.remark).toBe('im Mörser zerstoßen');
    expect(koriander!.remark).toBe('im Mörser zerstoßen');
  });

  it('ingredient 15: range 1-2 → 2, no unit', () => {
    const ing = result.ingredients[14];
    expect(ing.amount).toBe(2);
    expect(ing.unit).toBeUndefined();
    expect(ing.name).toContain('Brotscheiben');
  });

  it('extracts procedure steps (at least 2)', () => {
    expect(result.procedure.length).toBeGreaterThanOrEqual(2);
  });

  it('procedure contains no noise lines', () => {
    for (const step of result.procedure) {
      expect(step).not.toContain('Mehr zum Thema');
      expect(step).not.toContain('Katrin kocht');
      expect(step).not.toContain('Rezept für');
    }
  });
});

describe('parseRecipeWithRegex — unit detection', () => {
  it('detects g', () => {
    const r = parseRecipeWithRegex('200 g Mehl');
    expect(r.ingredients[0]).toMatchObject({ amount: 200, unit: 'g', name: 'Mehl' });
  });

  it('detects TL → tsp', () => {
    const r = parseRecipeWithRegex('2 TL Salz');
    expect(r.ingredients[0]).toMatchObject({ amount: 2, unit: 'tsp', name: 'Salz' });
  });

  it('detects EL → tbsp', () => {
    const r = parseRecipeWithRegex('3 EL Olivenöl');
    expect(r.ingredients[0]).toMatchObject({ amount: 3, unit: 'tbsp', name: 'Olivenöl' });
  });

  it('omits unit for countable items', () => {
    const r = parseRecipeWithRegex('4 Eier');
    expect(r.ingredients[0].unit).toBeUndefined();
    expect(r.ingredients[0].name).toBe('Eier');
  });

  it('handles decimal amounts', () => {
    const r = parseRecipeWithRegex('1,5 kg Kartoffeln');
    expect(r.ingredients[0].amount).toBe(1.5);
    expect(r.ingredients[0].unit).toBe('kg');
  });
});
