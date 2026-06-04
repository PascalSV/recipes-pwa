import { useTranslation } from 'react-i18next';
import type { Ingredient, Unit } from '../types';

const UNITS: (Unit | '')[] = ['', 'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'piece'];

interface Props {
  ingredient: Ingredient;
  onChange: (ing: Ingredient) => void;
  onDelete: () => void;
}

export function IngredientEditor({ ingredient, onChange, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 mb-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={ingredient.amount}
          min={0}
          step="any"
          onChange={e => onChange({ ...ingredient, amount: parseFloat(e.target.value) || 0 })}
          className="w-16 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right outline-none"
          aria-label="Menge"
        />
        <select
          value={ingredient.unit ?? ''}
          onChange={e => onChange({ ...ingredient, unit: (e.target.value as Unit) || undefined })}
          className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none"
          aria-label="Einheit"
        >
          {UNITS.map(u => (
            <option key={u} value={u}>
              {u ? t(`units.${u}` as `units.${Unit}`) : '—'}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={ingredient.name}
          onChange={e => onChange({ ...ingredient, name: e.target.value })}
          placeholder="Zutat"
          className="flex-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none"
          aria-label="Zutatname"
        />
        <button
          onClick={onDelete}
          aria-label="Löschen"
          className="text-red-400 text-lg leading-none px-1"
        >
          ×
        </button>
      </div>
      <input
        type="text"
        value={ingredient.remark ?? ''}
        onChange={e => onChange({ ...ingredient, remark: e.target.value || undefined })}
        placeholder={t('newRecipe.remarkPlaceholder')}
        className="mt-1.5 w-full px-2 py-1 rounded-lg bg-gray-50 dark:bg-gray-750 text-gray-400 dark:text-gray-500 text-xs outline-none border border-gray-100 dark:border-gray-700"
        aria-label="Anmerkung"
      />
    </div>
  );
}
