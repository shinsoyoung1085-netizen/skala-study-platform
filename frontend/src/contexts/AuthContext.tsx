import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { login as loginRequest, logout as logoutRequest } from "@/api/auth";
import { clearStoredToken, getStoredToken, storeToken } from "@/api/client";
import { fetchMyProfile } from "@/api/users";
import type { LoginPayload, UserProfile } from "@/types";

interface AuthContextValue {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const profile = await fetchMyProfile();
      setUser(profile);
    } catch {
      // 토큰이 만료되었거나 유효하지 않은 경우 로그인 상태를 초기화한다.
      clearStoredToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const token = await loginRequest(payload);
      storeToken(token, payload.remember_me);
      await refreshProfile();
    },
    [refreshProfile],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearStoredToken();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, isAuthenticated: user !== null, login, logout, refreshProfile }),
    [user, isLoading, login, logout, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
