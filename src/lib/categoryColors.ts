export type GradientPair = [string, string];

const MAP: Record<string, GradientPair> = {
  'Vorspeise':    ['#F4A93D', '#E07820'],
  'Hauptgericht': ['#E8642A', '#C44010'],
  'Beilage':      ['#7DB057', '#558038'],
  'Suppe':        ['#C49A3A', '#9A7420'],
  'Salat':        ['#5DA870', '#3A8050'],
  'Dessert':      ['#D46090', '#A84068'],
  'Frühstück':    ['#E8A840', '#C07820'],
  'Snack':        ['#9070C8', '#6848A8'],
  'Pasta':        ['#D46840', '#A84820'],
  'Fleisch':      ['#A84848', '#883030'],
  'Fisch':        ['#4890B8', '#306888'],
};

const DEFAULT: GradientPair = ['#C4520F', '#9E420C'];

export function getCategoryColors(group: string): GradientPair {
  return MAP[group] ?? DEFAULT;
}

export function getCategoryStyle(group: string): React.CSSProperties {
  const [from, to] = getCategoryColors(group);
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}
