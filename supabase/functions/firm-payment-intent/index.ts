import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[FIRM-PAYMENT-INTENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    // Check if user already has a Pro plan — charge upgrade price (€69.01) instead of full (€99)
    let isUpgrade = false;
    try {
      const subs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
      for (const sub of subs.data) {
        const prodId = typeof sub.items.data[0]?.price?.product === "string"
          ? sub.items.data[0].price.product
          : (sub.items.data[0]?.price?.product as any)?.id;
        if (["prod_U7PZ8dbaVYJKAv", "prod_U6lFbZZFmHhG8T", "prod_U6lFBZgYR4YdhA"].includes(prodId)) {
          isUpgrade = true;
          break;
        }
      }
      if (!isUpgrade) {
        // Check one-time pro purchases
        const sessions = await stripe.checkout.sessions.list({ customer: customerId, limit: 50 });
        for (const session of sessions.data) {
          if (session.payment_status === "paid" && session.mode === "payment") {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
            for (const item of lineItems.data) {
              const pid = typeof item.price?.product === "string" ? item.price.product : (item.price?.product as any)?.id;
              if (pid === "prod_U7PZ8dbaVYJKAv") { isUpgrade = true; break; }
            }
            if (isUpgrade) break;
          }
        }
      }
    } catch (err) {
      logStep("Error checking pro status for upgrade pricing", { error: String(err) });
    }

    const amount = isUpgrade ? 6901 : 9900;
    const priceId = isUpgrade ? "price_1TCjDtBmkvUKJ0fuIjMPIqlN" : "price_1T9A0dBmkvUKJ0fuiFeIMzov";
    logStep("Payment amount determined", { isUpgrade, amount });

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "eur",
      customer: customerId,
      metadata: {
        supabase_user_id: user.id,
        plan_type: "firm",
        price_id: priceId,
        is_upgrade: isUpgrade ? "true" : "false",
      },
      payment_method_types: ["card"],
    });

    logStep("PaymentIntent created", { id: paymentIntent.id });

    return new Response(JSON.stringify({
      client_secret: paymentIntent.client_secret,
      customer_id: customerId,
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
