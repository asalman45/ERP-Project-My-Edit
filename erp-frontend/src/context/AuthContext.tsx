import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { authApi } from '@/services/api';
import LoadingSpinner from '@/components/LoadingSpinner';

interface AuthUser {
  user_id?: string;
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
const REFRESH_TOKEN_STORAGE_KEY = 'empclerp_refresh_token';
const USER_STORAGE_KEY = 'empclerp_user';

// How many milliseconds before token expiry to trigger a silent refresh (5 minutes)
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000;

/** Decode the expiry time from a JWT without a library */
function getTokenExpiry(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Clear all auth state from memory and localStorage */
  const clearAuth = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }, []);

  /** Schedule a silent token refresh shortly before the current token expires */
  const scheduleRefresh = useCallback((accessToken: string) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    const expiry = getTokenExpiry(accessToken);
    if (!expiry) return;

    const delay = expiry - Date.now() - REFRESH_BEFORE_EXPIRY_MS;
    if (delay <= 0) return; // already near/past expiry — will be caught on next API call

    refreshTimerRef.current = setTimeout(async () => {
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      if (!storedRefresh) { clearAuth(); return; }
      try {
        const result: any = await authApi.refresh(storedRefresh);
        const newToken = result?.token;
        if (newToken) {
          setToken(newToken);
          localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
          scheduleRefresh(newToken); // schedule the next refresh
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      }
    }, delay);
  }, [clearAuth]);

  /** Persist both tokens and user into localStorage + state */
  const persistAuth = useCallback((accessToken: string, refreshTokenValue: string, authUser: AuthUser) => {
    setToken(accessToken);
    setUser(authUser);
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshTokenValue);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
    scheduleRefresh(accessToken);
  }, [scheduleRefresh]);

  /** Login: call API, persist tokens, schedule refresh */
  const login = useCallback(async ({ username, password }: LoginPayload) => {
    setLoading(true);
    try {
      const response: any = await authApi.login({ username, password });
      const accessToken = response?.token;
      const refreshTokenValue = response?.refreshToken;
      const authUser = response?.user ?? response?.data?.user ?? response;

      if (!accessToken || !authUser) {
        throw new Error('Invalid authentication response from server.');
      }

      persistAuth(accessToken, refreshTokenValue || '', authUser);
    } finally {
      setLoading(false);
    }
  }, [persistAuth]);

  /** Logout: clear everything */
  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  /** On app boot: restore session from localStorage, verify token is still valid */
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedRefresh = localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
      const storedUserRaw = localStorage.getItem(USER_STORAGE_KEY);

      if (!storedToken || !storedUserRaw) {
        setLoading(false);
        return;
      }

      // Check if access token is still valid (not expired)
      const expiry = getTokenExpiry(storedToken);
      const isExpired = expiry ? Date.now() >= expiry : false;

      if (isExpired && storedRefresh) {
        // Access token expired — try to refresh silently before showing the app
        try {
          const result: any = await authApi.refresh(storedRefresh);
          const newToken = result?.token;
          if (!newToken) { clearAuth(); setLoading(false); return; }

          const parsedUser: AuthUser = JSON.parse(storedUserRaw);
          persistAuth(newToken, storedRefresh, parsedUser);
          setLoading(false);
          return;
        } catch {
          clearAuth();
          setLoading(false);
          return;
        }
      }

      try {
        const parsedUser: AuthUser = JSON.parse(storedUserRaw);
        setToken(storedToken);
        setUser(parsedUser);
        scheduleRefresh(storedToken);

        // Verify against server and pick up any profile changes
        const profile = await authApi.me();
        if (profile?.user) {
          setUser(profile.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile.user));
        }
      } catch (error: any) {
        // If /me returns 401, the token is invalid — clear everything
        clearAuth();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [clearAuth, persistAuth, scheduleRefresh]);

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
