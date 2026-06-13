import type { Ingredient, IngredientSection, Unit } from '../types.ts';

// ---- Unit normalisation ----

const UNIT_MAP: Record<string, Unit> = {
  g: 'g', gr: 'g', gramm: 'g', gram: 'g',
  kg: 'kg', kilogramm: 'kg', kilogram: 'kg',
  ml: 'ml', milliliter: 'ml', millilitre: 'ml',
  l: 'l', liter: 'l', litre: 'l', lt: 'l',
  el: 'tbsp', esslöffel: 'tbsp', essloffel: 'tbsp', tablespoon: 'tbsp', tbsp: 'tbsp', tbs: 'tbsp',
  tl: 'tsp', teelöffel: 'tsp', teeloffel: 'tsp', teaspoon: 'tsp', tsp: 'tsp',
  tasse: 'cup', cup: 'cup', cups: 'cup', becher: 'cup',
  stk: 'piece', stück: 'piece', stuck: 'piece', st: 'piece',
  piece: 'piece', pieces: 'piece', pcs: 'piece',
  scheibe: 'piece', scheiben: 'piece',
  zehe: 'piece', zehen: 'piece',
  prise: 'prise', prisen: 'prise', pinch: 'prise',
  msp: 'piece', messerspitze: 'piece', messerspitzen: 'piece',
  pck: 'pck', päckchen: 'pck', packchen: 'pck', pkg: 'pck', pkt: 'pck',
};

export function parseUnit(raw: string): Unit | undefined {
  const key = raw.toLowerCase().replace(/\.$/, '');
  return UNIT_MAP[key];
}

// ---- Unicode fraction helpers ----

export const UNICODE_FRACTIONS: Record<string, number> = {
  '½': 0.5, '⅓': 1 / 3, '⅔': 2 / 3,
  '¼': 0.25, '¾': 0.75,
  '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
};

export function parseAmount(raw: string): number {
  if (UNICODE_FRACTIONS[raw.trim()]) return UNICODE_FRACTIONS[raw.trim()];

  const mixed = raw.match(/^(\d+)\s*([½⅓⅔¼¾⅛⅜⅝⅞])$/);
  if (mixed) return parseInt(mixed[1]) + UNICODE_FRACTIONS[mixed[2]];

  const frac = raw.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return parseInt(frac[1]) / parseInt(frac[2]);

  const range = raw.match(/(\d[\d.,]*)\s*(?:bis|-)\s*(\d[\d.,]*)/i);
  if (range) return parseFloat(range[2].replace(',', '.'));

  return parseFloat(raw.replace(',', '.')) || 0;
}

// ---- Ingredient line detection ----

const AMOUNT_TOKEN = /[½⅓⅔¼¾⅛⅜⅝⅞]|\d[\d.,]*(?:\s*(?:bis|-)\s*\d[\d.,]*)?(?:\s*[½⅓⅔¼¾⅛⅜⅝⅞])?|\d+\s*\/\s*\d+/;
export const INGR_LINE = new RegExp(`^\\s*(?:ca\\.?\\s*|~\\s*)?(${AMOUNT_TOKEN.source})\\s+\\S`);
const AMOUNT_EXTRACT = new RegExp(`^\\s*(?:ca\\.?\\s*|~\\s*)?(${AMOUNT_TOKEN.source})\\s+(.*)`);

// ---- Orphan amount line detection ----
//
// "500 Gramm\nKartoffeln" or "2\nZwiebeln" — amount/unit on one line, name on the next.

export function isOrphanAmountLine(line: string): boolean {
  const trimmed = line.trim();
  // Bare number (possibly a range), no unit or name
  if (/^(?:ca\.?\s*|~\s*)?\d[\d.,]*(?:\s*(?:bis|-)\s*\d[\d.,]*)?\s*$/.test(trimmed)) return true;
  // Amount + single word, nothing else
  const m = trimmed.match(AMOUNT_EXTRACT);
  if (!m) return false;
  const words = m[2].trim().split(/\s+/);
  if (words.length !== 1) return false;
  // Recognised unit ("1 EL") or lowercase-only adjective ("1 kleine") — name comes on next line
  return parseUnit(words[0]) !== undefined || /^[a-zäöüß]+$/.test(words[0]);
}

function joinOrphanAmountLines(lines: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isOrphanAmountLine(line) && i + 1 < lines.length && !isOrphanAmountLine(lines[i + 1])) {
      result.push(line.trim() + ' ' + lines[i + 1].trim());
      i += 2;
    } else {
      result.push(line);
      i++;
    }
  }
  return result;
}

// ---- Remark extraction ----

