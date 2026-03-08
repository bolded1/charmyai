import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[ADMIN-SUBSCRIPTION] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    // Check platform_admin role
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "platform_admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized: platform_admin required");
    logStep("Admin verified", { userId: user.id });

    const { action, ...params } = await req.json();
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let result: any;

    switch (action) {
      case "list_subscriptions": {
        const subs = await stripe.subscriptions.list({
          limit: 100,
          expand: ["data.customer", "data.items.data.price"],
        });
        result = await Promise.all(subs.data.map(async (sub: any) => {
          const price = sub.items.data[0]?.price;
          let productName = "Unknown";
          if (price?.product) {
            try {
              const product = await stripe.products.retrieve(typeof price.product === "string" ? price.product : price.product.id);
              productName = product.name || "Unknown";
            } catch { /* ignore */ }
          }

          let trialEnd = null;
          try { if (sub.trial_end) trialEnd = new Date(sub.trial_end * 1000).toISOString(); } catch { /* ignore */ }
          let periodEnd = null;
          try { if (sub.current_period_end) periodEnd = new Date(sub.current_period_end * 1000).toISOString(); } catch { /* ignore */ }
          let created = null;
          try { if (sub.created) created = new Date(sub.created * 1000).toISOString(); } catch { /* ignore */ }

          return {
            id: sub.id,
            status: sub.status,
            customer_email: sub.customer?.email || "Unknown",
            customer_name: sub.customer?.name || sub.customer?.email || "Unknown",
            customer_id: sub.customer?.id || sub.customer,
            price_id: price?.id,
            product_name: productName,
            amount: price?.unit_amount,
            currency: price?.currency,
            interval: price?.recurring?.interval,
            trial_end: trialEnd,
            current_period_end: periodEnd,
            cancel_at_period_end: sub.cancel_at_period_end,
            created,
          };
        }));
        logStep("Listed subscriptions", { count: result.length });
        break;
      }

      case "cancel_subscription": {
        const { subscriptionId } = params;
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
        result = { success: true, message: "Subscription will cancel at period end" };
        logStep("Cancelled subscription", { subscriptionId });
        break;
      }

      case "cancel_immediately": {
        const { subscriptionId } = params;
        await stripe.subscriptions.cancel(subscriptionId);
        result = { success: true, message: "Subscription cancelled immediately" };
        logStep("Cancelled immediately", { subscriptionId });
        break;
      }

      case "extend_trial": {
        const { subscriptionId, days } = params;
        const trialEnd = Math.floor(Date.now() / 1000) + (days * 86400);
        await stripe.subscriptions.update(subscriptionId, {
          trial_end: trialEnd,
        });
        result = { success: true, message: `Trial extended by ${days} days` };
        logStep("Extended trial", { subscriptionId, days });
        break;
      }

      case "grant_free": {
        // Create a free subscription by giving 100% coupon
        const { customerEmail } = params;
        const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
        if (customers.data.length === 0) throw new Error("Customer not found");
        const customerId = customers.data[0].id;

        // Create a 100% off forever coupon if it doesn't exist
        let coupon: any;
        try {
          coupon = await stripe.coupons.retrieve("charmy_free_forever");
        } catch {
          coupon = await stripe.coupons.create({
            id: "charmy_free_forever",
            percent_off: 100,
            duration: "forever",
            name: "Free Plan (Admin Granted)",
          });
        }

        // Cancel existing subs first
        const existingSubs = await stripe.subscriptions.list({ customer: customerId, status: "active" });
        for (const sub of existingSubs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }

        // Create new sub with coupon
        const sub = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: "price_1T8XiYBmkvUKJ0fulbvWmmQN" }],
          coupon: coupon.id,
        });

        result = { success: true, message: "Free plan granted", subscriptionId: sub.id };
        logStep("Granted free plan", { customerEmail, subscriptionId: sub.id });
        break;
      }

      case "change_plan": {
        const { subscriptionId, newPriceId } = params;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        await stripe.subscriptions.update(subscriptionId, {
          items: [{
            id: sub.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: "create_prorations",
        });
        result = { success: true, message: "Plan changed successfully" };
        logStep("Changed plan", { subscriptionId, newPriceId });
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
