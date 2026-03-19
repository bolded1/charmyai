import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ONE_GB = 1073741824;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await callerClient.auth.getUser();
    if (authErr || !user) throw new Error("Unauthorized");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("sessionId required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ verified: false, status: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orgId = session.metadata?.organization_id;
    const storageGb = parseInt(session.metadata?.storage_gb || "0", 10);

    if (!orgId || !storageGb) throw new Error("Invalid session metadata");

    // Verify user owns the organization
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: org } = await supabase
      .from("organizations")
      .select("id, storage_purchased_bytes, owner_user_id")
      .eq("id", orgId)
      .single();

    if (!org) throw new Error("Organization not found");

    // Add purchased storage
    const additionalBytes = storageGb * ONE_GB;
    const newTotal = (org.storage_purchased_bytes || 0) + additionalBytes;

    const { error: updateErr } = await supabase
      .from("organizations")
      .update({ storage_purchased_bytes: newTotal })
      .eq("id", orgId);

    if (updateErr) throw updateErr;

    return new Response(JSON.stringify({ verified: true, addedGb: storageGb, totalPurchasedBytes: newTotal }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-storage-purchase error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
