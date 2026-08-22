/**
 * src/services/firebase.js
 *
 * Firebase Authentication only — course content, materials, and the
 * acknowledgments config all still live in Cloudflare D1 via
 * services/cloudflare.js. Firebase is purely "who is this user."
 *
 * Requires these in your .env (see DEPLOYMENT.md for where to get them):
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_APP_ID
 */
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Guard so Vite's dev-server HMR doesn't re-init the app on every edit.
const app = isFirebaseConfigured
  ? getApps()[0] || initializeApp(firebaseConfig)
  : null;

export const auth = app ? getAuth(app) : null;

const googleProvider = new GoogleAuthProvider();

export function watchAuthState(callback) {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGoogle() {
  if (!auth) throw new Error("Firebase isn't configured — check your .env");
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signInWithEmail(email, password) {
  if (!auth) throw new Error("Firebase isn't configured — check your .env");
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(email, password, displayName) {
  if (!auth) throw new Error("Firebase isn't configured — check your .env");
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function signOutUser() {
  if (!auth) return;
  await firebaseSignOut(auth);
}

// Fresh ID token for calling the Worker API. Firebase automatically
// refreshes this under the hood — force=true only when you know the old
// one was just rejected as expired.
export async function getIdToken(force = false) {
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken(force);
}