const WEIGHT_CLARIFICATION = /^\([\d,.]+\s*(?:g|kg|ml|l)\b/i;

export function extractRemark(nameRaw: string): { name: string; remark?: string } {
  const trimmed = nameRaw.trim();

  // German plural markers: Tomate(n) → Tomaten, Avocado(s)reife → Avocados, remark: reife
  // Must check before generic paren match so "(n)" isn't treated as a remark
  const pluralMatch = trimmed.match(/^(.+?)\((n|en|s|e|nen|er|es)\)(,?\s*(.+))?$/);
  if (pluralMatch) {
    const name = pluralMatch[1].trim() + pluralMatch[2];
    const remark = pluralMatch[4]?.trim();
    return remark ? { name, remark } : { name };
  }

  // Trailing parenthetical: "Knoblauch (gepresst)"
  const parenMatch = trimmed.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const remark = parenMatch[2].trim();
    // Discard weight/volume clarifications like "(800 g mit Flüssigkeit)"
    if (WEIGHT_CLARIFICATION.test(`(${remark}`)) return { name: trimmed };
    return { name: parenMatch[1].trim(), remark };
  }

  // Comma-separated description: "Kartoffeln, festkochend" → name + remark
  const commaIdx = trimmed.indexOf(',');
  if (commaIdx > 0) {
    const name = trimmed.slice(0, commaIdx).trim();
    const remark = trimmed.slice(commaIdx + 1).trim();
    if (name && remark) return { name, remark };
  }

  return { name: trimmed };
}

// ---- Compound line splitting ----

export function splitCompound(line: string): string[] {
  const trailingRemark = line.match(/\(([^)]+)\)\s*$/);
  const sharedRemark = trailingRemark ? ` (${trailingRemark[1]})` : '';
  const base = trailingRemark ? line.slice(0, trailingRemark.index).trim() : line;

  const parts = base.split(/\s+(?:und|and)\s+(?=\S)/i);
  if (parts.length === 1) return [line];

  const allHaveAmount = parts.every((p) => INGR_LINE.test(p.trim()));
  if (!allHaveAmount) return [line];

  return parts.map((p, i) => (i === parts.length - 1 ? p + sharedRemark : p));
}

// ---- Parse a single ingredient line ----

export function parseIngredientLine(line: string): Ingredient | null {
  const m = line.trim().match(AMOUNT_EXTRACT);
  if (!m) return null;

  const [, amountRaw, rest] = m;
  const amount = parseAmount(amountRaw);
  if (amount <= 0) return null;

  const words = rest.trim().split(/\s+/);
  const unit = parseUnit(words[0]);

  let nameRaw: string;
  if (unit && words.length > 1) {
    nameRaw = words.slice(1).join(' ');
  } else if (!unit) {
    nameRaw = rest.trim();
  } else {
    // unit present but nothing follows — not a valid ingredient (e.g. "39,61 g" nutrional value)
    return null;
  }

  const { name, remark } = extractRemark(nameRaw);
  if (!name) return null;

  const ing: Ingredient = { amount, name };
  if (unit) ing.unit = unit;
  if (remark) ing.remark = remark;
  return ing;
}

// ---- Cooking time extraction ----

const TIME_LINE = /zeit[^:]*:/i;
// Standalone duration like "10 Min." or "1 Std. 30 Min." on its own line (Chefkoch orphan format)
const STANDALONE_DURATION = /^\d[\d.,]*\s*(?:Stunden?|Std\.?)(?:\s+\d+\s*(?:Minuten?|Min\.?))?\s*$|^\d+\s*(?:Minuten?|Min\.?)\s*$/i;

function parseDuration(text: string): number {
  let minutes = 0;
  const hours = text.match(/(\d+(?:[,.]\d+)?)\s*(?:Stunden?|Std\.?|hrs?|h)\b/i);
  const mins  = text.match(/(\d+)\s*(?:Minuten?|Min\.?|min)\b/i);
  if (hours) minutes += parseFloat(hours[1].replace(',', '.')) * 60;
  if (mins)  minutes += parseInt(mins[1]);
  if (!hours && !mins) {
    const plain = text.match(/:\s*(?:ca\.?\s*)?(\d+)/);
    if (plain) minutes = parseInt(plain[1]);
  }
  return Math.round(minutes);
}

export function extractCookingTime(line: string): number | undefined {
  if (!TIME_LINE.test(line) && !STANDALONE_DURATION.test(line.trim())) return undefined;
  const t = parseDuration(line);
  return t > 0 ? t : undefined;
}

// ---- Portions extraction ----

const PORTIONS_LINE = /^(?:(?:für|for)\s+)?(\d+)\s*(?:Portion(?:en)?|Persons?|Servings?)\b/i;

