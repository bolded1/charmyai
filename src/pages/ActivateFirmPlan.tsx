import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription, STRIPE_PLANS } from "@/hooks/useSubscription";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { Button } from "@/components/ui/button";
import {
  FileText, Building2, CheckCircle2, Loader2, ArrowRight,
  Shield, FolderOpen, LayoutDashboard, ArrowLeftRight,
  Sparkles, Download, Users, LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const FIRM_FEATURES = [
  { icon: FolderOpen, label: "Up to 10 client workspaces" },
  { icon: LayoutDashboard, label: "Dedicated accountant dashboard" },
  { icon: ArrowLeftRight, label: "Separate workspace for each client" },
  { icon: Sparkles, label: "AI invoice and receipt processing" },
  { icon: Download, label: "Exports per workspace" },
  { icon: Users, label: "Team access and role management" },
];

export default function ActivateFirmPlanPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile } = useProfile();
  const subscription = useSubscription();
  const brandLogo = useBrandLogo();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If user already has firm plan, redirect to app
  useEffect(() => {
    if (!subscription.loading && subscription.has_firm_plan) {
      navigate("/app/workspaces", { replace: true });
    }
  }, [subscription.loading, subscription.has_firm_plan, navigate]);

  // If no user, redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleCheckout = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-checkout", {
        body: { priceId: STRIPE_PLANS.firm.price_id },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);

      // Set billing_setup_at before redirect
      if (user) {
        try {
          await supabase
            .from("profiles")
            .update({ billing_setup_at: new Date().toISOString() })
            .eq("user_id", user.id);
        } catch {}
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || "Failed to start checkout. Please try again.");
      toast.error("Failed to start checkout.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (authLoading || subscription.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background effects */}
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
      <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 font-bold text-xl mb-6">
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-foreground">Activate Your Accounting Firm Plan</h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              One-time payment of €99 — no recurring fees, no surprises.
            </p>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-auth rounded-2xl p-6">
          {/* Plan summary card */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Accounting Firm</h3>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold text-foreground">€99</span>
                  <span className="text-sm text-muted-foreground">one-time</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">You will get:</p>
              {FIRM_FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm text-foreground">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 mb-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* CTA */}
          <Button
            className="w-full h-12 text-base rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 transition-opacity"
            onClick={handleCheckout}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Purchase
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          {/* Trust signals */}
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Secure checkout
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Instant access
            </div>
          </div>

          {/* Explanation */}
          <div className="mt-6 pt-5 border-t border-border/50">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              After payment, your firm dashboard will be unlocked with up to 10 client workspaces ready to use. 
              Each workspace keeps documents, expenses, and exports fully separated.
            </p>
          </div>

          {/* Secondary actions */}
          <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-2">
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={() => navigate("/activate-trial")}>
              Switch to Pro Plan instead
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
