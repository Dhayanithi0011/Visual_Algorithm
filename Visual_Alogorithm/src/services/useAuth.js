// src/services/useAuth.js

import { useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

// Use redirect on deployed (non-localhost) environments — popups are blocked
// by many browsers on third-party domains. Redirect is universally reliable.
const IS_LOCAL = window.location.hostname === "localhost" ||
                 window.location.hostname === "127.0.0.1";

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ── Handle redirect result first (fires after Google redirect back) ────
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((err) => {
        // Ignore popup-closed / cancelled errors
        if (err.code !== "auth/popup-closed-by-user" &&
            err.code !== "auth/cancelled-popup-request") {
          console.error("getRedirectResult error:", err.code);
        }
      });

    // ── Listen to ongoing auth state ──────────────────────────────────────
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Google — popup on localhost, redirect on Vercel/production ───────────
  const signInWithGoogle = async () => {
    if (IS_LOCAL) {
      return signInWithPopup(auth, googleProvider);
    } else {
      // signInWithRedirect does NOT return a promise with the user —
      // the result is picked up by getRedirectResult() above after page reload.
      await signInWithRedirect(auth, googleProvider);
    }
  };

  // ── Email / Password ──────────────────────────────────────────────────────
  const registerWithEmail = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Force refresh so displayName is visible immediately
    setUser({ ...cred.user, displayName: name });
    return cred.user;
  };

  const signInWithEmail = (email, password) =>
    signInWithEmailAndPassword(auth, email, password);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = () => signOut(auth);

  return {
    user,
    loading,
    signInWithGoogle,
    registerWithEmail,
    signInWithEmail,
    resetPassword,
    logout,
  };
}
