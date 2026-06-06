import { describe, it, expect } from 'vitest';
import {
  parseUnit,
  parseAmount,
  extractRemark,
  splitCompound,
  parseIngredientLine,
  extractCookingTime,
  isNoise,
  isProcedureLine,
  parseRecipeText,
} from '../lib/parseRecipe.ts';

// ---- parseUnit ----

describe('parseUnit', () => {
  it('maps German abbreviations', () => {
    expect(parseUnit('EL')).toBe('tbsp');
    expect(parseUnit('TL')).toBe('tsp');
    expect(parseUnit('g')).toBe('g');
    expect(parseUnit('kg')).toBe('kg');
    expect(parseUnit('ml')).toBe('ml');
    expect(parseUnit('l')).toBe('l');
    expect(parseUnit('Tasse')).toBe('cup');
    expect(parseUnit('Stk')).toBe('piece');
    expect(parseUnit('Zehe')).toBe('piece');
    expect(parseUnit('Prise')).toBe('piece');
  });

  it('maps English units', () => {
    expect(parseUnit('tbsp')).toBe('tbsp');
    expect(parseUnit('tsp')).toBe('tsp');
    expect(parseUnit('cup')).toBe('cup');
    expect(parseUnit('cups')).toBe('cup');
  });

  it('is case-insensitive', () => {
    expect(parseUnit('G')).toBe('g');
    expect(parseUnit('ML')).toBe('ml');
    expect(parseUnit('TASSE')).toBe('cup');
  });

  it('returns undefined for unknown units', () => {
    expect(parseUnit('xyz')).toBeUndefined();
    expect(parseUnit('')).toBeUndefined();
  });
});

// ---- parseAmount ----

describe('parseAmount', () => {
  it('parses plain integers', () => {
    expect(parseAmount('3')).toBe(3);
    expect(parseAmount('100')).toBe(100);
  });

  it('parses decimals with dot and comma', () => {
    expect(parseAmount('1.5')).toBe(1.5);
    expect(parseAmount('1,5')).toBe(1.5);
  });

  it('parses unicode fractions alone', () => {
    expect(parseAmount('½')).toBe(0.5);
    expect(parseAmount('¼')).toBe(0.25);
    expect(parseAmount('¾')).toBe(0.75);
    expect(parseAmount('⅓')).toBeCloseTo(1 / 3);
  });

  it('parses mixed numbers like 1½', () => {
    expect(parseAmount('1½')).toBe(1.5);
    expect(parseAmount('2¾')).toBe(2.75);
  });

  it('parses ASCII fractions', () => {
    expect(parseAmount('1/2')).toBe(0.5);
    expect(parseAmount('3/4')).toBe(0.75);
  });

  it('takes the higher value for ranges', () => {
    expect(parseAmount('350 bis 400')).toBe(400);
    expect(parseAmount('2-3')).toBe(3);
  });
});

// ---- extractRemark ----

describe('extractRemark', () => {
  it('returns remark from trailing parenthetical', () => {
    expect(extractRemark('Knoblauch (gehackt)')).toEqual({ name: 'Knoblauch', remark: 'gehackt' });
  });

  it('discards weight clarifications', () => {
    const result = extractRemark('Tomaten (800 g mit Flüssigkeit)');
    expect(result.remark).toBeUndefined();
  });

  it('extracts comma-separated description as remark', () => {
    expect(extractRemark('Kartoffeln, festkochend')).toEqual({ name: 'Kartoffeln', remark: 'festkochend' });
  });

  it('extracts multi-word comma description as remark', () => {
    expect(extractRemark('Pfefferkörner, schwarz aus der Mühle')).toEqual({
      name: 'Pfefferkörner',
      remark: 'schwarz aus der Mühle',
    });
  });

  it('extracts comma description for colour adjective', () => {
    expect(extractRemark('Bohnen, grün')).toEqual({ name: 'Bohnen', remark: 'grün' });
  });

  it('returns the name unchanged when no parens or comma', () => {
    expect(extractRemark('Mehl')).toEqual({ name: 'Mehl' });
    expect(extractRemark('Saure Sahne')).toEqual({ name: 'Saure Sahne' });
  });
});

