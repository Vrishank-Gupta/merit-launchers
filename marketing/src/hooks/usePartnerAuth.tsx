import { createContext, useContext, useState, ReactNode } from "react";
import { partnerApi } from "@/lib/partnerApi";

interface PartnerAuthCtx {
  token: string | null;
  affiliate: any;
  isLoggedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const PartnerAuthContext = createContext<PartnerAuthCtx>({
  token: null,
  affiliate: null,
  isLoggedIn: false,
  signIn: async () => ({ error: null }),
  signOut: () => {},
});

export function PartnerAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("partner_token"));
  const [affiliate, setAffiliate] = useState<any>(() => {
    try {
      return JSON.parse(localStorage.getItem("partner_info") || "null");
    } catch {
      return null;
    }
  });

  const signIn = async (email: string, password: string) => {
    try {
      const { token: t, affiliate: a } = await partnerApi.login(email, password);
      localStorage.setItem("partner_token", t);
      localStorage.setItem("partner_info", JSON.stringify(a));
      setToken(t);
      setAffiliate(a);
      return { error: null };
    } catch (e: any) {
      return { error: e.message };
    }
  };

  const signOut = () => {
    localStorage.removeItem("partner_token");
    localStorage.removeItem("partner_info");
    setToken(null);
    setAffiliate(null);
  };

  return (
    <PartnerAuthContext.Provider value={{ token, affiliate, isLoggedIn: !!token, signIn, signOut }}>
      {children}
    </PartnerAuthContext.Provider>
  );
}

export const usePartnerAuth = () => useContext(PartnerAuthContext);
