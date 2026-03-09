import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const STRIPE_PLANS = {
  pro: {
    name: "Pro",
    price_monthly: 9.99,
    price_yearly: 99,
    price_id_monthly: "price_1T8XiYBmkvUKJ0fulbvWmmQN",
    price_id_yearly: "price_1T8XixBmkvUKJ0fuFUP1JDl7",
    product_id_monthly: "prod_U6lFbZZFmHhG8T",
    product_id_yearly: "prod_U6lFBZgYR4YdhA",
    trial_days: 7,
    features: [
      "Unlimited documents",
      "AI data extraction",
      "Team access (up to 10 users)",
      "Priority support",
      "Email import",
      "Custom export templates",
      "Contacts management",
      "CSV & Excel exports",
    ],
  },
  firm: {
    name: "Accounting Firm",
    price_onetime: 99,
    price_id: "price_1T9A0dBmkvUKJ0fuiFeIMzov",
    product_id: "prod_U7OoSyNLV7qab3",
    max_workspaces: 10,
    features: [
      "Up to 10 client workspaces",
      "Accountant dashboard",
      "Workspace switching",
      "Document processing per workspace",
      "Exports per workspace",
      "Team access support",
      "All Pro features included",
      "One-time payment — no recurring fees",
    ],
  },
} as const;

export interface SubscriptionState {
  subscribed: boolean;
  plan: "pro" | "firm" | "none";
  status: string | null;
  price_id: string | null;
  subscription_id: string | null;
  trial_end: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  has_firm_plan: boolean;
  loading: boolean;
}

export function useSubscription() {
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    plan: "none",
    status: null,
    price_id: null,
    subscription_id: null,
    trial_end: null,
    current_period_end: null,
    cancel_at_period_end: false,
    has_firm_plan: false,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, subscribed: false, status: null, loading: false }));
        return;
      }

      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;

      const hasFirm = data.has_firm_plan ?? false;
      const plan = hasFirm ? "firm" : data.subscribed ? "pro" : "none";

      setState({
        subscribed: data.subscribed ?? false,
        plan,
        status: data.status ?? null,
        price_id: data.price_id ?? null,
        subscription_id: data.subscription_id ?? null,
        trial_end: data.trial_end ?? null,
        current_period_end: data.current_period_end ?? null,
        cancel_at_period_end: data.cancel_at_period_end ?? false,
        has_firm_plan: hasFirm,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to check subscription:", err);
      setState(prev => ({
        ...prev,
        subscribed: false,
        plan: "none",
        status: null,
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  const startCheckout = async (priceId: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { priceId },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  const openCustomerPortal = async () => {
    const { data, error } = await supabase.functions.invoke("customer-portal");
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank");
    }
  };

  const billingInterval = state.price_id === STRIPE_PLANS.pro.price_id_yearly ? "yearly" : "monthly";

  return {
    ...state,
    billingInterval,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
  };
}
