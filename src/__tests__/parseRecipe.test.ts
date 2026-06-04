import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, it, expect } from 'vitest';
import { preprocessRecipeText } from '../lib/parseRecipe';

const fixture = readFileSync(
  join(__dirname, 'fixtures/bohnen-auflauf-raw.txt'),
  'utf-8'
);

describe('preprocessRecipeText', () => {
  it('removes the "Mehr zum Thema" noise block', () => {
    const result = preprocessRecipeText(fixture);
    expect(result).not.toContain('Mehr zum Thema');
    expect(result).not.toContain('Katrin kocht');
    expect(result).not.toContain('Blumenkohl mit Trauben');
    expect(result).not.toContain('Rezept für Chicorée');
    expect(result).not.toContain('Das schmeckt nicht nur Meerschweinchen');
    expect(result).not.toContain('Rezept für Gnocchi');
    expect(result).not.toContain('Hier trifft Süßes auf Salziges');
  });

  it('preserves ingredient lines', () => {
    const result = preprocessRecipeText(fixture);
    expect(result).toContain('480 g (800 g mit Flüssigkeit) Cannellini');
    expect(result).toContain('3 EL Olivenöl');
    expect(result).toContain('25 g frischer Ingwer (gerieben)');
    expect(result).toContain('2 TL Kreuzkümmelsamen und 2 TL Koriandersamen');
  });

  it('preserves procedure paragraphs', () => {
    const result = preprocessRecipeText(fixture);
    expect(result).toContain('Öl in einer großen ofenfesten Pfanne erhitzen');
    expect(result).toContain('Dann Tomaten, Zucker');
  });

  it('removes blank lines', () => {
    const result = preprocessRecipeText(fixture);
    const lines = result.split('\n');
    expect(lines.every(l => l.trim().length > 0)).toBe(true);
  });

  it('handles empty input', () => {
    expect(preprocessRecipeText('')).toBe('');
  });

  it('handles input with only noise', () => {
    const noise = 'Mehr zum Thema\nRezept für Gnocchi\nHier trifft Süßes';
    expect(preprocessRecipeText(noise)).toBe('');
  });
});
