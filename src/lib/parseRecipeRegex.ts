import type { Ingredient, Unit, ParsedRecipe } from '../types';
import { preprocessRecipeText } from './parseRecipe';

// ── Unit recognition (German + English) ──────────────────────────────────
const UNIT_MAP: Array<[RegExp, Unit]> = [
  [/^(el|essl\.?|esslöffel)\b/i,        'tbsp'],
  [/^(tl|teel\.?|teelöffel)\b/i,        'tsp'],
  [/^(kg|kilogramm)\b/i,                 'kg'],
  [/^(g|gr\.?|gramm)\b/i,               'g'],
  [/^(ml|milliliter)\b/i,               'ml'],
  [/^(l|liter)\b(?![a-zäöü])/i,        'l'],
  [/^(tasse[n]?|cup[s]?)\b/i,           'cup'],
  [/^(stk\.?|stück[e]?|stücke|pc\.?|piece[s]?)\b/i, 'piece'],
];

// ── Amount parsing — handles ranges, decimals, German commas ─────────────
const AMOUNT_RE =
  /^(\d+(?:[,.]\d+)?)(?:\s*(?:[-–]|bis)\s*(\d+(?:[,.]\d+)?))?/i;

function parseAmount(raw: string): number {
  const m = raw.match(AMOUNT_RE);
  if (!m) return 0;
  // For a range take the higher value
  const hi = m[2] ? m[2].replace(',', '.') : null;
  const lo = m[1].replace(',', '.');
  return parseFloat(hi ?? lo);
}

// ── Remark extraction ─────────────────────────────────────────────────────
// Pulls parenthetical notes out of a string.
// Discards notes that contain digits (weight clarifications like "800 g mit Flüssigkeit").
function extractRemarks(text: string): { name: string; remark?: string } {
  const remarks: string[] = [];
  const name = text
    .replace(/\(([^)]+)\)/g, (_, inner) => {
      if (/\d/.test(inner)) return ''; // weight note — discard
      remarks.push(inner.trim());
      return '';
    })
    .replace(/\s+/g, ' ')
    .trim();

  return { name, remark: remarks.length > 0 ? remarks.join('; ') : undefined };
}

// ── Parse a single ingredient line ──────────────────────────────────────
function parseLine(line: string): Ingredient | null {
  const trimmed = line.trim();
  const amountMatch = trimmed.match(AMOUNT_RE);
  if (!amountMatch) return null;

  const amount = parseAmount(amountMatch[0]);
  let rest = trimmed.slice(amountMatch[0].length).trim();

  // Match unit
  let unit: Unit | undefined;
  for (const [pattern, u] of UNIT_MAP) {
    const m = rest.match(pattern);
    if (m) {
      rest = rest.slice(m[0].length).trim();
      unit = u;
      break;
    }
  }

  const { name, remark } = extractRemarks(rest);
  if (!name) return null;

  return { amount, ...(unit ? { unit } : {}), name, ...(remark ? { remark } : {}) };
}

// ── Compound line splitting ───────────────────────────────────────────────
// Handles "2 TL Kreuzkümmel und 2 TL Koriander (im Mörser zerstoßen)"
// by splitting into two lines and copying the shared remark to both.
function splitCompound(line: string): string[] {
  // Look for "und <digit>" pattern inside the line
  const idx = line.search(/\s+und\s+\d/i);
  if (idx === -1) return [line];

  const part1 = line.slice(0, idx).trim();
  const part2 = line.slice(idx).replace(/^\s*und\s*/i, '').trim();

  // Extract shared trailing remark (if any)
  const sharedRemarkMatch = line.match(/\(([^)]+)\)\s*$/);
  if (sharedRemarkMatch && !/\d/.test(sharedRemarkMatch[1])) {
    const remark = `(${sharedRemarkMatch[1]})`;
    const p1clean = part1.replace(/\([^)]+\)\s*$/, '').trim();
    const p2clean = part2.replace(/\([^)]+\)\s*$/, '').trim();
    return [`${p1clean} ${remark}`, `${p2clean} ${remark}`];
  }

  return [part1, part2];
}

// ── Procedure splitting ───────────────────────────────────────────────────
// Splits a prose paragraph into individual steps at sentence boundaries.
function splitProcedure(paragraph: string): string[] {
  return paragraph
    .split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ])/)
    .map(s => s.trim())
    .filter(s => s.length > 15);
}

// ── Public API ────────────────────────────────────────────────────────────
export function parseRecipeWithRegex(raw: string): ParsedRecipe {
  const text = preprocessRecipeText(raw);
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  const ingredients: Ingredient[] = [];
  const procedureParas: string[] = [];

  for (const line of lines) {
    if (/^\d/.test(line)) {
      // Ingredient line — may be compound
      for (const part of splitCompound(line)) {
        const ing = parseLine(part);
        if (ing && ing.name) ingredients.push(ing);
      }
    } else {
      procedureParas.push(line);
    }
  }

  const procedure = procedureParas.flatMap(splitProcedure);

  return { ingredients, procedure };
}
