import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail, UserX, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { logAuditEvent } from "@/lib/audit-log-client";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export default function SignupPage() {
  const brandLogo = useBrandLogo();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings();

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Show loader while system settings are loading
  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Block signups if disabled by admin
  if (systemSettings && !systemSettings.newSignups) {
    return (
      <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
        <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
        <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />
        <div className="w-full max-w-sm text-center relative z-10">
          <div className="mb-6">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain mx-auto" />
            ) : (
              <div className="inline-flex items-center gap-2.5 font-bold text-xl">
                <div className="h-11 w-11 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-gradient text-2xl">Charmy</span>
              </div>
            )}
          </div>
          <div className="glass-auth rounded-2xl p-7 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <UserX className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-bold">Signups Closed</h2>
            <p className="text-sm text-muted-foreground">
              New registrations are currently disabled. Please check back later or contact support.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  const handleResendEmail = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
      },
    });
    setResending(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Confirmation email resent!");
    setResendCooldown(15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (systemSettings && !systemSettings.newSignups) {
      toast.error("New registrations are currently disabled.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/onboarding",
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    // Supabase returns a user with an empty identities array when the email is already registered
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error("This email is already in use. Please sign in or use a different email.");
      return;
    }

    await logAuditEvent({
      action: "user_signup",
      userId: data.user?.id,
      userEmail: data.user?.email ?? email,
      details: "Signup submitted",
      metadata: { source: "signup_page" },
    });

    setEmailSent(true);
    setResendCooldown(15);
  };

  if (emailSent) {
    return (
      <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
        <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
        <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />
        <div className="w-full max-w-sm text-center relative z-10">
          <div className="mb-6">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain mx-auto" />
            ) : (
              <div className="inline-flex items-center gap-2.5 font-bold text-xl">
                <div className="h-11 w-11 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-gradient text-2xl">Charmy</span>
              </div>
            )}
          </div>
          <div className="glass-auth rounded-2xl p-7 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Mail className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation link to <span className="font-semibold text-foreground">{email}</span>. Click the link to verify your account and get started.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl mt-2"
              disabled={resendCooldown > 0 || resending}
              onClick={handleResendEmail}
            >
              {resending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend confirmation email"}
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-5">
            Already verified?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
      <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(350 75% 55% / 0.3), transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-xl mb-2">
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
          </Link>
          <p className="text-sm text-muted-foreground mt-3">Start your 7-day free trial</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-auth rounded-2xl p-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">Work Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

