import { useTranslation } from 'react-i18next';

interface Props {
  portions: number;
  onChange: (n: number) => void;
}

export function PortionControl({ portions, onChange }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <span className="text-sm text-gray-500 dark:text-gray-400">{t('recipeDetail.portions')}</span>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(1, portions - 1))}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-blue-500 text-xl font-medium flex items-center justify-center"
          aria-label="Weniger Portionen"
        >
          −
        </button>
        <span className="text-base font-semibold text-gray-900 dark:text-white w-6 text-center">
          {portions}
        </span>
        <button
          onClick={() => onChange(portions + 1)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-blue-500 text-xl font-medium flex items-center justify-center"
          aria-label="Mehr Portionen"
        >
          +
        </button>
      </div>
    </div>
  );
}
