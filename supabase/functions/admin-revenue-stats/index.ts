import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is platform_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: hasRole } = await callerClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "platform_admin",
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Fetch all active subscriptions for MRR
    const activeSubscriptions: Stripe.Subscription[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const params: any = { status: "active", limit: 100 };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.subscriptions.list(params);
      activeSubscriptions.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    // Calculate MRR
    let mrr = 0;
    const planBreakdown: Record<string, { count: number; revenue: number; name: string }> = {};

    for (const sub of activeSubscriptions) {
      for (const item of sub.items.data) {
        const price = item.price;
        const productId = typeof price.product === "string" ? price.product : (price.product as any)?.id;
        let monthlyAmount = 0;

        if (price.recurring?.interval === "month") {
          monthlyAmount = (price.unit_amount || 0) / 100;
        } else if (price.recurring?.interval === "year") {
          monthlyAmount = (price.unit_amount || 0) / 100 / 12;
        }

        mrr += monthlyAmount;

        if (!planBreakdown[productId]) {
          planBreakdown[productId] = { count: 0, revenue: 0, name: productId };
        }
        planBreakdown[productId].count++;
        planBreakdown[productId].revenue += monthlyAmount;
      }
    }

    // Try to resolve product names
    const productIds = Object.keys(planBreakdown);
    for (const pid of productIds) {
      try {
        const product = await stripe.products.retrieve(pid);
        planBreakdown[pid].name = product.name || pid;
      } catch {
        // keep the ID as name
      }
    }

    // 2. Fetch canceled subscriptions in last 30 days for churn
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const canceledSubs: Stripe.Subscription[] = [];
    hasMore = true;
    startingAfter = undefined;
    while (hasMore) {
      const params: any = { status: "canceled", limit: 100, created: { gte: thirtyDaysAgo } };
      if (startingAfter) params.starting_after = startingAfter;
      const batch = await stripe.subscriptions.list(params);
      canceledSubs.push(...batch.data);
      hasMore = batch.has_more;
      if (batch.data.length > 0) startingAfter = batch.data[batch.data.length - 1].id;
    }

    const churnCount = canceledSubs.length;
    const totalSubs = activeSubscriptions.length + churnCount;
    const churnRate = totalSubs > 0 ? (churnCount / totalSubs) * 100 : 0;

    // 3. Trialing subscriptions
    const { data: trialingSubs } = await stripe.subscriptions.list({ status: "trialing", limit: 100 });
    const trialingCount = trialingSubs?.length || 0;

    // 4. Signups over time (last 6 months from profiles)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("created_at")
      .gte("created_at", sixMonthsAgo.toISOString())
      .order("created_at", { ascending: true });

    // Group signups by month
    const signupsByMonth: Record<string, number> = {};
    for (const p of profiles || []) {
      const d = new Date(p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      signupsByMonth[key] = (signupsByMonth[key] || 0) + 1;
    }

    // Fill in missing months
    const signupTrend: { month: string; signups: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("en", { month: "short", year: "2-digit" });
      signupTrend.push({ month: label, signups: signupsByMonth[key] || 0 });
    }

    // 5. MRR trend (approximate from invoices in last 6 months)
    const mrrTrend: { month: string; mrr: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

      const invoices = await stripe.invoices.list({
        created: {
          gte: Math.floor(start.getTime() / 1000),
          lte: Math.floor(end.getTime() / 1000),
        },
        status: "paid",
        limit: 100,
      });

      const monthRevenue = invoices.data.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0) / 100;
      const label = d.toLocaleString("en", { month: "short", year: "2-digit" });
      mrrTrend.push({ month: label, mrr: monthRevenue });
    }

    return new Response(JSON.stringify({
      mrr: Math.round(mrr * 100) / 100,
      activeSubscriptions: activeSubscriptions.length,
      trialingCount,
      churnCount,
      churnRate: Math.round(churnRate * 100) / 100,
      planBreakdown: Object.values(planBreakdown),
      signupTrend,
      mrrTrend,
      totalUsers: (profiles || []).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