export function extractPortions(line: string): number | undefined {
  const m = line.match(PORTIONS_LINE);
  return m ? parseInt(m[1], 10) : undefined;
}

// ---- Noise filter ----

const NOISE = /^(https?:\/\/|www\.|@|#|Portionen|Portions|Zutaten|Ingredients|Zubereitung|Preparation|Anleitung|Rezept|Recipe|Drucken|Print|Teilen|Share|Bewerten|Rate|Kommentar|Comment|Autor:|Author:|Quelle:|Source:|Foto:|Photo:|Bild:|Schwierigkeitsgrad|Bring!|Hinweis\b|Tipp\b)/i;
const TOO_SHORT = /^.{0,2}$/;

export function isNoise(line: string): boolean {
  return TOO_SHORT.test(line.trim()) || NOISE.test(line.trim());
}

// ---- Procedure detection (used in fallback path) ----

export function isProcedureLine(line: string): boolean {
  if (isNoise(line)) return false;
  if (INGR_LINE.test(line.trim())) return false;
  return line.trim().length > 15;
}

// ---- Procedure post-processing ----

function mergeProcedure(lines: string[]): string[] {
  if (lines.length === 0) return [];
  // Replace periods in common abbreviations with a placeholder so they don't trigger sentence splits
  const ABBREVS = /\b(ca|evt|evtl|bzw|usw|etc|ggf|sog|inkl|min|max)\./gi;
  const full = lines.join(' ').replace(ABBREVS, '$1\x00');
  const sentences = full
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/)
    .map((s) => s.replace(/\x00/g, '.').trim())
    .filter((s) => s.length > 0);
  return sentences;
}

// ---- Result type ----

export interface ParseResult {
  name?: string;
  cookingTime?: number;
  defaultPortions?: number;
  ingredients: Ingredient[];
  ingredientSections?: IngredientSection[];
  procedure: string[];
}

// ---- Main parser (section-aware) ----
//
// If the text has "Zutaten"/"Zubereitung" section headers, use them to classify lines.
// Otherwise fall back to heuristic ingredient/procedure detection.

export function parseRecipeText(text: string): ParseResult {
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const hasSections = rawLines.some((l) =>
    /^(?:Zutaten|Ingredients|Zubereitung|Preparation)\b/i.test(l)
  );

  return hasSections ? parseWithSections(rawLines) : parseWithoutSections(rawLines);
}

// ---- Section-aware parse ----

