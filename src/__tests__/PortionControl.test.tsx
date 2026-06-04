import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PortionControl } from '../components/PortionControl';

// Minimal i18n mock
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('PortionControl', () => {
  it('renders current portions', () => {
    render(<PortionControl portions={4} onChange={vi.fn()} />);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('calls onChange with incremented value', () => {
    const onChange = vi.fn();
    render(<PortionControl portions={4} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Mehr Portionen'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('calls onChange with decremented value', () => {
    const onChange = vi.fn();
    render(<PortionControl portions={4} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Weniger Portionen'));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('enforces minimum of 1', () => {
    const onChange = vi.fn();
    render(<PortionControl portions={1} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Weniger Portionen'));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
