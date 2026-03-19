import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  console.log(`[BILLING-DETAILS] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
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
      return new Response(JSON.stringify({
        payment_method: null,
        invoices: [],
        billing_email: user.email,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customer = customers.data[0];
    const customerId = customer.id;
    logStep("Customer found", { customerId });

    // Get default payment method
    let paymentMethod = null;
    const defaultPmId = typeof customer.invoice_settings?.default_payment_method === 'string'
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id;

    if (defaultPmId) {
      const pm = await stripe.paymentMethods.retrieve(defaultPmId);
      if (pm.card) {
        paymentMethod = {
          id: pm.id,
          brand: pm.card.brand,
          last4: pm.card.last4,
          exp_month: pm.card.exp_month,
          exp_year: pm.card.exp_year,
        };
      }
    }

    // Get invoices
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 20,
    });

    const invoiceList = invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      date: inv.created ? new Date(inv.created * 1000).toISOString() : null,
      amount: inv.amount_paid ? inv.amount_paid / 100 : 0,
      currency: inv.currency?.toUpperCase() || "EUR",
      status: inv.status,
      pdf_url: inv.invoice_pdf,
      hosted_url: inv.hosted_invoice_url,
    }));

    logStep("Details fetched", {
      hasPaymentMethod: !!paymentMethod,
      invoiceCount: invoiceList.length,
    });

    return new Response(JSON.stringify({
      payment_method: paymentMethod,
      invoices: invoiceList,
      billing_email: customer.email || user.email,
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
