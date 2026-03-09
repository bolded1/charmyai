import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[CREATE-CHECKOUT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

// One-time price IDs (payment mode)
const ONE_TIME_PRICE_IDS = new Set([
  "price_1T9A0dBmkvUKJ0fuiFeIMzov", // Accounting Firm Plan €99
  "price_1T9AklBmkvUKJ0fuE3YD85rg", // Pro Plan €29.99
]);

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
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { email: user.email });

    const { priceId, stripeCouponId, embedded } = await req.json();
    if (!priceId) throw new Error("priceId is required");
    logStep("Price ID received", { priceId, stripeCouponId, embedded });

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

    const origin = req.headers.get("origin") || "https://charmyai.lovable.app";
    const isOneTime = ONE_TIME_PRICE_IDS.has(priceId);

    const successUrl = `${origin}/app/settings?tab=billing&checkout=success`;

    const sessionParams: any = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isOneTime ? "payment" : "subscription",
      metadata: {
        supabase_user_id: user.id,
        plan_type: isOneTime ? "firm" : "pro",
      },
    };

    // Embedded mode returns client_secret instead of URL
    if (embedded) {
      sessionParams.ui_mode = "embedded";
      sessionParams.return_url = `${successUrl}&session_id={CHECKOUT_SESSION_ID}`;
    } else {
      sessionParams.success_url = successUrl;
      sessionParams.cancel_url = `${origin}/app/settings?tab=billing&checkout=cancelled`;
    }

    // Apply Stripe coupon/discount if provided
    if (stripeCouponId) {
      sessionParams.discounts = [{ coupon: stripeCouponId }];
      logStep("Coupon applied to checkout", { stripeCouponId });
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    logStep("Checkout session created", { sessionId: session.id, mode: isOneTime ? "payment" : "subscription", embedded });

    if (embedded) {
      return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
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
