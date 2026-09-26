"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api, aloionLoginURL, clearSession, storeSession } from "./api";
import type { User } from "./types";

interface SessionValue {
  user: User | null;
  loading: boolean;
  login: (returnTo?: string) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionValue>({
  user: null,
  loading: true,
  login: () => undefined,
  logout: () => undefined,
  refresh: async () => undefined,
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      setUser(await api.me());
    } catch {
      setUser(null);
    }
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        try {
          const session = await api.exchange(code);
          storeSession(session.token, session.refresh_token);
          if (!cancelled) setUser(session.user);
        } catch {
          clearSession();
        }
        url.searchParams.delete("code");
        window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
      }
      if (!cancelled && !code) await refresh();
      if (!cancelled && code) {
        try {
          setUser(await api.me());
        } catch {
          setUser(null);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        login: (returnTo) => {
          window.location.href = aloionLoginURL(returnTo || window.location.href);
        },
        logout: () => {
          clearSession();
          setUser(null);
          window.location.href = "/";
        },
        refresh,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
