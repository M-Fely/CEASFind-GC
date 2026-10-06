import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { getUserProfile } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // user: Firebase Auth user | null; profile: users/{uid} document | null
  const [state, setState] = useState({ user: null, profile: null, loading: true });

  const loadProfile = useCallback(async (user) => {
    let profile = null;
    try {
      profile = await getUserProfile(user.uid);
    } catch (err) {
      console.warn("Firestore profile fetch failed, using Auth defaults:", err);
    }
    setState({ user, profile, loading: false });
  }, []);

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => {
        if (!user) setState({ user: null, profile: null, loading: false });
        else loadProfile(user);
      }),
    [loadProfile],
  );

  const { user, profile } = state;
  const value = {
    ...state,
    displayName: profile?.displayName || user?.displayName || user?.email || "User",
    isAdmin: profile?.role === "admin",
    refreshProfile: () => user && loadProfile(user),
    logout: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
