import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const USERS = ['Claudia', 'Pascal'] as const;

interface Props {
  onLogin: (user: string, token: string) => Promise<void>;
}

export function LoginScreen({ onLogin }: Props) {
  const { t } = useTranslation();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedUser || !token) return;
    setError(null);
    setLoading(true);
    try {
      await onLogin(selectedUser, token);
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-8">
        {t('login.title')}
      </h1>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('login.selectUser')}</p>
      <div className="flex gap-3 mb-6 w-full max-w-xs">
        {USERS.map(user => (
          <button
            key={user}
            onClick={() => setSelectedUser(user)}
            className={`flex-1 py-3 rounded-xl text-base font-medium transition-colors ${
              selectedUser === user
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
            }`}
          >
            {user}
          </button>
        ))}
      </div>

      <div className="w-full max-w-xs mb-2">
        <label className="text-sm text-gray-500 dark:text-gray-400 mb-1 block">
          {t('login.tokenLabel')}
        </label>
        <input
          type="password"
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-base outline-none focus:border-blue-500"
          autoComplete="current-password"
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-3 text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!selectedUser || !token || loading}
        className="w-full max-w-xs py-3 rounded-xl bg-blue-500 text-white text-base font-medium mt-2 disabled:opacity-40 transition-opacity"
      >
        {loading ? '…' : t('login.signIn')}
      </button>
    </div>
  );
}
