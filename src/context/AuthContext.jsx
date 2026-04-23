import { createContext, useContext, useState, useCallback } from "react";
import {
  getAdminSession,
  setAdminSession,
  clearAdminSession,
} from "@/services/storage";

const AuthContext = createContext(null);

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export function AuthProvider({ children }) {
  const [isAdmin, setIsAdmin] = useState(() => {
    const session = getAdminSession();
    return session === "authenticated";
  });

  const login = useCallback((password) => {
    if (password === ADMIN_PASSWORD) {
      setAdminSession("authenticated");
      setIsAdmin(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
