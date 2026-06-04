import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useRecipeDetail } from '../hooks/useRecipeDetail';
import { PortionControl } from './PortionControl';
import { shareIngredients, formatAmount, scaleAmount } from '../lib/shareIngredients';
import { getCategoryStyle } from '../lib/categoryColors';
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

  const gradientStyle = getCategoryStyle(recipe.group);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Gradient hero header */}
      <div className="relative" style={gradientStyle}>
        <div className="safe-top" />
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-10 w-52 h-52 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -right-6 top-24 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute left-8 top-10 w-20 h-20 rounded-full bg-black/10 pointer-events-none" />

        {/* Back button */}
        <div className="relative px-4 pt-4 pb-0 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center"
            aria-label={t('nav.back')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        </div>

        {/* Recipe name */}
        <div className="relative px-5 pt-8 pb-6">
          <p className="text-white/70 text-xs uppercase tracking-widest font-medium mb-1">
            {recipe.group}
          </p>
          <h1 className="text-white text-2xl font-bold leading-tight" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
            {recipe.name}
          </h1>
        </div>
      </div>

      {/* Sticky portion control */}
      <div className="sticky top-0 z-10">
        <PortionControl portions={currentPortions} onChange={setPortions} />
      </div>

      {/* Ingredients */}
      <div className="mt-4 mx-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {t('recipeDetail.ingredients')}
          </h2>
          <button onClick={handleShare} className="text-blue-500 text-sm flex items-center gap-1.5 font-medium">
            {shareFeedback ? (
              <span>{t('recipeDetail.shareCopied')}</span>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
                  <circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
                {t('recipeDetail.share')}
              </>
            )}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
          {recipe.ingredients.map((ing, i) => {
            const scaled = formatAmount(scaleAmount(ing.amount, recipe.defaultPortions, currentPortions));
            const unit = ing.unit ? t(`units.${ing.unit}` as `units.${Unit}`) : '';
            const amountLabel = [scaled, unit].filter(Boolean).join(' ');

            return (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3 ${
                  i < recipe.ingredients.length - 1
                    ? 'border-b border-gray-50 dark:border-gray-700/50'
                    : ''
                }`}
              >
                {/* Amount badge */}
                <span
                  className="flex-shrink-0 mt-0.5 text-xs font-semibold text-white px-2.5 py-1 rounded-full min-w-[56px] text-center"
                  style={getCategoryStyle(recipe.group)}
                >
                  {amountLabel}
                </span>
                {/* Name + remark */}
                <div className="flex-1 min-w-0">
                  <span className="text-gray-900 dark:text-white text-sm font-medium">
                    {ing.name}
                  </span>
                  {ing.remark && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{ing.remark}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Procedure */}
      <div className="mt-6 mx-4 pb-28">
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">
          {t('recipeDetail.procedure')}
        </h2>
        <div className="flex flex-col gap-3">
          {recipe.procedure.map((step, i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 px-4 py-3 shadow-sm flex gap-3"
            >
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center mt-0.5"
                style={getCategoryStyle(recipe.group)}
              >
                {i + 1}
              </span>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed flex-1">
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
