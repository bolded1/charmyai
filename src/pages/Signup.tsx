import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail, UserX, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { logAuditEvent } from "@/lib/audit-log-client";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useTranslation } from "react-i18next";

export default function SignupPage() {
  const { t } = useTranslation();
  const brandLogo = useBrandLogo();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings();

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setGoogleLoading(false);
    if (error) {
      toast.error(error.message || "Google sign-in failed");
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
            <h2 className="text-lg font-bold">{t("auth.signupsClosed")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.signupsClosedDesc")}</p>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-5">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">{t("auth.login")}</Link>
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
      options: { emailRedirectTo: window.location.origin + "/onboarding" },
    });
    setResending(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("auth.emailSentSuccess"));
    setResendCooldown(15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (systemSettings && !systemSettings.newSignups) {
      toast.error(t("auth.signupsClosedDesc"));
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: window.location.origin + "/onboarding" },
    });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      toast.error(t("auth.emailAlreadyUsed"));
      return;
    }
    await logAuditEvent({
      action: "user_signup", userId: data.user?.id,
      userEmail: data.user?.email ?? email, details: "Signup submitted",
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
            <h2 className="text-lg font-bold">{t("auth.checkEmail")}</h2>
            <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("auth.checkEmailDesc", { email }) }} />
            <Button variant="outline" size="sm" className="w-full rounded-xl mt-2" disabled={resendCooldown > 0 || resending} onClick={handleResendEmail}>
              {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {resendCooldown > 0 ? t("auth.resendIn", { seconds: resendCooldown }) : t("auth.resendEmail")}
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-5">
            {t("auth.alreadyVerified")}{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">{t("auth.login")}</Link>
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
          <p className="text-sm text-muted-foreground mt-3">{t("auth.signupTitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-auth rounded-2xl p-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">{t("auth.workEmail")}</Label>
            <Input id="email" type="email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">{t("auth.password")}</Label>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <Button type="button" variant="outline" className="w-full h-10 rounded-xl" disabled={googleLoading} onClick={handleGoogleSignup}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {googleLoading ? t("auth.signingIn") : "Continue with Google"}
          </Button>

          <Button type="button" variant="outline" className="w-full h-10 rounded-xl" disabled={googleLoading} onClick={async () => { setGoogleLoading(true); const { error } = await lovable.auth.signInWithOAuth("apple", { redirect_uri: window.location.origin }); setGoogleLoading(false); if (error) toast.error(error.message || "Apple sign-in failed"); }}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
            Continue with Apple
          </Button>

          <p className="text-xs text-center text-muted-foreground">{t("auth.termsAgree")}</p>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">{t("auth.login")}</Link>
        </p>
      </div>
    </div>
  );
}
