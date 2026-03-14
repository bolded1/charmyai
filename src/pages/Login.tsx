import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAuditEvent } from "@/lib/audit-log-client";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const brandLogo = useBrandLogo();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setGoogleLoading(false);
    if (error) {
      toast.error(error.message || "Google sign-in failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      await logAuditEvent({
        action: "user_login_failed",
        userEmail: email,
        details: error.message,
        metadata: { source: "login_page" },
      });
      toast.error(error.message);
      return;
    }

    await logAuditEvent({
      action: "user_login",
      userId: data.user?.id,
      userEmail: data.user?.email ?? email,
      details: "Password login succeeded",
      metadata: { source: "login_page" },
    });

    toast.success("Welcome back!");
    navigate("/app");
  };

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Colorful gradient orbs */}
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
      <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />
      <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(172 66% 40% / 0.4), transparent 70%)' }} />

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
          <p className="text-sm text-muted-foreground mt-3">{t("auth.loginTitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-auth rounded-2xl p-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">{t("auth.email")}</Label>
            <Input id="email" type="email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium">{t("auth.password")}</Label>
              <button type="button" onClick={() => { setForgotOpen(true); setForgotSent(false); setForgotEmail(email); }} className="text-xs text-primary cursor-pointer hover:underline">{t("auth.forgotPassword")}</button>
            </div>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? t("auth.signingIn") : t("auth.login")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <Button type="button" variant="outline" className="w-full h-10 rounded-xl" disabled={googleLoading} onClick={handleGoogleLogin}>
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {googleLoading ? t("auth.signingIn") : "Continue with Google"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          {t("auth.dontHaveAccount")}{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">{t("auth.getStarted")}</Link>
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("auth.resetPassword")}</DialogTitle>
          </DialogHeader>
          {forgotSent ? (
            <div className="text-center space-y-3 py-2">
              <div className="h-12 w-12 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                <Mail className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("auth.resetSent", { email: forgotEmail }) }} />
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setForgotLoading(true);
              const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
              });
              setForgotLoading(false);
              if (error) { toast.error(error.message); return; }

              await logAuditEvent({
                action: "password_reset",
                userEmail: forgotEmail,
                details: "Password reset email sent",
                metadata: { source: "forgot_password_dialog" },
              });

              setForgotSent(true);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-xs font-medium">{t("auth.email")}</Label>
                <Input id="forgot-email" type="email" placeholder="you@company.com" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity" disabled={forgotLoading}>
                {forgotLoading ? t("auth.sendingReset") : t("auth.resetPasswordBtn")}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

