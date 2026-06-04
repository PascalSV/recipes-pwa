const NOISE_PATTERNS = [
  /^mehr zum thema/i,
  /^rezept für/i,
  /^das schmeckt/i,
  /^hier trifft/i,
];

export function preprocessRecipeText(raw: string): string {
  return raw
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (trimmed.length < 4) return false;
      if (NOISE_PATTERNS.some(p => p.test(trimmed))) return false;
      // Drop short lines with no digits — these are article teasers / navigation items
      // (ingredient lines always contain a number; procedure paragraphs are long)
      if (trimmed.length <= 30 && !/\d/.test(trimmed)) return false;
      return true;
    })
    .join('\n');
}
