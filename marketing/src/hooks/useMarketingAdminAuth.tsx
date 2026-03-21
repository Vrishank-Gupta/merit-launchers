import { createContext, useContext, useState, ReactNode } from "react";
import { marketingAdminApi } from "@/lib/partnerApi";

interface MAAuthCtx {
  token: string | null;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const MAAuthContext = createContext<MAAuthCtx>({
  token: null,
  isLoggedIn: false,
  signIn: async () => ({ error: null }),
  signOut: () => {},
});

export function MAAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ma_token"));
  const isLoggedIn = !!token;

  const signIn = async (email: string, password: string) => {
    try {
      const { token: t } = await marketingAdminApi.login(email, password);
      localStorage.setItem("ma_token", t);
      setToken(t);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const signOut = () => {
    localStorage.removeItem("ma_token");
    setToken(null);
  };

  return (
    <MAAuthContext.Provider value={{ token, isLoggedIn, signIn, signOut }}>
      {children}
    </MAAuthContext.Provider>
  );
}

export const useMAAuth = () => useContext(MAAuthContext);
