import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PromoValidation {
  valid: boolean;
  error?: string;
  promo_code_id?: string;
  discount_type?: string;
  discount_value?: number;
  discount_label?: string;
  requires_card?: boolean;
  stacks_with_trial?: boolean;
  extra_trial_days?: number;
  free_duration_months?: number | null;
  recurring_cycles?: number | null;
  applies_to_first_only?: boolean;
  stripe_coupon_id?: string | null;
}

export function usePromoCode() {
  const [validating, setValidating] = useState(false);
  const [promoResult, setPromoResult] = useState<PromoValidation | null>(null);

  const validateCode = async (code: string, billingCycle?: string, plan?: string): Promise<PromoValidation> => {
    if (!code.trim()) {
      const result = { valid: false, error: "Please enter a promo code" };
      setPromoResult(result);
      return result;
    }

    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke("validate-promo-code", {
        body: { code: code.trim(), billingCycle, plan },
      });

      if (error) throw error;

      const result: PromoValidation = data;
      setPromoResult(result);
      return result;
    } catch (err: any) {
      const result = { valid: false, error: err.message || "Failed to validate code" };
      setPromoResult(result);
      return result;
    } finally {
      setValidating(false);
    }
  };

  const clearPromo = () => setPromoResult(null);

  return { validateCode, clearPromo, validating, promoResult };
}
