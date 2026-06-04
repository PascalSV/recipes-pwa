import '@testing-library/jest-dom';

// Mock IndexedDB
const mockStore: Record<string, Record<string, unknown>> = {};

const mockIDB = {
  get: vi.fn(async (store: string, key: string) => mockStore[store]?.[key]),
  put: vi.fn(async (store: string, value: unknown, key?: string) => {
    if (!mockStore[store]) mockStore[store] = {};
    const k = key ?? (value as { id: string }).id;
    mockStore[store][k] = value;
  }),
  delete: vi.fn(async (store: string, key: string) => {
    delete mockStore[store]?.[key];
  }),
};

vi.mock('../lib/db', () => ({
  getRecipeIndex: vi.fn(),
  saveRecipeIndex: vi.fn(),
  getRecipe: vi.fn(),
  saveRecipe: vi.fn(),
  getSession: vi.fn(),
  saveSession: vi.fn(),
  clearSession: vi.fn(),
  getPrefs: vi.fn(async () => ({ language: 'de', theme: 'system', wakeLock: false })),
  savePrefs: vi.fn(),
}));

// Stub navigator.wakeLock
Object.defineProperty(navigator, 'wakeLock', {
  value: {
    request: vi.fn(async () => ({
      release: vi.fn(),
      addEventListener: vi.fn(),
    })),
  },
  writable: true,
  configurable: true,
});

// Stub navigator.share
Object.defineProperty(navigator, 'share', {
  value: vi.fn(async () => {}),
  writable: true,
  configurable: true,
});

// Stub navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn(async () => {}) },
  writable: true,
  configurable: true,
});

export { mockIDB };
