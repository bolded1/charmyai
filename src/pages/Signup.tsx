import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail, UserX, Loader2, RefreshCw, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { logAuditEvent } from "@/lib/audit-log-client";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

const GoogleIcon = () => (
  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

const PasswordStrength = ({ password }: { password: string }) => {
  const checks = [
    { label: "8+ characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Number", met: /[0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="flex gap-3 pt-1"
    >
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-1">
          <div className={`h-3.5 w-3.5 rounded-full flex items-center justify-center transition-colors ${check.met ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground/40'}`}>
            <Check className="h-2.5 w-2.5" />
          </div>
          <span className={`text-[10px] font-medium transition-colors ${check.met ? 'text-emerald-600' : 'text-muted-foreground/50'}`}>
            {check.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
};

export default function SignupPage() {
  const { t } = useTranslation();
  const brandLogo = useBrandLogo();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { data: systemSettings, isLoading: settingsLoading } = useSystemSettings();

  const handleOAuth = async (provider: "google" | "apple") => {
    setSocialLoading(provider);
    const { error } = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    setSocialLoading(null);
    if (error) toast.error(error.message || `${provider} sign-in failed`);
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
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(152 63% 32% / 0.6), transparent 70%)' }} />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[400px] text-center relative z-10"
        >
          <div className="mb-8">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain mx-auto" />
            ) : (
              <div className="inline-flex items-center gap-2.5 font-bold text-xl">
                <div className="h-11 w-11 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-gradient text-2xl tracking-tight">Charmy</span>
              </div>
            )}
          </div>
          <div className="glass-auth rounded-2xl p-8 space-y-5">
            <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
              <UserX className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">{t("auth.signupsClosed")}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("auth.signupsClosedDesc")}</p>
          </div>
          <p className="text-center text-[13px] text-muted-foreground mt-6">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">{t("auth.login")}</Link>
          </p>
        </motion.div>
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
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(152 63% 32% / 0.6), transparent 70%)' }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-[400px] text-center relative z-10"
        >
          <div className="mb-8">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain mx-auto" />
            ) : (
              <div className="inline-flex items-center gap-2.5 font-bold text-xl">
                <div className="h-11 w-11 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-gradient text-2xl tracking-tight">Charmy</span>
              </div>
            )}
          </div>
          <div className="glass-auth rounded-2xl p-8 space-y-5">
            <div className="h-16 w-16 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <Mail className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-1.5">{t("auth.checkEmail")}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: t("auth.checkEmailDesc", { email }) }} />
            </div>
            <Button variant="outline" size="sm" className="w-full h-10 rounded-xl" disabled={resendCooldown > 0 || resending} onClick={handleResendEmail}>
              {resending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              {resendCooldown > 0 ? t("auth.resendIn", { seconds: resendCooldown }) : t("auth.resendEmail")}
            </Button>
          </div>
          <p className="text-center text-[13px] text-muted-foreground mt-6">
            {t("auth.alreadyVerified")}{" "}
            <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">{t("auth.login")}</Link>
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(152 63% 32% / 0.6), transparent 70%)' }} />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15 blur-[100px]" style={{ background: 'radial-gradient(circle, hsl(265 55% 55% / 0.5), transparent 70%)' }} />
      <div className="absolute top-[30%] right-[15%] w-[250px] h-[250px] rounded-full opacity-10 blur-[80px]" style={{ background: 'radial-gradient(circle, hsl(350 75% 55% / 0.4), transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-[400px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2.5 font-bold text-xl mb-3 group">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain" />
            ) : (
              <>
                <div className="h-11 w-11 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25 group-hover:shadow-xl group-hover:shadow-primary/30 transition-shadow">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-gradient text-2xl tracking-tight">Charmy</span>
              </>
            )}
          </Link>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{t("auth.signupTitle")}</h1>
        </div>

        {/* Card */}
        <div className="glass-auth rounded-2xl p-8 space-y-6">
          {/* Social login — primary CTAs */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl font-medium text-[13px] border-border/60 hover:border-border hover:bg-accent/50 transition-all duration-200"
              disabled={socialLoading !== null}
              onClick={() => handleOAuth("google")}
            >
              {socialLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin mr-2.5" /> : <span className="mr-2.5"><GoogleIcon /></span>}
              {t("auth.continueWithGoogle")}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 rounded-xl font-medium text-[13px] border-border/60 hover:border-border hover:bg-accent/50 transition-all duration-200"
              disabled={socialLoading !== null}
              onClick={() => handleOAuth("apple")}
            >
              {socialLoading === "apple" ? <Loader2 className="h-4 w-4 animate-spin mr-2.5" /> : <span className="mr-2.5"><AppleIcon /></span>}
              {t("auth.continueWithApple")}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/50" /></div>
            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">{t("auth.orContinueWithEmail")}</span>
            </div>
          </div>

          {/* Email form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">{t("auth.workEmail")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl bg-background/50 border-border/60 focus:border-primary/40 focus:bg-background transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">{t("auth.password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl bg-background/50 border-border/60 focus:border-primary/40 focus:bg-background transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl bg-hero-gradient hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 font-medium text-[13px] group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {t("auth.createAccount")}
                  <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </Button>

            <p className="text-[11px] text-center text-muted-foreground/70 leading-relaxed">{t("auth.termsAgree")}</p>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[13px] text-muted-foreground mt-6">
          {t("auth.alreadyHaveAccount")}{" "}
          <Link to="/login" className="text-primary font-semibold hover:text-primary/80 transition-colors">{t("auth.login")}</Link>
        </p>
      </motion.div>
    </div>
  );
}
