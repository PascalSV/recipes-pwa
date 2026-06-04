import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { PortionControl } from './PortionControl';
import { shareIngredients, formatAmount, scaleAmount } from '../lib/shareIngredients';
import type { Unit } from '../types';

interface Props {
  token: string;
}

export function RecipeDetail({ token }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { recipe, loading } = useRecipeDetail(id!, token);
  const [portions, setPortions] = useState<number | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);

  const currentPortions = portions ?? recipe?.defaultPortions ?? 4;

  const handleShare = async () => {
    if (!recipe) return;
    try {
      await shareIngredients(recipe.ingredients, recipe.defaultPortions, currentPortions, recipe.name);
      if (!navigator.share) {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      }
    } catch (_) {}
  };

  if (loading && !recipe) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!recipe) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Nav */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800 safe-top">
        <div className="flex items-center px-4 h-12 gap-3">
          <button onClick={() => navigate(-1)} className="text-blue-500 flex items-center gap-1 text-base">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {t('nav.back')}
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-gray-900 dark:text-white truncate">
            {recipe.name}
          </h1>
          <div className="w-16" />
        </div>
      </div>

      {/* Portion control — sticky below nav */}
      <div className="sticky top-12 z-[9]">
        <PortionControl
          portions={currentPortions}
          onChange={p => setPortions(p)}
        />
      </div>

      {/* Ingredients */}
      <div className="mt-4 mx-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {t('recipeDetail.ingredients')}
          </h2>
          <button
            onClick={handleShare}
            className="text-blue-500 text-sm flex items-center gap-1"
          >
            {shareFeedback ? (
              t('recipeDetail.shareCopied')
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                {t('recipeDetail.share')}
              </>
            )}
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {recipe.ingredients.map((ing, i) => {
            const scaled = formatAmount(scaleAmount(ing.amount, recipe.defaultPortions, currentPortions));
            const unit = ing.unit ? t(`units.${ing.unit}` as `units.${Unit}`) : '';
            return (
              <div
                key={i}
                className={`px-4 py-3 ${i < recipe.ingredients.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-blue-500 font-medium text-sm w-16 flex-shrink-0 text-right">
                    {scaled}{unit ? ` ${unit}` : ''}
                  </span>
                  <span className="text-gray-900 dark:text-white text-sm">{ing.name}</span>
                </div>
                {ing.remark && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 pl-18">{ing.remark}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Procedure */}
      <div className="mt-6 mx-4 pb-10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
          {t('recipeDetail.procedure')}
        </h2>
        <div className="flex flex-col gap-3">
          {recipe.procedure.map((step, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3 flex gap-3">
              <span className="text-blue-500 font-semibold text-sm flex-shrink-0 mt-0.5">{i + 1}.</span>
              <p className="text-gray-900 dark:text-white text-sm leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
