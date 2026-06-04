import { useEffect, useRef, useState } from 'react';

export interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
}

export function useWakeLock(enabled: boolean): UseWakeLockReturn {
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const [isActive, setIsActive] = useState(false);
  const isSupported = 'wakeLock' in navigator;

  const acquire = async () => {
    if (!isSupported || lockRef.current) return;
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);
      lockRef.current.addEventListener('release', () => {
        lockRef.current = null;
        setIsActive(false);
      });
    } catch {
      // Device refused (low battery, power saving) — fail silently
    }
  };

  const release = async () => {
    if (!lockRef.current) return;
    await lockRef.current.release();
    lockRef.current = null;
    setIsActive(false);
  };

  // Re-acquire when tab becomes visible (iOS releases lock on backgrounding)
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [enabled]);

  useEffect(() => {
    if (enabled) {
      acquire();
    } else {
      release();
    }
    return () => {
      release();
    };
  }, [enabled]);

  return { isSupported, isActive, enable: acquire, disable: release };
}
