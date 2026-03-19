import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STORAGE_PRICE_ID = "price_1TCk3rBmkvUKJ0fujXaExuvl";
const ONE_GB = 1073741824; // bytes

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !user?.email) throw new Error("Unauthorized");

    const { quantity, organizationId } = await req.json();
    const qty = Math.max(1, Math.min(quantity || 1, 100));

    if (!organizationId) throw new Error("organizationId required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId = customers.data[0]?.id;
    if (!customerId) {
      const c = await stripe.customers.create({ email: user.email });
      customerId = c.id;
    }

    const origin = req.headers.get("origin") || "https://charmy.net";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: STORAGE_PRICE_ID, quantity: qty }],
      mode: "payment",
      success_url: `${origin}/app/settings?tab=storage&purchased=${qty}`,
      cancel_url: `${origin}/app/settings?tab=storage`,
      metadata: {
        user_id: user.id,
        organization_id: organizationId,
        storage_gb: String(qty),
      },
    });

    // After successful payment, add storage immediately
    // We'll use the checkout.session.completed approach via a simple poll on the frontend
    // But we also add it optimistically via metadata for the verify endpoint

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("purchase-storage error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
