import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { IngredientEditor } from '../components/IngredientEditor';
import type { Ingredient } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => (k.startsWith('units.') ? k.split('.')[1] : k) }),
}));

const base: Ingredient = { amount: 200, unit: 'g', name: 'Mehl', remark: 'gesiebt' };

describe('IngredientEditor', () => {
  it('renders amount, unit, name and remark', () => {
    render(<IngredientEditor ingredient={base} onChange={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByDisplayValue('200')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Mehl')).toBeInTheDocument();
    expect(screen.getByDisplayValue('gesiebt')).toBeInTheDocument();
  });

  it('calls onChange when name changes', () => {
    const onChange = vi.fn();
    render(<IngredientEditor ingredient={base} onChange={onChange} onDelete={vi.fn()} />);
    fireEvent.change(screen.getByDisplayValue('Mehl'), { target: { value: 'Butter' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ name: 'Butter' }));
  });

  it('calls onChange when amount changes', () => {
    const onChange = vi.fn();
    render(<IngredientEditor ingredient={base} onChange={onChange} onDelete={vi.fn()} />);
    fireEvent.change(screen.getByDisplayValue('200'), { target: { value: '300' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ amount: 300 }));
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<IngredientEditor ingredient={base} onChange={vi.fn()} onDelete={onDelete} />);
    fireEvent.click(screen.getByLabelText('Löschen'));
    expect(onDelete).toHaveBeenCalled();
  });

  it('clears unit when "—" selected', () => {
    const onChange = vi.fn();
    render(<IngredientEditor ingredient={base} onChange={onChange} onDelete={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Einheit'), { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ unit: undefined }));
  });
});
