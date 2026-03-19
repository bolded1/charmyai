import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[VALIDATE-PROMO] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { code, billingCycle, plan } = await req.json();
    if (!code) throw new Error("Promo code is required");
    logStep("Validating code", { code, billingCycle, plan });

    // Look up the promo code (case-insensitive)
    const { data: promoCode, error: fetchError } = await supabaseClient
      .from("promo_codes")
      .select("*")
      .ilike("code", code.trim())
      .eq("active", true)
      .single();

    if (fetchError || !promoCode) {
      return new Response(JSON.stringify({ valid: false, error: "Invalid or expired promo code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    logStep("Code found", { id: promoCode.id, type: promoCode.discount_type });

    // Check date range
    const now = new Date();
    if (promoCode.start_date && new Date(promoCode.start_date) > now) {
      return new Response(JSON.stringify({ valid: false, error: "This promo code is not yet active" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (promoCode.end_date && new Date(promoCode.end_date) < now) {
      return new Response(JSON.stringify({ valid: false, error: "This promo code has expired" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max redemptions
    if (promoCode.max_redemptions && promoCode.current_redemptions >= promoCode.max_redemptions) {
      return new Response(JSON.stringify({ valid: false, error: "This promo code has reached its usage limit" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check per-user/org redemptions
    const { count: userRedemptions } = await supabaseClient
      .from("promo_code_redemptions")
      .select("*", { count: "exact", head: true })
      .eq("promo_code_id", promoCode.id)
      .eq("user_id", user.id);

    if (promoCode.max_redemptions_per_org && (userRedemptions ?? 0) >= promoCode.max_redemptions_per_org) {
      return new Response(JSON.stringify({ valid: false, error: "You have already used this promo code" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check billing cycle eligibility
    const billingMatch = promoCode.applies_to_billing === "both"
      || !billingCycle
      || promoCode.applies_to_billing === billingCycle
      || (["lifetime", "onetime"].includes(promoCode.applies_to_billing) && ["lifetime", "onetime"].includes(billingCycle));
    if (!billingMatch) {
      return new Response(JSON.stringify({ valid: false, error: `This code only applies to ${promoCode.applies_to_billing} billing` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check plan eligibility
    if (promoCode.applies_to_plans && plan && !promoCode.applies_to_plans.includes(plan)) {
      return new Response(JSON.stringify({ valid: false, error: "This code does not apply to your selected plan" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build discount description
    let discountLabel = "";
    const type = promoCode.discount_type;
    const value = promoCode.discount_value;

    if (type === "percentage") {
      discountLabel = `${value}% off`;
      if (promoCode.recurring_cycles) discountLabel += ` for ${promoCode.recurring_cycles} months`;
      if (value === 100 && promoCode.free_duration_months) {
        discountLabel = `100% off for ${promoCode.free_duration_months} month${promoCode.free_duration_months > 1 ? 's' : ''}`;
      }
      if (value === 100 && !promoCode.free_duration_months && !promoCode.recurring_cycles) {
        discountLabel = "Free forever";
      }
    } else if (type === "fixed") {
      discountLabel = `€${value} off`;
      if (promoCode.recurring_cycles) discountLabel += ` for ${promoCode.recurring_cycles} months`;
    } else if (type === "trial_extension") {
      discountLabel = `${promoCode.extra_trial_days} extra trial days`;
    } else if (type === "free_period") {
      discountLabel = `Free for ${promoCode.free_duration_months} month${(promoCode.free_duration_months ?? 0) > 1 ? 's' : ''}`;
    }

    logStep("Code valid", { discountLabel });

    return new Response(JSON.stringify({
      valid: true,
      promo_code_id: promoCode.id,
      discount_type: promoCode.discount_type,
      discount_value: promoCode.discount_value,
      discount_label: discountLabel,
      requires_card: promoCode.requires_card,
      stacks_with_trial: promoCode.stacks_with_trial,
      extra_trial_days: promoCode.extra_trial_days || 0,
      free_duration_months: promoCode.free_duration_months,
      recurring_cycles: promoCode.recurring_cycles,
      applies_to_first_only: promoCode.applies_to_first_only,
      stripe_coupon_id: promoCode.stripe_coupon_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ valid: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
