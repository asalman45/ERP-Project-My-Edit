import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthUser {
  username: string;
  name: string;
  role?: string;
  email?: string;
}

type LoginPayload = {
  username: string;
  password: string;
};

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const TOKEN_STORAGE_KEY = 'empclerp_token';
const USER_STORAGE_KEY = 'empclerp_user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const persistAuth = useCallback((authToken: string, authUser: AuthUser) => {
    setToken(authToken);
    setUser(authUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
  }, []);

  const clearAuth = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  const login = useCallback(async ({ username, password }: LoginPayload) => {
    setLoading(true);
    try {
      const response = await authApi.login({ username, password });
      const authToken = response?.token;
      const authUser = response?.user ?? response?.data?.user ?? response;

      if (!authToken || !authUser) {
        throw new Error('Invalid authentication response from server.');
      }

      persistAuth(authToken, authUser);
    } finally {
      setLoading(false);
    }
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUserRaw = localStorage.getItem(USER_STORAGE_KEY);

      if (!storedToken || !storedUserRaw) {
        setLoading(false);
        return;
      }

      try {
        const parsedUser: AuthUser = JSON.parse(storedUserRaw);
        setToken(storedToken);
        setUser(parsedUser);

        const profile = await authApi.me();
        if (profile?.user) {
          setUser(profile.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile.user));
        }
      } catch (error) {
        console.error('Failed to restore authentication:', error);
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    token,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    logout,
  }), [user, token, loading, login, logout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <LoadingSpinner size="lg" text="Preparing your workspace..." />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
