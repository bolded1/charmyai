import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[ACTIVATE-TRIAL] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    const { priceId, paymentMethodId, promoCodeId, stripeCouponId, extraTrialDays, skipCard } = await req.json();
    if (!priceId) throw new Error("priceId is required");
    if (!paymentMethodId && !skipCard) throw new Error("paymentMethodId is required");
    logStep("Params received", { priceId, paymentMethodId, promoCodeId, stripeCouponId, extraTrialDays, skipCard });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }
    logStep("Customer resolved", { customerId });

    // Set default payment method on customer (only if card provided)
    if (paymentMethodId) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
      logStep("Default payment method set");
    }

    // Check for existing active subscription
    const existingSubs = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (existingSubs.data.length > 0) {
      const existing = existingSubs.data[0];
      if (existing.status === "active" || existing.status === "trialing") {
        logStep("Already has active subscription", { id: existing.id, status: existing.status });
        return new Response(JSON.stringify({
          success: true,
          subscription_id: existing.id,
          status: existing.status,
          message: "Already subscribed",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // No trial - direct activation
    logStep("Creating subscription without trial");

    // Build subscription params
    const subParams: any = {
      customer: customerId,
      items: [{ price: priceId }],
      trial_period_days: trialDays,
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
    };

    // Only set payment method if provided
    if (paymentMethodId) {
      subParams.default_payment_method = paymentMethodId;
    }

    // Apply Stripe coupon if provided
    if (stripeCouponId) {
      subParams.coupon = stripeCouponId;
      logStep("Stripe coupon applied", { stripeCouponId });
    }

    // Create subscription
    const subscription = await stripe.subscriptions.create(subParams);

    logStep("Subscription created", {
      id: subscription.id,
      status: subscription.status,
      trialEnd: subscription.trial_end,
    });

    // Record promo code redemption if applicable
    if (promoCodeId) {
      try {
        // Insert redemption record
        await supabaseClient.from("promo_code_redemptions").insert({
          promo_code_id: promoCodeId,
          user_id: user.id,
          subscription_id: subscription.id,
          discount_snapshot: { stripeCouponId, extraTrialDays, priceId },
          status: "active",
        });

        // Increment redemption counter
        await supabaseClient.rpc("increment_promo_redemptions" as any, { _promo_code_id: promoCodeId });
        
        logStep("Promo redemption recorded", { promoCodeId });
      } catch (redeemErr) {
        // Non-blocking: log but don't fail the subscription
        logStep("Warning: failed to record redemption", { error: String(redeemErr) });
        
        // Fallback: try direct update
        try {
          const { data: currentCode } = await supabaseClient
            .from("promo_codes")
            .select("current_redemptions")
            .eq("id", promoCodeId)
            .single();
          
          if (currentCode) {
            await supabaseClient
              .from("promo_codes")
              .update({ current_redemptions: (currentCode.current_redemptions || 0) + 1 })
              .eq("id", promoCodeId);
          }
        } catch (fallbackErr) {
          logStep("Warning: fallback redemption update also failed", { error: String(fallbackErr) });
        }
      }
    }

    // Mark billing setup as completed on the user's profile
    try {
      await supabaseClient
        .from("profiles")
        .update({ billing_setup_at: new Date().toISOString() })
        .eq("user_id", user.id);
      logStep("billing_setup_at flag set on profile");
    } catch (profileErr) {
      logStep("Warning: failed to set billing_setup_at", { error: String(profileErr) });
    }

    // Log audit event for trial activation
    try {
      await supabaseClient.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "trial_activated",
        entity_type: "subscription",
        entity_id: subscription.id,
        details: `Trial activated (${trialDays} days)${promoCodeId ? ' with promo code' : ''}`,
        metadata: {
          subscription_id: subscription.id,
          status: subscription.status,
          trial_days: trialDays,
          price_id: priceId,
          promo_code_id: promoCodeId || null,
          skip_card: skipCard || false,
        },
      });
    } catch (auditErr) {
      logStep("Warning: audit log insert failed", { error: String(auditErr) });
    }

    return new Response(JSON.stringify({
      success: true,
      subscription_id: subscription.id,
      status: subscription.status,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
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
