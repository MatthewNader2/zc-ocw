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
  const [role, setRole] = useState(null);       // 'admin' | 'moderator' | null
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);  // true until first auth check resolves

  const isAdmin = role === "admin";
  const isModerator = role === "moderator";
  const isStaff = isAdmin || isModerator;

  // Ask the Worker whether the current token belongs to an admin or moderator.
  const refreshRole = useCallback(async () => {
    if (!WORKER_URL) {
      setRole(null);
      setIsSuperAdmin(false);
      return;
    }
    try {
      const token = await getIdToken();
      if (!token) {
        setRole(null);
        setIsSuperAdmin(false);
        return;
      }
      const res = await fetch(`${WORKER_URL}/api/admins/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRole(data.role || (data.isAdmin ? "admin" : null));
      setIsSuperAdmin(!!data.isSuperAdmin);
    } catch {
      setRole(null);
      setIsSuperAdmin(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = watchAuthState(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await refreshRole();
      } else {
        setRole(null);
        setIsSuperAdmin(false);
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
    setRole(null);
    setIsSuperAdmin(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAdmin,
        isModerator,
        isStaff,
        canModerate: isStaff,
        isSuperAdmin,
        loading,
        isFirebaseConfigured,
        getIdToken,
        refreshRole,
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
