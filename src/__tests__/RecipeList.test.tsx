import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { RecipeList } from '../components/RecipeList';
import type { RecipeMeta } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockRecipes: RecipeMeta[] = [
  { id: '1', name: 'Spaghetti Carbonara', group: 'Pasta', updatedAt: '2024-01-01' },
  { id: '2', name: 'Tomatensuppe', group: 'Suppe', updatedAt: '2024-01-01' },
  { id: '3', name: 'Penne Arrabiata', group: 'Pasta', updatedAt: '2024-01-01' },
];

function renderList(props?: Partial<Parameters<typeof RecipeList>[0]>) {
  return render(
    <MemoryRouter>
      <RecipeList recipes={mockRecipes} loading={false} onLogout={vi.fn()} {...props} />
    </MemoryRouter>
  );
}

describe('RecipeList', () => {
  it('renders all recipes', () => {
    renderList();
    expect(screen.getByText('Spaghetti Carbonara')).toBeInTheDocument();
    expect(screen.getByText('Tomatensuppe')).toBeInTheDocument();
    expect(screen.getByText('Penne Arrabiata')).toBeInTheDocument();
  });

  it('groups recipes by group name', () => {
    renderList();
    expect(screen.getByText('Pasta')).toBeInTheDocument();
    expect(screen.getByText('Suppe')).toBeInTheDocument();
  });

  it('filters by search query', () => {
    renderList();
    const input = screen.getByPlaceholderText('recipeList.searchPlaceholder');
    fireEvent.change(input, { target: { value: 'Tomaten' } });
    expect(screen.getByText('Tomatensuppe')).toBeInTheDocument();
    expect(screen.queryByText('Spaghetti Carbonara')).not.toBeInTheDocument();
  });

  it('hides empty groups after filtering', () => {
    renderList();
    const input = screen.getByPlaceholderText('recipeList.searchPlaceholder');
    fireEvent.change(input, { target: { value: 'Tomaten' } });
    expect(screen.queryByText('Pasta')).not.toBeInTheDocument();
  });

  it('shows no-results message when search has no matches', () => {
    renderList();
    const input = screen.getByPlaceholderText('recipeList.searchPlaceholder');
    fireEvent.change(input, { target: { value: 'xyz123' } });
    expect(screen.getByText('recipeList.noResults')).toBeInTheDocument();
  });

  it('shows loading spinner when loading and no recipes', () => {
    renderList({ recipes: [], loading: true });
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
