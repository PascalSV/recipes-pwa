import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LoginScreen } from '../components/LoginScreen';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LoginScreen', () => {
  it('renders user selection buttons', () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.getByText('Claudia')).toBeInTheDocument();
    expect(screen.getByText('Pascal')).toBeInTheDocument();
  });

  it('sign-in button is disabled until user and token provided', () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    const btn = screen.getByText('login.signIn');
    expect(btn).toBeDisabled();
  });

  it('enables sign-in after selecting user and entering token', () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    fireEvent.click(screen.getByText('Claudia'));
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'secret' } });
    expect(screen.getByText('login.signIn')).not.toBeDisabled();
  });

  it('calls onLogin with selected user and token', async () => {
    const onLogin = vi.fn().mockResolvedValue(undefined);
    render(<LoginScreen onLogin={onLogin} />);
    fireEvent.click(screen.getByText('Pascal'));
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'mytoken' } });
    fireEvent.click(screen.getByText('login.signIn'));
    await waitFor(() => expect(onLogin).toHaveBeenCalledWith('Pascal', 'mytoken'));
  });

  it('shows error message on rejected login', async () => {
    const onLogin = vi.fn().mockRejectedValue(new Error('UNAUTHORIZED'));
    render(<LoginScreen onLogin={onLogin} />);
    fireEvent.click(screen.getByText('Claudia'));
    const input = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.click(screen.getByText('login.signIn'));
    await waitFor(() => expect(screen.getByText('login.error')).toBeInTheDocument());
  });
});