// ---- splitCompound ----

describe('splitCompound', () => {
  it('splits "2 TL A und 2 TL B"', () => {
    const parts = splitCompound('2 TL Salz und 2 TL Pfeffer');
    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatch(/Salz/);
    expect(parts[1]).toMatch(/Pfeffer/);
  });

  it('propagates shared trailing remark to last part', () => {
    const parts = splitCompound('2 TL Salz und 2 TL Pfeffer (frisch gemahlen)');
    expect(parts[1]).toContain('(frisch gemahlen)');
    expect(parts[0]).not.toContain('frisch gemahlen');
  });

  it('returns the line unchanged when no compound', () => {
    expect(splitCompound('200 g Mehl')).toEqual(['200 g Mehl']);
  });

  it('does not split when parts lack amounts', () => {
    expect(splitCompound('Salz und Pfeffer nach Geschmack')).toHaveLength(1);
  });
});

// ---- parseIngredientLine ----

describe('parseIngredientLine', () => {
  it('parses a basic gram ingredient', () => {
    expect(parseIngredientLine('200 g Mehl')).toEqual({ amount: 200, unit: 'g', name: 'Mehl' });
  });

  it('parses tablespoon with German abbreviation', () => {
    expect(parseIngredientLine('2 EL Olivenöl')).toEqual({ amount: 2, unit: 'tbsp', name: 'Olivenöl' });
  });

  it('parses teaspoon', () => {
    expect(parseIngredientLine('1 TL Salz')).toEqual({ amount: 1, unit: 'tsp', name: 'Salz' });
  });

  it('parses a countable without unit', () => {
    const result = parseIngredientLine('3 Eier');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(3);
    expect(result!.name).toBe('Eier');
    expect(result!.unit).toBeUndefined();
  });

  it('parses with remark', () => {
    expect(parseIngredientLine('2 Zehen Knoblauch (gepresst)')).toMatchObject({
      amount: 2,
      unit: 'piece',
      name: 'Knoblauch',
      remark: 'gepresst',
    });
  });

  it('handles ca. prefix', () => {
    const result = parseIngredientLine('ca. 500 g Kartoffeln');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(500);
  });

  it('handles unicode fraction', () => {
    const result = parseIngredientLine('½ TL Zimt');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(0.5);
    expect(result!.unit).toBe('tsp');
  });

  it('handles range and takes higher value', () => {
    const result = parseIngredientLine('350 bis 400 g Mehl');
    expect(result).not.toBeNull();
    expect(result!.amount).toBe(400);
  });

  it('returns null for non-ingredient lines', () => {
    expect(parseIngredientLine('Den Teig 30 Minuten ruhen lassen.')).toBeNull();
    expect(parseIngredientLine('Zubereitung')).toBeNull();
  });
});

// ---- extractCookingTime ----

describe('extractCookingTime', () => {
  it('parses "Gesamtzeit: 120 Minuten"', () => {
    expect(extractCookingTime('Gesamtzeit: 120 Minuten')).toBe(120);
  });

  it('parses hours', () => {
    expect(extractCookingTime('Kochzeit: 2 Stunden')).toBe(120);
  });

  it('parses hours + minutes', () => {
    expect(extractCookingTime('Zubereitungszeit: 1 Stunde 30 Minuten')).toBe(90);
  });

  it('parses decimal hours', () => {
    expect(extractCookingTime('Garzeit: ca. 1,5 Stunden')).toBe(90);
  });

  it('parses plain minutes number', () => {
    expect(extractCookingTime('Backzeit: 45 Min.')).toBe(45);
  });

  it('returns undefined for non-time lines', () => {
    expect(extractCookingTime('200 g Mehl')).toBeUndefined();
    expect(extractCookingTime('Schwierigkeitsgrad: Mittel')).toBeUndefined();
  });
});

// ---- isNoise ----

