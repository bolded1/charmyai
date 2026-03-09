import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { useSubscription } from "@/hooks/useSubscription";
import { usePromoCode } from "@/hooks/usePromoCode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, AlertTriangle, CreditCard, Tag, CheckCircle2, X, Loader2, LifeBuoy, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BillingRequiredPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const brandLogo = useBrandLogo();
  const subscription = useSubscription();
  const { validateCode, clearPromo, validating, promoResult } = usePromoCode();
  const [promoCode, setPromoCode] = useState("");
  const [promoExpanded, setPromoExpanded] = useState(false);
  const [activating, setActivating] = useState(false);

  const handleApplyPromo = async () => {
    await validateCode(promoCode, "monthly", "pro");
  };

  const handleRemovePromo = () => {
    clearPromo();
    setPromoCode("");
  };

  const handleActivateWithPromo = async () => {
    if (!promoResult?.valid) return;
    setActivating(true);
    try {
      const { data, error } = await supabase.functions.invoke("activate-trial", {
        body: {
          priceId: "price_1T8XiYBmkvUKJ0fulbvWmmQN", // monthly default
          skipCard: promoResult.requires_card === false,
          promoCodeId: promoResult.promo_code_id,
          stripeCouponId: promoResult.stripe_coupon_id,
          extraTrialDays: promoResult.extra_trial_days,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Access restored!");
      subscription.checkSubscription();
      navigate("/app");
    } catch (err: any) {
      toast.error(err.message || "Failed to activate. Please try again.");
    } finally {
      setActivating(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Determine the message based on subscription status
  let title = "Complete your setup to access Charmy";
  let description = "Your account has been created, but you need an active trial or subscription to continue using the app.";

  if (subscription.status === "canceled") {
    title = "Your subscription has been canceled";
    description = "Your subscription is no longer active. Reactivate or start a new plan to continue using Charmy.";
  } else if (subscription.status === "past_due") {
    title = "Payment past due";
    description = "Your subscription payment failed. Please update your payment method to restore access.";
  } else if (subscription.status === "incomplete" || subscription.status === "incomplete_expired") {
    title = "Payment incomplete";
    description = "Your payment setup was not completed. Please complete payment to access the app.";
  } else if (subscription.status === "unpaid") {
    title = "Payment required";
    description = "Your account has an unpaid balance. Please update your payment method to continue.";
  }

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="inline-flex items-center gap-2.5 font-bold text-xl mb-8">
          {brandLogo ? (
            <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain" />
          ) : (
            <>
              <div className="h-11 w-11 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-gradient text-2xl">Charmy</span>
            </>
          )}
        </div>

        <div className="glass-auth rounded-2xl p-8">
          <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground mb-6">{description}</p>

          <div className="space-y-3">
            {/* Primary actions */}
            {subscription.status === "past_due" || subscription.status === "unpaid" ? (
              <Button className="w-full" size="lg" onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("customer-portal");
                  if (error) throw error;
                  if (data?.url) window.location.href = data.url;
                } catch {
                  toast.error("Could not open billing portal. Please try again.");
                }
              }}>
                <CreditCard className="h-4 w-4 mr-2" />
                Update Payment Method
              </Button>
            ) : (
              <Button className="w-full" size="lg" onClick={() => navigate("/activate-trial")}>
                <CreditCard className="h-4 w-4 mr-2" />
                Continue to Payment
              </Button>
            )}

            {/* Promo code section */}
            <div className="pt-2">
              {!promoExpanded && !promoResult?.valid ? (
                <button
                  type="button"
                  onClick={() => setPromoExpanded(true)}
                  className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium mx-auto"
                >
                  <Tag className="h-3.5 w-3.5" />
                  Have a promo code?
                </button>
              ) : (
                <div className="space-y-3 text-left">
                  <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />
                    Promo Code
                  </Label>
                  {promoResult?.valid ? (
                    <>
                      <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-primary">{promoResult.discount_label}</p>
                            <p className="text-xs text-muted-foreground">Code: {promoCode.toUpperCase()}</p>
                          </div>
                        </div>
                        <button onClick={handleRemovePromo} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <Button
                        className="w-full"
                        onClick={handleActivateWithPromo}
                        disabled={activating}
                      >
                        {activating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                        Activate with Promo Code
                      </Button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyPromo}
                        disabled={validating || !promoCode.trim()}
                        className="shrink-0"
                      >
                        {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                      </Button>
                    </div>
                  )}
                  {promoResult && !promoResult.valid && promoResult.error && (
                    <p className="text-xs text-destructive">{promoResult.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Secondary actions */}
            <div className="border-t border-border/50 pt-3 mt-3 space-y-2">
              <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/contact")}>
                <LifeBuoy className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
              <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