function parseWithSections(rawLines: string[]): ParseResult {
  let cookingTime: number | undefined;
  let defaultPortions: number | undefined;
  let recipeName: string | undefined;
  let skipNutritional = false;

  type Section = 'header' | 'ingredients' | 'procedure';
  let section: Section = 'header';

  const ingredientLines: string[] = [];
  const procedureLines: string[] = [];
  // Numbered step grouping (Chefkoch bare-digit step markers)
  const procedureGroups: string[][] = [];
  let currentStepGroup: string[] | null = null;

  for (const line of rawLines) {
    // Nutritional block state machine
    if (/^Nährwerte\b/i.test(line)) { skipNutritional = true; continue; }
    if (skipNutritional) {
      if (/^(?:Zutaten|Ingredients)\b/i.test(line))     { skipNutritional = false; section = 'ingredients'; }
      else if (/^(?:Zubereitung|Preparation)\b/i.test(line)) { skipNutritional = false; section = 'procedure'; }
      continue;
    }

    // Section transitions
    if (/^(?:Zutaten|Ingredients)\b/i.test(line))     { section = 'ingredients'; continue; }
    if (/^(?:Zubereitung|Preparation)\b/i.test(line)) { section = 'procedure'; continue; }

    // Cooking time and portions (universal, any section)
    const t = extractCookingTime(line);
    if (t !== undefined) { cookingTime = t; continue; }
    const p = extractPortions(line);
    if (p !== undefined) { defaultPortions = p; continue; }

    if (section === 'header') {
      // First meaningful line before sections = recipe title
      if (!recipeName && !isNoise(line)) { recipeName = line; }
      // All other header lines ignored (subtitles, difficulty, etc.)
    } else if (section === 'ingredients') {
      // Filter URLs, social tags, and known UI noise strings (Bring!, etc.)
      // Note: do NOT use isNoise() here — it rejects 1-3 char strings like bare amounts "2", "1 EL"
      if (!/^(https?:\/\/|www\.|@|#)/.test(line) && !NOISE.test(line)) {
        // Chefkoch ingredient tables sometimes have name\tremark in one cell — split at first tab
        const tabIdx = line.indexOf('\t');
        if (tabIdx > 0) {
          const name = line.slice(0, tabIdx).trim();
          const remark = line.slice(tabIdx + 1).trim();
          ingredientLines.push(remark ? `${name} (${remark})` : name);
        } else {
          ingredientLines.push(line);
        }
      }
    } else if (section === 'procedure') {
      if (/^(?:Tipp\b|Hinweis\b)/i.test(line)) break; // stop at tips/notes
      // Bare digit = Chefkoch step number — use as paragraph boundary
      if (/^\d+\s*$/.test(line)) {
        if (currentStepGroup !== null) procedureGroups.push(currentStepGroup);
        currentStepGroup = [];
      } else if (isProcedureLine(line)) {
        procedureLines.push(line);
        currentStepGroup?.push(line);
      }
    }
  }
  if (currentStepGroup !== null) procedureGroups.push(currentStepGroup);

  // Join orphan amount-only lines with the following name line
  const joinedIngredients = joinOrphanAmountLines(ingredientLines);

  // Classify each line as a parsed ingredient or a text item (potential section header or free-form)
  type LineResult = { kind: 'ingredient'; ing: Ingredient } | { kind: 'text'; line: string };
  const parsed: LineResult[] = [];
  for (const line of joinedIngredients) {
    if (INGR_LINE.test(line)) {
      for (const part of splitCompound(line)) {
        const ing = parseIngredientLine(part);
        if (ing) parsed.push({ kind: 'ingredient', ing });
      }
    } else {
      const trimmed = line.trim();
      if (trimmed) parsed.push({ kind: 'text', line: trimmed });
    }
  }

  // Group into sections: a text line is a section header only if it reads like one
  // (starts with "Für"/"For" or ends with ":") AND the next item is an ingredient.
  // Everything else is a free-form ingredient (amount: 0).
  const SECTION_HEADER = /^(?:für|for)\s|:\s*$/i;
  const sections: IngredientSection[] = [{ name: '', ingredients: [] }];
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i];
    if (item.kind === 'ingredient') {
      sections[sections.length - 1].ingredients.push(item.ing);
    } else {
      const nextItem = parsed[i + 1];
      if (nextItem && nextItem.kind === 'ingredient' && SECTION_HEADER.test(item.line)) {
        sections.push({ name: item.line, ingredients: [] });
      } else {
        const { name, remark } = extractRemark(item.line);
        if (name) {
          const ing: Ingredient = { amount: 0, name };
          if (remark) ing.remark = remark;
          sections[sections.length - 1].ingredients.push(ing);
        }
      }
    }
  }

  const ingredients: Ingredient[] = sections.flatMap((s) => s.ingredients);
  const hasSubs = sections.length > 1 || sections[0].name !== '';

  // Use numbered step groups when detected (Chefkoch format), else sentence-split
  const procedure = procedureGroups.length > 0
    ? procedureGroups.map((g) => g.join(' ').trim()).filter(Boolean)
    : mergeProcedure(procedureLines);

  const result: ParseResult = { ingredients, procedure };
  if (hasSubs)                    result.ingredientSections = sections;
  if (cookingTime !== undefined)  result.cookingTime = cookingTime;
  if (defaultPortions !== undefined) result.defaultPortions = defaultPortions;
  if (recipeName)                 result.name = recipeName;
  return result;
}

// ---- Heuristic fallback (no section headers) ----

function parseWithoutSections(rawLines: string[]): ParseResult {
  let cookingTime: number | undefined;
  let defaultPortions: number | undefined;
  let skipNutritional = false;
  const cleaned: string[] = [];

  for (const line of rawLines) {
    if (/^Nährwerte\b/i.test(line)) { skipNutritional = true; continue; }
    if (skipNutritional) {
      if (/^(?:Zutaten|Ingredients|Zubereitung|Preparation)\b/i.test(line)) skipNutritional = false;
      continue;
    }
    if (isNoise(line)) continue;
    const t = extractCookingTime(line);
    if (t !== undefined) { cookingTime = t; continue; }
    const p = extractPortions(line);
    if (p !== undefined) { defaultPortions = p; continue; }
    cleaned.push(line);
  }

  const joined = joinOrphanAmountLines(cleaned);
  const ingredients: Ingredient[] = [];
  const procedureLines: string[] = [];

  for (const line of joined) {
    if (INGR_LINE.test(line)) {
      for (const part of splitCompound(line)) {
        const ing = parseIngredientLine(part);
        if (ing) ingredients.push(ing);
      }
    } else if (isProcedureLine(line)) {
      procedureLines.push(line);
    }
  }

  const result: ParseResult = { ingredients, procedure: mergeProcedure(procedureLines) };
  if (cookingTime !== undefined)     result.cookingTime = cookingTime;
  if (defaultPortions !== undefined) result.defaultPortions = defaultPortions;
  return result;
}
