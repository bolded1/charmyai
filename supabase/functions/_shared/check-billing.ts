import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Checks if a user has valid billing entitlement (active subscription, trial, or promo access).
 * Returns { valid: true } if entitled, or { valid: false, reason: string } if not.
 */
export async function checkBillingEntitlement(
  userEmail: string,
  stripeKey: string,
  userId?: string
): Promise<{ valid: boolean; reason?: string }> {
  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const customers = await stripe.customers.list({ email: userEmail, limit: 1 });

  if (customers.data.length > 0) {
    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const sub = subscriptions.data[0];
      if (sub.status === "active" || sub.status === "trialing") {
        return { valid: true };
      }
      return { valid: false, reason: sub.status };
    }
  }

  // Check promo-based access if userId is provided
  if (userId) {
    try {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const { data: promoAccess } = await supabaseClient
        .from("promo_code_redemptions")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .limit(1);

      if (promoAccess && promoAccess.length > 0) {
        return { valid: true };
      }
    } catch (err) {
      console.error("[checkBillingEntitlement] Promo check failed:", err);
    }
  }

  return { valid: false, reason: "no_subscription" };
}
