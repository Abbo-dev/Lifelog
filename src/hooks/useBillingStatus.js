import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const emptyBilling = {
  status: null,
  customerId: null,
  subscriptionId: null,
  nextBilledAt: null,
  updatedAt: null,
  lastEventType: null,
  loaded: false,
  error: "",
};

export function useBillingStatus(userId) {
  const [billing, setBilling] = useState(emptyBilling);

  useEffect(() => {
    if (!userId) {
      setBilling(emptyBilling);
      return undefined;
    }

    const profileRef = doc(db, "users", userId);
    const unsubscribe = onSnapshot(
      profileRef,
      (snapshot) => {
        const data = snapshot.data() || {};
        setBilling({
          status: data.paddleSubscriptionStatus || null,
          customerId: data.paddleCustomerId || null,
          subscriptionId: data.paddleSubscriptionId || null,
          nextBilledAt: data.paddleNextBilledAt || null,
          updatedAt: data.updatedAt || null,
          lastEventType: data.paddleLastEventType || null,
          loaded: true,
          error: "",
        });
      },
      (error) => {
        console.error("Failed to load billing status", error);
        setBilling({
          ...emptyBilling,
          loaded: true,
          error: error?.message || "Unable to load billing status.",
        });
      }
    );

    return unsubscribe;
  }, [userId]);

  return billing;
}
