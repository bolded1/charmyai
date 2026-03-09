import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product IDs for one-time purchases
const FIRM_PLAN_PRODUCT_ID = "prod_U7OoSyNLV7qab3";
const PRO_PLAN_PRODUCT_ID = "prod_U7PZ8dbaVYJKAv";
// Legacy subscription product IDs (monthly/annual)
const PRO_MONTHLY_PRODUCT_ID = "prod_U6lFbZZFmHhG8T";
const PRO_ANNUAL_PRODUCT_ID = "prod_U6lFBZgYR4YdhA";

const isProProduct = (id: string) => [PRO_PLAN_PRODUCT_ID, PRO_MONTHLY_PRODUCT_ID, PRO_ANNUAL_PRODUCT_ID].includes(id);

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

    // Helper: check promo entitlements
    const checkPromo = async () => {
      const { data: promoAccess } = await supabaseClient
        .from("promo_code_redemptions")
        .select("id, status, promo_code_id, discount_snapshot")
        .eq("user_id", user.id)
        .eq("status", "active")
        .limit(1);
      return promoAccess && promoAccess.length > 0 ? promoAccess[0] : null;
    };

    // Helper: provision firm entitlement on the user's organization
    const provisionFirmOrg = async () => {
      try {
        const { data: orgs } = await supabaseClient
          .from("organizations")
          .select("id, workspace_type, max_client_workspaces")
          .eq("owner_user_id", user.id)
          .in("workspace_type", ["standard", "accounting_firm"])
          .limit(1);

        if (orgs && orgs.length > 0) {
          const org = orgs[0];
          if (org.workspace_type !== "accounting_firm" || org.max_client_workspaces < 10) {
            logStep("Provisioning firm entitlement on org", { orgId: org.id });
            await supabaseClient
              .from("organizations")
              .update({ workspace_type: "accounting_firm", max_client_workspaces: 10 })
              .eq("id", org.id);
          }
        }
      } catch (err) {
        logStep("Error provisioning firm org", { error: String(err) });
      }
    };

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, checking promo entitlements");
      const promo = await checkPromo();
      if (promo) {
        logStep("Active promo entitlement found", { redemptionId: promo.id });
        return new Response(JSON.stringify({
          subscribed: true, plan: "pro", status: "promo_active",
          trial_end: null, current_period_end: null, cancel_at_period_end: false,
          has_firm_plan: false,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        subscribed: false, plan: "free", status: null,
        trial_end: null, current_period_end: null, cancel_at_period_end: false,
        has_firm_plan: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const customerId = customers.data[0].id;
    logStep("Customer found", { customerId });

    // Check for one-time firm plan purchase via completed checkout sessions
    let hasFirmPlan = false;
    let hasProPlan = false;
    let amountPaid: number | null = null;
    let paidCurrency: string = "eur";
    try {
      const sessions = await stripe.checkout.sessions.list({
        customer: customerId,
        limit: 100,
      });
      for (const session of sessions.data) {
        if (session.payment_status === "paid" && session.mode === "payment") {
          const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 5 });
          for (const item of lineItems.data) {
            const productId = typeof item.price?.product === "string" ? item.price.product : (item.price?.product as any)?.id;
            if (productId === FIRM_PLAN_PRODUCT_ID) {
              hasFirmPlan = true;
              // Capture actual amount paid (in cents -> convert to main unit)
              amountPaid = (session.amount_total ?? 0) / 100;
              paidCurrency = session.currency || "eur";
            }
            if (productId === PRO_PLAN_PRODUCT_ID) {
              hasProPlan = true;
              // Only set if not already set by firm plan
              if (amountPaid === null) {
                amountPaid = (session.amount_total ?? 0) / 100;
                paidCurrency = session.currency || "eur";
              }
            }
          }
          if (hasFirmPlan && hasProPlan) break;
        }
      }
      logStep("One-time plan check", { hasFirmPlan, hasProPlan, amountPaid, paidCurrency });
    } catch (err) {
      logStep("Error checking one-time plan sessions", { error: String(err) });
    }

    // Auto-provision firm entitlement on the organization when detected
    if (hasFirmPlan) {
      await provisionFirmOrg();
    }

    // Check subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No subscriptions found, checking promo and one-time purchases");
      const promo = await checkPromo();
      if (promo) {
        return new Response(JSON.stringify({
          subscribed: true, plan: hasFirmPlan ? "firm" : "pro", status: "promo_active",
          trial_end: null, current_period_end: null, cancel_at_period_end: false,
          has_firm_plan: hasFirmPlan, amount_paid: amountPaid, paid_currency: paidCurrency,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Check one-time purchases
      if (hasFirmPlan) {
        return new Response(JSON.stringify({
          subscribed: true, plan: "firm", status: "active",
          trial_end: null, current_period_end: null, cancel_at_period_end: false,
          has_firm_plan: true, amount_paid: amountPaid, paid_currency: paidCurrency,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      if (hasProPlan) {
        return new Response(JSON.stringify({
          subscribed: true, plan: "pro", status: "active",
          trial_end: null, current_period_end: null, cancel_at_period_end: false,
          has_firm_plan: false, amount_paid: amountPaid, paid_currency: paidCurrency,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({
        subscribed: false, plan: "free", status: null,
        trial_end: null, current_period_end: null, cancel_at_period_end: false,
        has_firm_plan: false,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price?.id;
    const isActive = sub.status === "active" || sub.status === "trialing";

    // Also check the subscription's product to detect firm/pro plan
    const subProductId = typeof sub.items.data[0]?.price?.product === "string"
      ? sub.items.data[0].price.product
      : (sub.items.data[0]?.price?.product as any)?.id;
    
    if (subProductId === FIRM_PLAN_PRODUCT_ID) {
      hasFirmPlan = true;
      await provisionFirmOrg();
    }
    if (subProductId === PRO_PLAN_PRODUCT_ID && !hasFirmPlan) {
      hasProPlan = true;
    }

    // Get actual amount paid from the latest paid invoice
    if (amountPaid === null) {
      try {
        const invoices = await stripe.invoices.list({
          customer: customerId,
          subscription: sub.id,
          status: "paid",
          limit: 1,
        });
        if (invoices.data.length > 0) {
          amountPaid = (invoices.data[0].amount_paid ?? 0) / 100;
          paidCurrency = invoices.data[0].currency || "eur";
        }
      } catch (err) {
        logStep("Error fetching invoice amount", { error: String(err) });
      }
    }

    logStep("Subscription found", { id: sub.id, status: sub.status, priceId, subProductId, hasFirmPlan, hasProPlan, amountPaid });

    const trialEndDate = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
    const periodEndDate = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;

    return new Response(JSON.stringify({
      subscribed: isActive || hasFirmPlan,
      plan: hasFirmPlan ? "firm" : isActive ? "pro" : "free",
      status: isActive ? sub.status : hasFirmPlan ? "active" : sub.status,
      price_id: priceId,
      subscription_id: sub.id,
      trial_end: trialEndDate,
      current_period_end: periodEndDate,
      cancel_at_period_end: sub.cancel_at_period_end,
      has_firm_plan: hasFirmPlan,
      amount_paid: amountPaid,
      paid_currency: paidCurrency,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: "An unexpected error occurred. Please try again." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
