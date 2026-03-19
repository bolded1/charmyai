import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const brandLogo = useBrandLogo();
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get("type");
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (session && type === "recovery")) setHasSession(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error(t("settings.passwordMismatch")); return; }
    if (password.length < 6) { toast.error(t("settings.passwordTooShort")); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
        <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(152 63% 32% / 0.5), transparent 70%)' }} />
        <div className="w-full max-w-sm text-center relative z-10">
          <div className="glass-auth rounded-2xl p-7 space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
              <CheckCircle className="h-7 w-7 text-primary-foreground" />
            </div>
            <h2 className="text-lg font-bold">{t("settings.passwordUpdated")}</h2>
            <p className="text-sm text-muted-foreground">{t("resetPassword.successDesc", "Your password has been reset successfully.")}</p>
            <Button onClick={() => navigate("/login")} className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity">
              {t("resetPassword.backToSignIn", "Back to Sign In")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
        <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(152 63% 32% / 0.5), transparent 70%)' }} />
        <div className="w-full max-w-sm text-center relative z-10">
          <div className="glass-auth rounded-2xl p-7 space-y-4">
            <h2 className="text-lg font-bold">{t("resetPassword.invalidLink", "Invalid or expired link")}</h2>
            <p className="text-sm text-muted-foreground">{t("resetPassword.invalidLinkDesc", "This password reset link is no longer valid. Please request a new one.")}</p>
            <Button onClick={() => navigate("/login")} className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity">
              {t("resetPassword.backToSignIn", "Back to Sign In")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(152 63% 32% / 0.5), transparent 70%)' }} />
      <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(17 69% 60% / 0.4), transparent 70%)' }} />

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
          <p className="text-sm text-muted-foreground mt-3">{t("resetPassword.chooseNew", "Choose a new password")}</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-auth rounded-2xl p-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium">{t("settings.newPassword")}</Label>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-xs font-medium">{t("settings.confirmPassword")}</Label>
            <Input id="confirmPassword" type="password" placeholder="••••••••" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? t("common.loading") : t("auth.resetPasswordBtn", "Reset Password")}
          </Button>
        </form>
      </div>
    </div>
  );
}