describe('isNoise', () => {
  it('filters section headers', () => {
    expect(isNoise('Zutaten')).toBe(true);
    expect(isNoise('Zubereitung')).toBe(true);
    expect(isNoise('Ingredients')).toBe(true);
  });

  it('filters Schwierigkeitsgrad', () => {
    expect(isNoise('Schwierigkeitsgrad: Mittel')).toBe(true);
    expect(isNoise('Schwierigkeitsgrad: Einfach')).toBe(true);
  });

  it('filters URLs', () => {
    expect(isNoise('https://example.com/recipe')).toBe(true);
  });

  it('filters too-short lines', () => {
    expect(isNoise('')).toBe(true);
    expect(isNoise('A')).toBe(true);
  });

  it('passes normal ingredient/procedure lines', () => {
    expect(isNoise('200 g Mehl')).toBe(false);
    expect(isNoise('Den Ofen auf 180°C vorheizen.')).toBe(false);
  });
});

// ---- isProcedureLine ----

describe('isProcedureLine', () => {
  it('accepts long non-ingredient lines', () => {
    expect(isProcedureLine('Den Ofen auf 180°C vorheizen.')).toBe(true);
    expect(isProcedureLine('Alles gut vermischen und 30 Minuten ruhen lassen.')).toBe(true);
  });

  it('rejects ingredient lines', () => {
    expect(isProcedureLine('200 g Mehl')).toBe(false);
  });

  it('rejects noise', () => {
    expect(isProcedureLine('Zutaten')).toBe(false);
  });

  it('rejects short lines', () => {
    expect(isProcedureLine('OK')).toBe(false);
  });
});

// ---- parseRecipeText (integration) ----

describe('parseRecipeText', () => {
  const SAMPLE = `
Zutaten

200 g Mehl
3 Eier
½ TL Salz
2 EL Olivenöl
350 bis 400 g Hackfleisch
2 Zehen Knoblauch (gepresst)
1 Dose Tomaten (800 g mit Flüssigkeit)

Zubereitung

Den Ofen auf 180°C vorheizen. Eine Auflaufform einfetten.
Alle Zutaten vermengen und in die Form geben. Im vorgeheizten Ofen 35 Minuten backen.
`;

  it('extracts expected number of ingredients', () => {
    const { ingredients } = parseRecipeText(SAMPLE);
    expect(ingredients.length).toBeGreaterThanOrEqual(6);
  });

  it('parses Mehl correctly', () => {
    const { ingredients } = parseRecipeText(SAMPLE);
    const mehl = ingredients.find((i) => i.name === 'Mehl');
    expect(mehl).toMatchObject({ amount: 200, unit: 'g' });
  });

  it('parses unicode fraction ingredient', () => {
    const { ingredients } = parseRecipeText(SAMPLE);
    const salz = ingredients.find((i) => i.name === 'Salz');
    expect(salz).toMatchObject({ amount: 0.5, unit: 'tsp' });
  });

  it('takes higher value of range', () => {
    const { ingredients } = parseRecipeText(SAMPLE);
    const hack = ingredients.find((i) => i.name === 'Hackfleisch');
    expect(hack?.amount).toBe(400);
  });

  it('extracts remark for Knoblauch', () => {
    const { ingredients } = parseRecipeText(SAMPLE);
    const knoblauch = ingredients.find((i) => i.name === 'Knoblauch');
    expect(knoblauch?.remark).toBe('gepresst');
  });

  it('discards weight clarification remark for Tomaten', () => {
    const { ingredients } = parseRecipeText(SAMPLE);
    const tomaten = ingredients.find((i) => i.name.includes('Tomaten'));
    expect(tomaten?.remark).toBeUndefined();
  });

  it('ignores section headers', () => {
    const { ingredients } = parseRecipeText(SAMPLE);
    expect(ingredients.find((i) => i.name === 'Zutaten')).toBeUndefined();
    expect(ingredients.find((i) => i.name === 'Zubereitung')).toBeUndefined();
  });

  it('extracts procedure steps', () => {
    const { procedure } = parseRecipeText(SAMPLE);
    expect(procedure.length).toBeGreaterThanOrEqual(1);
    expect(procedure.some((s) => s.includes('180°C'))).toBe(true);
  });

  it('returns empty arrays for blank input', () => {
    const result = parseRecipeText('   \n\n   ');
    expect(result.ingredients).toHaveLength(0);
    expect(result.procedure).toHaveLength(0);
  });

  it('handles compound ingredient line', () => {
    const text = '2 TL Salz und 2 TL Pfeffer\nDen Teig kneten und ruhen lassen, dann ausrollen.';
    const { ingredients } = parseRecipeText(text);
    expect(ingredients).toHaveLength(2);
    expect(ingredients[0].name).toBe('Salz');
    expect(ingredients[1].name).toBe('Pfeffer');
  });

  it('does not extract name when no section headers present', () => {
    const result = parseRecipeText('200 g Mehl\n3 Eier\nDen Ofen auf 180°C vorheizen.');
    expect(result.name).toBeUndefined();
  });
});

