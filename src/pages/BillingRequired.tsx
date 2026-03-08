import { useNavigate } from "react-router-dom";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, CreditCard } from "lucide-react";

export default function BillingRequiredPage() {
  const navigate = useNavigate();
  const brandLogo = useBrandLogo();

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
          <h1 className="text-xl font-bold text-foreground mb-2">Your trial has ended</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Please update your payment method to continue using Charmy.
          </p>

          <div className="space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate("/app/settings?tab=billing")}>
              <CreditCard className="h-4 w-4 mr-2" />
              Update Payment Method
            </Button>
            <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate("/activate-trial")}>
              Start a new subscription
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
