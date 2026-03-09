import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CHECK-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking promo entitlements");

      // Check for promo-based free access (no Stripe subscription needed)
      const { data: promoAccess } = await supabaseClient
        .from("promo_code_redemptions")
        .select("id, status, promo_code_id, discount_snapshot")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (promoAccess && promoAccess.length > 0) {
        logStep("Active promo entitlement found", { redemptionId: promoAccess[0].id });
        return new Response(JSON.stringify({
          subscribed: true,
          plan: "pro",
          status: "promo_active",
          trial_end: null,
          current_period_end: null,
          cancel_at_period_end: false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        subscribed: false,
        plan: "free",
        status: null,
        trial_end: null,
        current_period_end: null,
        cancel_at_period_end: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    // Check subscriptions (any status, not just active)
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No subscriptions found, checking promo entitlements");

      // Fallback: check promo-based access
      const { data: promoAccess } = await supabaseClient
        .from("promo_code_redemptions")
        .select("id, status, promo_code_id, discount_snapshot")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);

      if (promoAccess && promoAccess.length > 0) {
        logStep("Active promo entitlement found (no Stripe sub)", { redemptionId: promoAccess[0].id });
        return new Response(JSON.stringify({
          subscribed: true,
          plan: "pro",
          status: "promo_active",
          trial_end: null,
          current_period_end: null,
          cancel_at_period_end: false,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        subscribed: false,
        plan: "free",
        status: null,
        trial_end: null,
        current_period_end: null,
        cancel_at_period_end: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price?.id;
    const isActive = sub.status === "active" || sub.status === "trialing";

    logStep("Subscription found", {
      id: sub.id,
      status: sub.status,
      priceId,
      trialEnd: sub.trial_end,
    });

    const trialEndDate = sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null;
    const periodEndDate = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString()
      : null;

    return new Response(JSON.stringify({
      subscribed: isActive,
      plan: isActive ? "pro" : "free",
      status: sub.status,
      price_id: priceId,
      subscription_id: sub.id,
      trial_end: trialEndDate,
      current_period_end: periodEndDate,
      cancel_at_period_end: sub.cancel_at_period_end,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