// ---- parseRecipeText — Palocleves real-world sample ----

describe('parseRecipeText (Palocleves)', () => {
  const PALOCLEVES = `
Palocleves (Ungarischer Eintopf) mit Lammfleisch
Gesamtzeit: 120 Minuten
Schwierigkeitsgrad: Mittel
Nährwerte pro Portion
kcal
525
Eiweiß
39,61 g
Ballaststoffe
8,5 g
Fett
21,75 g
Zucker
11,68 g
Kohlenhydrate
41,16 g
Zutaten
500 Gramm
Kartoffeln, festkochend
2
Zwiebeln
2
Knoblauchzehen
400 Gramm
Bohnen, grün
200 Gramm
Kirschpaprikas
1 Esslöffel
Senfkörner
1 Teelöffel
Kümmelsamen
1 Teelöffel
Koriandersamen
600 Gramm
Lammschulter
2 Esslöffel
Butterschmalz
2
Lorbeerblätter
150 Gramm
Saure Sahne
2 - 3 Teelöffel
Mehl
1 - 2 Esslöffel
Zitronensaft
Dillspitzen für die Garnitur
Pfefferkörner, schwarz aus der Mühle
Paprikapulver
Salz
Zubereitung

    Kartoffeln, Zwiebeln und Knoblauch schälen, die Kartoffeln in Würfel schneiden, Zwiebeln und Knoblauch fein hacken. Die Bohnen abbrausen und putzen. Die Kirschpaprika waschen. Senf, Kümmel und Koriander im Mörser zerstoßen. Das Fleisch trockentupfen und mundgerecht würfeln.
    Die Zwiebeln mit dem Knoblauch in einem Topf im heißen Schmalz glasig anschwitzen. Das Fleisch zugeben und leicht braun braten.
    Mit der Würzmischung, 2-3 TL Paprikapulver, Lorbeer, Salz und Pfeffer würzen und ca. 750 ml Wasser angießen. Die Kartoffeln zugeben und den Eintopf mit Deckel bei milder Hitze ca. 1,5 Stunden leise köcheln lassen. Dabei während der letzten ca. 20 Minuten die Bohnen und Kirschpaprika untermischen. Nach Bedarf noch Wasser nachgießen.
    100 g dem Sauerrahm mit dem Mehl verrühren und kurz vor dem Servieren unter den Eintopf mischen. Leicht binden lassen, mit Zitronensaft abschmecken und mit dem übrigen Sauerrahm garnieren.
    Mit etwas Paprikapulver und Dill bestreut servieren.
`;

  it('extracts recipe name', () => {
    const { name } = parseRecipeText(PALOCLEVES);
    expect(name).toBe('Palocleves (Ungarischer Eintopf) mit Lammfleisch');
  });

  it('extracts cookingTime = 120', () => {
    const { cookingTime } = parseRecipeText(PALOCLEVES);
    expect(cookingTime).toBe(120);
  });

  it('does not include nutritional values as ingredients', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    expect(ingredients.find((i) => i.name === 'kcal')).toBeUndefined();
    expect(ingredients.find((i) => i.name === 'Eiweiß')).toBeUndefined();
    expect(ingredients.find((i) => i.name === 'Ballaststoffe')).toBeUndefined();
    expect(ingredients.find((i) => i.name === 'g')).toBeUndefined();
  });

  it('does not include Schwierigkeitsgrad', () => {
    const { ingredients, procedure } = parseRecipeText(PALOCLEVES);
    const allText = [...ingredients.map((i) => i.name), ...procedure].join(' ');
    expect(allText).not.toMatch(/Schwierigkeitsgrad/i);
  });

  it('recipe name is not in procedure', () => {
    const { procedure } = parseRecipeText(PALOCLEVES);
    expect(procedure.every((s) => !s.includes('Palocleves'))).toBe(true);
  });

  it('parses Kartoffeln (500 Gramm) with remark "festkochend"', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    const kartoffeln = ingredients.find((i) => i.name === 'Kartoffeln');
    expect(kartoffeln).not.toBeUndefined();
    expect(kartoffeln!.amount).toBe(500);
    expect(kartoffeln!.unit).toBe('g');
    expect(kartoffeln!.remark).toBe('festkochend');
  });

  it('parses Lammschulter (600 g)', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    const lamm = ingredients.find((i) => i.name.toLowerCase().includes('lammschulter'));
    expect(lamm).not.toBeUndefined();
    expect(lamm!.amount).toBe(600);
  });

  it('parses Bohnen with remark "grün"', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    const bohnen = ingredients.find((i) => i.name === 'Bohnen');
    expect(bohnen).not.toBeUndefined();
    expect(bohnen!.amount).toBe(400);
    expect(bohnen!.unit).toBe('g');
    expect(bohnen!.remark).toBe('grün');
  });

  it('parses range ingredient — Mehl takes higher value (3 tsp)', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    const mehl = ingredients.find((i) => i.name === 'Mehl');
    expect(mehl).not.toBeUndefined();
    expect(mehl!.amount).toBe(3);
    expect(mehl!.unit).toBe('tsp');
  });

  it('parses range ingredient — Zitronensaft takes higher value (2 tbsp)', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    const zitrone = ingredients.find((i) => i.name === 'Zitronensaft');
    expect(zitrone).not.toBeUndefined();
    expect(zitrone!.amount).toBe(2);
    expect(zitrone!.unit).toBe('tbsp');
  });

  it('parses free-form ingredient Dillspitzen as ingredient (amount=0)', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    const dill = ingredients.find((i) => i.name.includes('Dillspitzen'));
    expect(dill).not.toBeUndefined();
    expect(dill!.amount).toBe(0);
  });

  it('parses free-form ingredient Pfefferkörner with comma remark', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    const pfeffer = ingredients.find((i) => i.name === 'Pfefferkörner');
    expect(pfeffer).not.toBeUndefined();
    expect(pfeffer!.amount).toBe(0);
    expect(pfeffer!.remark).toBe('schwarz aus der Mühle');
  });

  it('parses free-form ingredient Salz as ingredient (amount=0)', () => {
    const { ingredients } = parseRecipeText(PALOCLEVES);
    const salz = ingredients.find((i) => i.name === 'Salz');
    expect(salz).not.toBeUndefined();
    expect(salz!.amount).toBe(0);
  });

  it('Dillspitzen and Pfefferkörner are NOT in procedure', () => {
    const { procedure } = parseRecipeText(PALOCLEVES);
    expect(procedure.every((s) => !s.includes('Dillspitzen'))).toBe(true);
    expect(procedure.every((s) => !s.includes('Pfefferkörner, schwarz aus der Mühle'))).toBe(true);
  });

  it('extracts procedure steps', () => {
    const { procedure } = parseRecipeText(PALOCLEVES);
    expect(procedure.length).toBeGreaterThanOrEqual(3);
    expect(procedure.some((s) => s.includes('Knoblauch'))).toBe(true);
  });
});
