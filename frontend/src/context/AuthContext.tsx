import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api';
import type { User } from '../lib/types';

type AuthContextValue = {
  user: User | null;
  isBooting: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    brandName: string;
    category: string;
    city: string;
  }) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setIsBooting(false);
      return;
    }

    api
      .me()
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setIsBooting(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isBooting,
      login: async (email, password) => {
        const response = await api.login({ email, password });
        tokenStore.set(response.token);
        setUser(response.user);
      },
      register: async (payload) => {
        const response = await api.register(payload);
        tokenStore.set(response.token);
        setUser(response.user);
      },
      logout: () => {
        tokenStore.clear();
        setUser(null);
      }
    }),
    [user, isBooting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
