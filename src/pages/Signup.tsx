import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBrandLogo } from "@/hooks/useBrandLogo";

export default function SignupPage() {
  const brandLogo = useBrandLogo();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
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
    setEmailSent(true);
  };

  if (emailSent) {
    return (
      <div className="marketing min-h-screen flex items-center justify-center p-4 surface-sunken">
        <div className="w-full max-w-sm text-center">
          <div className="mb-6">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain mx-auto" />
            ) : (
              <div className="inline-flex items-center gap-2 font-bold text-xl">
                <div className="h-10 w-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                Charmy
              </div>
            )}
          </div>
          <div className="surface-elevated rounded-xl p-6 space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-muted-foreground">
              We've sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click the link to verify your account and get started.
            </p>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Already verified?{" "}
            <Link to="/login" className="text-primary font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 surface-sunken">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl mb-2">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain" />
            ) : (
              <>
                <div className="h-10 w-10 rounded-xl bg-hero-gradient flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                Charmy
              </>
            )}
          </Link>
          <p className="text-sm text-muted-foreground">Start your free trial</p>
        </div>

        <form onSubmit={handleSubmit} className="surface-elevated rounded-xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Work Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
