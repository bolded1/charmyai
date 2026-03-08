import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useBrandLogo } from "@/hooks/useBrandLogo";

export default function LoginPage() {
  const brandLogo = useBrandLogo();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/app");
  };

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, hsl(var(--background)), hsl(var(--accent)), hsl(var(--background)))' }}>
      {/* Decorative blurred orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl mb-2">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain" />
            ) : (
              <>
                <div className="h-10 w-10 rounded-xl bg-hero-gradient flex items-center justify-center shadow-lg">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                Charmy
              </>
            )}
          </Link>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-auth rounded-2xl p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <span className="text-xs text-primary cursor-pointer">Forgot password?</span>
            </div>
            <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary font-medium">Start Free Trial</Link>
        </p>
      </div>
    </div>
  );
}
