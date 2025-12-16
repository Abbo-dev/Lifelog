import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState("free");
  const [planLoading, setPlanLoading] = useState(true);

  const refreshPlan = useCallback(async (uidOverride) => {
    const uid = uidOverride || auth.currentUser?.uid;
    if (!uid) {
      setPlan("free");
      setPlanLoading(false);
      return "free";
    }

    setPlanLoading(true);
    try {
      const profileRef = doc(db, "users", uid);
      const snapshot = await getDoc(profileRef);
      if (!snapshot.exists()) {
        await setDoc(
          profileRef,
          {
            plan: "free",
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        setPlan("free");
        return "free";
      }

      const nextPlan = snapshot.data()?.plan === "premium" ? "premium" : "free";
      setPlan(nextPlan);
      return nextPlan;
    } catch (error) {
      console.error("Failed to load plan", error);
      setPlan("free");
      return "free";
    } finally {
      setPlanLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!alive) return;
      setUser(nextUser);
      setLoading(false);
      if (!nextUser) {
        setPlan("free");
        setPlanLoading(false);
        return;
      }
      await refreshPlan(nextUser.uid);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [refreshPlan]);

  const value = {
    user,
    loading,
    plan,
    planLoading,
    isPremium: plan === "premium",
    refreshPlan,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 
