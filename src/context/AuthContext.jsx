import { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  isFirebaseConfigured,
  watchAuthState,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  signOutUser,
  getIdToken,
} from "@/services/firebase";

const AuthContext = createContext(null);

const WORKER_URL = import.meta.env.VITE_WORKER_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // Firebase user, or null
  const [isAdmin, setIsAdmin] = useState(false); // server-verified role
  const [loading, setLoading] = useState(true);  // true until first auth check resolves

  // Ask the Worker whether the current token belongs to an admin. This is
  // the source of truth — never trust a client-side flag for this, since
  // it gates admin-only routes that themselves re-check the token anyway.
  const refreshRole = useCallback(async () => {
    if (!WORKER_URL) return setIsAdmin(false);
    try {
      const token = await getIdToken();
      const res = await fetch(`${WORKER_URL}/api/admins/me`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setIsAdmin(!!data.isAdmin);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshRole();
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [refreshRole]);

  const loginWithGoogle = useCallback(async () => {
    await signInWithGoogle();
    await refreshRole();
  }, [refreshRole]);

  const loginWithEmail = useCallback(async (email, password) => {
    await signInWithEmail(email, password);
    await refreshRole();
  }, [refreshRole]);

  const signup = useCallback(async (email, password, displayName) => {
    await signUpWithEmail(email, password, displayName);
    await refreshRole();
  }, [refreshRole]);

  const logout = useCallback(async () => {
    await signOutUser();
    setIsAdmin(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        isFirebaseConfigured,
        getIdToken,
        loginWithGoogle,
        loginWithEmail,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
