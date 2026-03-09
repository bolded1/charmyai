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
      await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
      logStep("Payment method attached and set as default");
    }

    // Check for existing active entitlement (one-time purchase or promo)
    const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 100 });
    for (const session of sessions.data) {
      if (session.payment_status === "paid" && session.mode === "payment") {
        logStep("Already has a completed payment", { sessionId: session.id });
        return new Response(JSON.stringify({
          success: true,
          status: "active",
          message: "Already has active plan",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let resultStatus = "active";
    let paymentIntentId: string | null = null;

    if (skipCard) {
      // Free access via promo code — no Stripe payment needed
      // Just record the promo redemption; check-subscription reads promo_code_redemptions
      logStep("Skip card flow — free promo activation");
    } else if (paymentMethodId) {
      // One-time payment with card
      logStep("Creating one-time payment intent");

      // Get price details to determine amount
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount;
      if (!amount) throw new Error("Could not determine price amount");

      const piParams: any = {
        amount,
        currency: price.currency || "eur",
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        metadata: {
          supabase_user_id: user.id,
          price_id: priceId,
          product_id: typeof price.product === "string" ? price.product : "",
        },
      };

      // Apply coupon discount if provided
      if (stripeCouponId) {
        try {
          const coupon = await stripe.coupons.retrieve(stripeCouponId);
          if (coupon.percent_off) {
            piParams.amount = Math.round(amount * (1 - coupon.percent_off / 100));
          } else if (coupon.amount_off) {
            piParams.amount = Math.max(0, amount - coupon.amount_off);
          }
          logStep("Coupon applied to payment", { stripeCouponId, originalAmount: amount, newAmount: piParams.amount });
        } catch (couponErr) {
          logStep("Warning: coupon retrieval failed, charging full price", { error: String(couponErr) });
        }
      }

      if (piParams.amount <= 0) {
        // Fully discounted — treat as free
        logStep("Fully discounted — skipping payment");
      } else {
        const paymentIntent = await stripe.paymentIntents.create(piParams);
        paymentIntentId = paymentIntent.id;

        if (paymentIntent.status !== "succeeded") {
          logStep("Payment not succeeded", { status: paymentIntent.status });
          return new Response(JSON.stringify({
            error: "Payment was not completed. Please try again.",
            status: paymentIntent.status,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          });
        }

        logStep("Payment succeeded", { paymentIntentId });
      }
    } else {
      throw new Error("paymentMethodId is required when skipCard is not set");
    }

    // Record promo code redemption if applicable
    if (promoCodeId) {
      try {
        await supabaseClient.from("promo_code_redemptions").insert({
          promo_code_id: promoCodeId,
          user_id: user.id,
          subscription_id: paymentIntentId,
          discount_snapshot: { stripeCouponId, extraTrialDays, priceId },
          status: "active",
        });

        // Increment redemption counter (fallback approach)
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
        } catch (counterErr) {
          logStep("Warning: redemption counter update failed", { error: String(counterErr) });
        }

        logStep("Promo redemption recorded", { promoCodeId });
      } catch (redeemErr) {
        logStep("Warning: failed to record redemption", { error: String(redeemErr) });
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

    // Log audit event
    try {
      await supabaseClient.from("audit_logs").insert({
        user_id: user.id,
        user_email: user.email,
        action: "plan_activated",
        entity_type: "payment",
        entity_id: paymentIntentId || "promo_free",
        details: `Plan activated${promoCodeId ? ' with promo code' : ''}${skipCard ? ' (free access)' : ''}`,
        metadata: {
          payment_intent_id: paymentIntentId,
          status: resultStatus,
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
      status: resultStatus,
      payment_intent_id: paymentIntentId,
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
