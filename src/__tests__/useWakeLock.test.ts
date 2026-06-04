import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWakeLock } from '../hooks/useWakeLock';

describe('useWakeLock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reports isSupported true when wakeLock API exists', () => {
    const { result } = renderHook(() => useWakeLock(false));
    expect(result.current.isSupported).toBe(true);
  });

  it('acquires lock when enabled is true', async () => {
    const { result } = renderHook(() => useWakeLock(true));
    await act(async () => {});
    expect(navigator.wakeLock.request).toHaveBeenCalledWith('screen');
  });

  it('does not acquire lock when enabled is false', async () => {
    const { result } = renderHook(() => useWakeLock(false));
    await act(async () => {});
    expect(navigator.wakeLock.request).not.toHaveBeenCalled();
  });

  it('reports isSupported false when wakeLock API missing', () => {
    const original = (navigator as unknown as Record<string, unknown>).wakeLock;
    delete (navigator as unknown as Record<string, unknown>).wakeLock;
    const { result } = renderHook(() => useWakeLock(false));
    expect(result.current.isSupported).toBe(false);
    (navigator as unknown as Record<string, unknown>).wakeLock = original;
  });
});
