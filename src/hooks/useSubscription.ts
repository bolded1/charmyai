import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export const STRIPE_PLANS = {
  pro: {
    name: "Pro",
    price_onetime: 29.99,
    price_id: "price_1T9AklBmkvUKJ0fuE3YD85rg",
    product_id: "prod_U7PZ8dbaVYJKAv",
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
  firm_upgrade: {
    name: "Firm Plan Upgrade (from Pro)",
    price_onetime: 69.01,
    price_id: "price_1TCjDtBmkvUKJ0fuIjMPIqlN",
    product_id: "prod_UB5OgAq3lOdScN",
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
  amount_paid: number | null;
  paid_currency: string;
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
    amount_paid: null,
    paid_currency: "eur",
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
      const backendPlan = data.plan as string | undefined;
      const plan: "pro" | "firm" | "none" = backendPlan === "firm" ? "firm" : backendPlan === "pro" ? "pro" : hasFirm ? "firm" : data.subscribed ? "pro" : "none";

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
        amount_paid: data.amount_paid ?? null,
        paid_currency: data.paid_currency ?? "eur",
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

  return {
    ...state,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
  };
}
