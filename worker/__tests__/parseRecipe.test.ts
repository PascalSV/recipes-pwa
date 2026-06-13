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
    expect(parseUnit('Prise')).toBe('prise');
  });

  it('maps English units', () => {
    expect(parseUnit('tbsp')).toBe('tbsp');
    expect(parseUnit('tsp')).toBe('tsp');
    expect(parseUnit('cup')).toBe('cup');
    expect(parseUnit('cups')).toBe('cup');
  });

  it('maps Päckchen variants to pck', () => {
    expect(parseUnit('Päckchen')).toBe('pck');
    expect(parseUnit('packchen')).toBe('pck');
    expect(parseUnit('pck')).toBe('pck');
    expect(parseUnit('Pkt')).toBe('pck');
  });

  it('maps Prise variants to prise (not piece)', () => {
    expect(parseUnit('Prise')).toBe('prise');
    expect(parseUnit('Prisen')).toBe('prise');
    expect(parseUnit('pinch')).toBe('prise');
  });

  it('maps Messerspitze to piece', () => {
    expect(parseUnit('Messerspitze')).toBe('piece');
    expect(parseUnit('messerspitzen')).toBe('piece');
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

// ---- parseRecipeText — Karamellisierter Reiskuchen (ingredient sections) ----

describe('parseRecipeText (Karamellisierter Reiskuchen)', () => {
  const REISKUCHEN = `Karamellisierter Reiskuchen
6 Portionen
Gesamtzeit: 125 Minuten
Schwierigkeitsgrad: Mittel
Nährwerte pro Portion
kcal
618
Eiweiß
10,07 g
Ballaststoffe
1,19 g
Fett
34,48 g
Zucker
34,26 g
Kohlenhydrate
66,88 g
Zutaten
Für den Teig
1 Prise
Salz
0,5 Teelöffel
Zitrone Schalenabrieb
75 Gramm
Zucker
125 Gramm
Butter
1
Ei
200 Gramm
Mehl
Für den Belag
125 Gramm
Rundkornreis
1 Päckchen
Vanillezucker
75 Gramm
Zucker
2 Esslöffel
Zucker, braun
20 Gramm
Butter
2
Eier
400 Milliliter
Milch
Fett für die Form
Für den Belag
40 Gramm
Butter
Mehl zum Ausrollen
Zubereitung

    Für den Teig das Mehl mit dem Zucker, Zitronenabrieb und Salz mischen, auf eine Arbeitsfläche häufeln, in die Mitte eine Mulde drücken, das Ei hineinschlagen und die Butter in Flöckchen um die Mulde herum verteilen. Mit einem Messer sämtliche Zutaten krümelig hacken und mit den Händen rasch zu einem glatten Teig verarbeiten. Zu einer Kugel formen und in Frischhaltefolie gewickelt für 30 Minuten in den Kühlschrank legen. Den Backofen auf 180°C Ober- und Unterhitze vorheizen.
    Die Milch mit der Butter, dem Zucker und Vanillezucker in einem Topf zum Kochen bringen, den Reis einrieseln lassen und bei kleiner Hitze und gelegentlichem Umrühren ca. 30 Minuten quellen lassen.
    Eine Tarte- oder Springform einfetten. Den Mürbteig auf leicht bemehlter Fläche rund etwas größer als die Form ausrollen. Die Backform damit auskleiden und den Rand mit den Fingern hochziehen. Den Teigboden mehrmals mit einer Gabel einstechen.
    Die Eier trennen und das Eiweiß zu steifem Schnee schlagen. Erst die Eigelbe unter den abgekühlten Milchreis rühren, dann den Eischnee unterheben. Den Reisbrei auf den Mürbteigboden verteilen und im Ofen ca. 45 Minuten backen.
    Für eine leicht karamellisierte Kruste den Reiskuchen zum Schluss mit braunem Zucker bestreuen, Butterflöckchen darauf verteilen, den Backofengrill einschalten und den Zucker in 3 bis 5 Minuten leicht karamellisieren lassen. Die Tarte in Stücke geschnitten servieren.`;

  it('extracts recipe name', () => {
    expect(parseRecipeText(REISKUCHEN).name).toBe('Karamellisierter Reiskuchen');
  });

  it('extracts cookingTime = 125', () => {
    expect(parseRecipeText(REISKUCHEN).cookingTime).toBe(125);
  });

  it('extracts defaultPortions = 6', () => {
    expect(parseRecipeText(REISKUCHEN).defaultPortions).toBe(6);
  });

  it('does not include nutritional values as ingredients', () => {
    const { ingredients } = parseRecipeText(REISKUCHEN);
    expect(ingredients.find((i) => i.name === 'kcal')).toBeUndefined();
    expect(ingredients.find((i) => i.name === 'Eiweiß')).toBeUndefined();
    expect(ingredients.find((i) => i.name === 'Fett')).toBeUndefined();
  });

  it('produces ingredientSections (not just flat ingredients)', () => {
    const { ingredientSections } = parseRecipeText(REISKUCHEN);
    expect(ingredientSections).toBeDefined();
  });

  it('has 4 sections total: one empty default, then Für den Teig and twice Für den Belag', () => {
    const { ingredientSections } = parseRecipeText(REISKUCHEN);
    expect(ingredientSections).toHaveLength(4);
    expect(ingredientSections![0].name).toBe('');           // empty default before first header
    expect(ingredientSections![1].name).toBe('Für den Teig');
    expect(ingredientSections![2].name).toBe('Für den Belag');
    expect(ingredientSections![3].name).toBe('Für den Belag');
  });

  it('"Für den Teig" section has 6 ingredients', () => {
    const { ingredientSections } = parseRecipeText(REISKUCHEN);
    const teig = ingredientSections!.find((s) => s.name === 'Für den Teig')!;
    expect(teig.ingredients).toHaveLength(6);
  });

  it('"Für den Teig" contains Salz, Butter, Ei, Mehl', () => {
    const { ingredientSections } = parseRecipeText(REISKUCHEN);
    const teig = ingredientSections!.find((s) => s.name === 'Für den Teig')!;
    const names = teig.ingredients.map((i) => i.name);
    expect(names).toContain('Salz');
    expect(names).toContain('Butter');
    expect(names).toContain('Mehl');
    expect(names.some((n) => n.includes('Ei'))).toBe(true);
  });

  it('first "Für den Belag" section has 8 ingredients including Fett für die Form (free-form)', () => {
    const { ingredientSections } = parseRecipeText(REISKUCHEN);
    const belag = ingredientSections!.filter((s) => s.name === 'Für den Belag')[0];
    expect(belag.ingredients).toHaveLength(8);
    expect(belag.ingredients.find((i) => i.name === 'Fett für die Form')).toBeDefined();
    expect(belag.ingredients.find((i) => i.name === 'Fett für die Form')!.amount).toBe(0);
  });

  it('second "Für den Belag" section has 2 ingredients: Butter and Mehl zum Ausrollen', () => {
    const { ingredientSections } = parseRecipeText(REISKUCHEN);
    const belag2 = ingredientSections!.filter((s) => s.name === 'Für den Belag')[1];
    expect(belag2.ingredients).toHaveLength(2);
    expect(belag2.ingredients[0]).toMatchObject({ amount: 40, unit: 'g', name: 'Butter' });
    expect(belag2.ingredients[1]).toMatchObject({ amount: 0, name: 'Mehl zum Ausrollen' });
  });

  it('parses Vanillezucker as 1 Päckchen (unit: pck)', () => {
    const { ingredients } = parseRecipeText(REISKUCHEN);
    const vanille = ingredients.find((i) => i.name === 'Vanillezucker');
    expect(vanille).toBeDefined();
    expect(vanille!.amount).toBe(1);
    expect(vanille!.unit).toBe('pck');
  });

  it('flat ingredients array includes all items from all sections', () => {
    const { ingredients, ingredientSections } = parseRecipeText(REISKUCHEN);
    const totalFromSections = ingredientSections!.reduce((n, s) => n + s.ingredients.length, 0);
    expect(ingredients).toHaveLength(totalFromSections);
  });

  it('Palocleves (no sub-sections) produces no ingredientSections', () => {
    const flat = parseRecipeText(`Palocleves
Zutaten
500 Gramm
Kartoffeln, festkochend
2
Zwiebeln
Salz
Zubereitung
Alles kochen.`);
    expect(flat.ingredientSections).toBeUndefined();
  });
});

// ---- 1a Guacamole-Dip (Chefkoch.de format) ----

describe('1a Guacamole-Dip', () => {
  const GUACAMOLE = `1a Guacamole-Dip
Herrlich frischer Avocado - Dip für viele Gelegenheiten
Nährwerte pro Portion
377 kcal
Energie
7.07 g
Eiweiß
29.95 g
Fett
18.26 g
Kohlenhydrate
Zutaten
Für 1 Portion
2
\t
Avocado(s)reife
2
\t
Tomate(n)
0.5
\t
Zitrone(n), Saft davon
2
\t
Knoblauchzehe(n)
1 EL
\t
Naturjoghurt
\t
Salz und Pfeffer, schwarzer
Bring! Logo Auf die Einkaufsliste setzen
Zubereitung

10 Min.
Gesamtzeit

10 Min.
Arbeitszeit
1

Die Avocados halbieren, den Kern entfernen. Mit einem Löffel das Fruchtfleisch herauslösen und mit einer Gabel zu feinem Mus zerdrücken. Die Tomaten sehr fein würfeln und den Knoblauch durchpressen oder sehr fein hacken. Tomaten, Zitronensaft, Knoblauch und Joghurt zum Avocadomus geben und alles miteinander verrühren. Mit Salz und Pfeffer abschmecken.

Schmeckt gut zu Kartoffelecken, auf Tortillas und zu allem, was man dippen kann.

Tipp: Wer mag, kann die Tomatenkerne entfernen, so wie es im Video gezeigt wird.

Hinweis vom Chefkoch-Team: Die Mengenangabe bezieht sich auf 1 Dip.`;

  const r = parseRecipeText(GUACAMOLE);

  it('extracts recipe name', () => {
    expect(r.name).toBe('1a Guacamole-Dip');
  });

  it('extracts cookingTime 10 from standalone "10 Min." line', () => {
    expect(r.cookingTime).toBe(10);
  });

  it('extracts defaultPortions 1 from "Für 1 Portion"', () => {
    expect(r.defaultPortions).toBe(1);
  });

  it('"Für 1 Portion" is not a section header — no ingredientSections', () => {
    expect(r.ingredientSections).toBeUndefined();
  });

  it('has 6 ingredients', () => {
    expect(r.ingredients).toHaveLength(6);
  });

  it('Avocado(s)reife → name: Avocados, remark: reife', () => {
    const avocado = r.ingredients[0];
    expect(avocado.amount).toBe(2);
    expect(avocado.name).toBe('Avocados');
    expect(avocado.remark).toBe('reife');
  });

  it('Tomate(n) → name: Tomaten, no remark', () => {
    const tomaten = r.ingredients[1];
    expect(tomaten.amount).toBe(2);
    expect(tomaten.name).toBe('Tomaten');
    expect(tomaten.remark).toBeUndefined();
  });

  it('Zitrone(n), Saft davon → name: Zitronen, remark: Saft davon', () => {
    const zitrone = r.ingredients[2];
    expect(zitrone.amount).toBe(0.5);
    expect(zitrone.name).toBe('Zitronen');
    expect(zitrone.remark).toBe('Saft davon');
  });

  it('Knoblauchzehe(n) → name: Knoblauchzehen', () => {
    const knobi = r.ingredients[3];
    expect(knobi.amount).toBe(2);
    expect(knobi.name).toBe('Knoblauchzehen');
  });

  it('1 EL Naturjoghurt → unit: tbsp', () => {
    const joghurt = r.ingredients[4];
    expect(joghurt.amount).toBe(1);
    expect(joghurt.unit).toBe('tbsp');
    expect(joghurt.name).toBe('Naturjoghurt');
  });

  it('"Bring! Logo Auf die Einkaufsliste setzen" is filtered out', () => {
    const names = r.ingredients.map((i) => i.name);
    expect(names.every((n) => !n.startsWith('Bring!'))).toBe(true);
  });

  it('procedure does not contain Tipp or Hinweis content', () => {
    const allText = r.procedure.join(' ');
    expect(allText).not.toContain('Tipp');
    expect(allText).not.toContain('Hinweis');
  });

  it('procedure contains the main cooking step', () => {
    const allText = r.procedure.join(' ');
    expect(allText).toContain('Avocados halbieren');
  });
});

// ---- Brezen - Servietten - Knödel (Chefkoch.de format) ----

describe('Brezen - Servietten - Knödel', () => {
  // Chefkoch ingredient tables separate name and remark with a tab character
  const BREZEN = `Brezen - Servietten - Knödel
Nährwerte pro Portion
-- kcal
Energie
-- g
Eiweiß
-- g
Fett
-- g
Kohlenhydrate
Zutaten
Für 4 Portionen
6
\t
Brezel(n)
1 kleine
\t
Zwiebel(n)
100 g
\t
Speck\tgeräuchert, in Würfeln
2 EL
\t
Butter
2 EL
\t
Petersilie\tgehackt
200 ml
\t
Milch
3
\t
Ei(er)
\t
Salz und Pfeffer
2
\t
Semmel(n)
\t
Muskat
\t
Majoran
Bring! Logo Auf die Einkaufsliste setzen
Zubereitung

35 Min.
Gesamtzeit

35 Min.
Arbeitszeit
1

Brezen und Semmeln in Scheiben schneiden. Die Hälfte der Brezen auf einem Backblech verteilen und mit Butterflocken belegen. Bei 180 Grad im Ofen rösten, bis sie schön hellbraun/rösch sind.
2

Zwiebel in feine Würfel schneiden, Speck in einer Pfanne anbraten, Zwiebel dazugeben und mit Salz, Pfeffer und Majoran würzen. Milch heiß werden lassen.
3

Rest der Brezen und die Semmeln in eine Schüssel geben. Milch und Speckzwiebel darüber schütten und 5 Minuten ziehen lassen. Die röschen Brezenscheibchen, die Eier und die Petersilie dazugeben. Mit Muskat und evt. Salz und Pfeffer würzen und gut durchmengen (nicht kneten), bis der Teig zu binden beginnt.
4

Ein sauberes Küchen-/Geschirrtuch nass machen, auswringen und auf dem Küchentisch ausbreiten. Die Masse am Rand der langen Seite draufgeben und grob eine Wurst mit etwa 8-9-cm-Durchmesser formen. Dann den Teig eng in das Tuch einrollen. An einer Seite mit Paketgarn zubinden und die Wurst mit etwa 5-6 Schlaufen Garn umwickeln. Auf der anderen Seite den anderen Zipfel zubinden. Jetzt müsste die Rolle schön stabil sein.
5

In kochendes Salzwasser (Bräter/Topf) einlegen. Den Herd zurückdrehen, sodass das Wasser siedet, aber nicht kocht. Etwa 40 Minuten darin garen. Aus dem Wasser nehmen, vom Tuch befreien und in Scheiben schneiden.
6

Passt zu Ragout, Gulasch, Braten und allem, zu dem man sonst Knödel, Klöße, Gnidla isst.`;

  const r = parseRecipeText(BREZEN);

  it('extracts recipe name', () => {
    expect(r.name).toBe('Brezen - Servietten - Knödel');
  });

  it('extracts cookingTime 35', () => {
    expect(r.cookingTime).toBe(35);
  });

  it('extracts defaultPortions 4', () => {
    expect(r.defaultPortions).toBe(4);
  });

  it('no ingredientSections — Für 4 Portionen is not a section header', () => {
    expect(r.ingredientSections).toBeUndefined();
  });

  it('has 11 ingredients', () => {
    expect(r.ingredients).toHaveLength(11);
  });

  it('Brezel(n) → Brezeln, amount 6', () => {
    const ing = r.ingredients[0];
    expect(ing.amount).toBe(6);
    expect(ing.name).toBe('Brezeln');
  });

  it('1 kleine Zwiebel(n) → amount 1, name contains Zwiebel', () => {
    const ing = r.ingredients[1];
    expect(ing.amount).toBe(1);
    expect(ing.name).toContain('Zwiebel');
  });

  it('Speck\\tgeräuchert, in Würfeln → name: Speck, remark: geräuchert, in Würfeln', () => {
    const ing = r.ingredients[2];
    expect(ing.amount).toBe(100);
    expect(ing.unit).toBe('g');
    expect(ing.name).toBe('Speck');
    expect(ing.remark).toBe('geräuchert, in Würfeln');
  });

  it('Petersilie\\tgehackt → name: Petersilie, remark: gehackt', () => {
    const ing = r.ingredients[4];
    expect(ing.name).toBe('Petersilie');
    expect(ing.remark).toBe('gehackt');
  });

  it('Ei(er) → Eier, amount 3', () => {
    const eier = r.ingredients.find(i => i.name === 'Eier');
    expect(eier?.amount).toBe(3);
  });

  it('Salz und Pfeffer is a free-form ingredient, not a section header', () => {
    const salzPfeffer = r.ingredients.find(i => i.name === 'Salz und Pfeffer');
    expect(salzPfeffer).toBeDefined();
    expect(salzPfeffer?.amount).toBe(0);
  });

  it('Semmel(n) → Semmeln, amount 2', () => {
    const ing = r.ingredients.find(i => i.name === 'Semmeln');
    expect(ing?.amount).toBe(2);
  });

  it('procedure has exactly 6 steps (one per numbered block)', () => {
    expect(r.procedure).toHaveLength(6);
  });

  it('step 3 is not split at "evt." — stays one step', () => {
    const step3 = r.procedure[2];
    expect(step3).toContain('evt.');
    expect(step3).toContain('Salz und Pfeffer würzen');
    expect(step3).toContain('nicht kneten');
  });

  it('procedure does not contain bare step numbers', () => {
    r.procedure.forEach(step => {
      expect(step).not.toMatch(/^\d+$/);
    });
  });

  it('step 1 is about Brezen und Semmeln', () => {
    expect(r.procedure[0]).toContain('Brezen und Semmeln');
  });
});
