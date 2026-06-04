import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import type { Ingredient, Recipe } from '../types';
import { preprocessRecipeText } from '../lib/parseRecipe';
import { parseRecipeWithRegex } from '../lib/parseRecipeRegex';
import { parseRecipeText, saveRecipeToCloud } from '../lib/api';
import { saveRecipe, getRecipeIndex, saveRecipeIndex } from '../lib/db';
import { IngredientEditor } from './IngredientEditor';

type ParseMode = 'ai' | 'regex';

interface Props {
  token: string;
}

const GROUPS = ['Vorspeise', 'Hauptgericht', 'Beilage', 'Suppe', 'Salat', 'Dessert', 'Frühstück', 'Snack'];

export function NewRecipeView({ token }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [pasteText, setPasteText] = useState('');
  const [parseMode, setParseMode] = useState<ParseMode>('ai');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState(false);

  const [name, setName] = useState('');
  const [group, setGroup] = useState(GROUPS[0]);
  const [portions, setPortions] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [procedure, setProcedure] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handleParse = async () => {
    if (!pasteText.trim()) return;
    setParsing(true);
    setParseError(null);
    try {
      if (parseMode === 'regex') {
        const result = parseRecipeWithRegex(pasteText);
        setIngredients(result.ingredients);
        setProcedure(result.procedure);
        setParsed(true);
      } else {
        const cleaned = preprocessRecipeText(pasteText);
        const result = await parseRecipeText(cleaned, token);
        setIngredients(result.ingredients);
        setProcedure(result.procedure);
        setParsed(true);
      }
    } catch (e) {
      console.error('Parse error:', e);
      setParseError(t('newRecipe.parseError'));
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const recipe: Recipe = {
        id: uuidv4(),
        name: name.trim(),
        group,
        defaultPortions: portions,
        ingredients,
        procedure,
        createdAt: now,
        updatedAt: now,
      };
      await saveRecipeToCloud(recipe, token);
      await saveRecipe(recipe);
      // Update local index
      const index = await getRecipeIndex();
      if (index) {
        index.recipes.push({ id: recipe.id, name: recipe.name, group: recipe.group, updatedAt: recipe.updatedAt });
        await saveRecipeIndex(index);
      }
      navigate('/');
    } catch {
      // Save failed silently — recipe still saved locally
    } finally {
      setSaving(false);
    }
  };

  const updateIngredient = (i: number, ing: Ingredient) => {
    setIngredients(prev => prev.map((x, idx) => idx === i ? ing : x));
  };
  const deleteIngredient = (i: number) => {
    setIngredients(prev => prev.filter((_, idx) => idx !== i));
  };
  const addIngredient = () => {
    setIngredients(prev => [...prev, { amount: 0, name: '' }]);
  };
  const updateStep = (i: number, text: string) => {
    setProcedure(prev => prev.map((s, idx) => idx === i ? text : s));
  };
  const deleteStep = (i: number) => {
    setProcedure(prev => prev.filter((_, idx) => idx !== i));
  };
  const addStep = () => setProcedure(prev => [...prev, '']);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="safe-top" />
        <div className="px-4 pt-4 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t('newRecipe.title')}
          </h1>
        </div>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4 pb-28">
        {/* Paste area */}
        {!parsed && (
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">
              {t('newRecipe.pasteLabel')}
            </label>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              rows={8}
              disabled={parsing}
              placeholder={t('newRecipe.pastePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none resize-none"
            />
            {/* Parser mode toggle */}
            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mt-3">
              {(['ai', 'regex'] as ParseMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setParseMode(mode)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    parseMode === mode
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {mode === 'ai' ? '✦ KI-Erkennung' : '⚙ Regelbasiert'}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 px-1">
              {parseMode === 'ai'
                ? 'Intelligent, versteht komplexe Texte — benötigt Internetverbindung'
                : 'Schnell & offline — funktioniert am besten mit klar strukturierten Texten'}
            </p>

            {parseError && (
              <p className="text-red-500 text-sm mt-1">{parseError}</p>
            )}
            <button
              onClick={handleParse}
              disabled={!pasteText.trim() || parsing}
              className="mt-2 w-full py-3 rounded-xl bg-blue-500 text-white font-medium disabled:opacity-40"
            >
              {parsing ? t('newRecipe.parsing') : t('newRecipe.parseButton')}
            </button>
          </div>
        )}

        {/* Form (shown after successful parse) */}
        {parsed && (
          <>
            {/* Name */}
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">{t('newRecipe.name')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base outline-none"
              />
            </div>

            {/* Group */}
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">{t('newRecipe.group')}</label>
              <select
                value={group}
                onChange={e => setGroup(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base outline-none"
              >
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            {/* Portions */}
            <div>
              <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">{t('newRecipe.portions')}</label>
              <input
                type="number"
                min={1}
                value={portions}
                onChange={e => setPortions(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base outline-none"
              />
            </div>

            {/* Ingredients */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t('newRecipe.ingredients')}
              </h2>
              {ingredients.map((ing, i) => (
                <IngredientEditor
                  key={i}
                  ingredient={ing}
                  onChange={updated => updateIngredient(i, updated)}
                  onDelete={() => deleteIngredient(i)}
                />
              ))}
              <button
                onClick={addIngredient}
                className="text-blue-500 text-sm mt-1"
              >
                + {t('newRecipe.addIngredient')}
              </button>
            </div>

            {/* Procedure */}
            <div>
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                {t('newRecipe.procedure')}
              </h2>
              {procedure.map((step, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <span className="text-blue-500 font-semibold text-sm pt-2 w-5 flex-shrink-0">{i + 1}.</span>
                  <textarea
                    value={step}
                    onChange={e => updateStep(i, e.target.value)}
                    rows={3}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-sm outline-none resize-none"
                  />
                  <button onClick={() => deleteStep(i)} className="text-red-400 text-lg self-start pt-1">×</button>
                </div>
              ))}
              <button onClick={addStep} className="text-blue-500 text-sm mt-1">
                + {t('newRecipe.addStep')}
              </button>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="w-full py-3 rounded-xl bg-blue-500 text-white font-medium mt-2 disabled:opacity-40"
            >
              {saving ? '…' : t('newRecipe.save')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
