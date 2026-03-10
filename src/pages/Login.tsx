import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logAuditEvent } from "@/lib/audit-log-client";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const brandLogo = useBrandLogo();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const navigate = useNavigate();

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
          <p className="text-sm text-muted-foreground mt-3">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-auth rounded-2xl p-7 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-medium">Password</Label>
              <button type="button" onClick={() => { setForgotOpen(true); setForgotSent(false); setForgotEmail(email); }} className="text-xs text-primary cursor-pointer hover:underline">Forgot password?</button>
            </div>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 rounded-xl" />
          </div>
          <Button type="submit" className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-semibold hover:underline">Get Started</Link>
        </p>
      </div>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset your password</DialogTitle>
          </DialogHeader>
          {forgotSent ? (
            <div className="text-center space-y-3 py-2">
              <div className="h-12 w-12 rounded-2xl bg-hero-gradient flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                <Mail className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">We've sent a reset link to <span className="font-semibold text-foreground">{forgotEmail}</span>. Check your inbox.</p>
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
                <Label htmlFor="forgot-email" className="text-xs font-medium">Email</Label>
                <Input id="forgot-email" type="email" placeholder="you@company.com" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="h-10 rounded-xl" />
              </div>
              <Button type="submit" className="w-full h-10 rounded-xl bg-hero-gradient hover:opacity-90 transition-opacity" disabled={forgotLoading}>
                {forgotLoading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

