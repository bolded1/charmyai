import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, AlertTriangle, Building2, FileText } from "lucide-react";
import { toast } from "sonner";

interface InvitationDetails {
  id: string;
  client_name: string;
  client_email: string;
  status: string;
  expires_at: string;
  workspace_name: string;
  firm_name: string;
  inviter_name: string;
  is_expired: boolean;
}

export default function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided");
      setLoading(false);
      return;
    }

    const lookup = async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke("client-invitation", {
          body: { action: "lookup_invitation", token },
        });
        if (fnError || data?.error) {
          setError(data?.error || "Invitation not found");
          return;
        }
        setInvitation(data.invitation);
      } catch {
        setError("Failed to load invitation");
      } finally {
        setLoading(false);
      }
    };
    lookup();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke("client-invitation", {
        body: { action: "accept_invitation", token, first_name: firstName, last_name: lastName, password },
      });

      if (fnError || data?.error) {
        toast.error(data?.error || "Failed to accept invitation");
        return;
      }

      setSuccess(true);

      // Sign in the user
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: invitation!.client_email,
        password,
      });

      if (!signInError) {
        // Invalidate any cached profile data so DashboardLayout sees onboarding_completed_at
        const { QueryClient } = await import("@tanstack/react-query");
        // Use a short delay to let auth state settle, then navigate
        setTimeout(() => {
          // Force refetch of profile data on next render
          window.location.href = "/app";
        }, 1500);
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Invalid Invitation</h1>
            <p className="text-sm text-muted-foreground">{error || "This invitation link is invalid or has expired."}</p>
            <Button variant="outline" onClick={() => navigate("/login")}>Go to Login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Already Accepted</h1>
            <p className="text-sm text-muted-foreground">This invitation has already been accepted. You can sign in to access your workspace.</p>
            <Button onClick={() => navigate("/login")}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.status === "revoked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Access Revoked</h1>
            <p className="text-sm text-muted-foreground">This invitation has been revoked. Please contact your accountant for access.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitation.is_expired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7 text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Invitation Expired</h1>
            <p className="text-sm text-muted-foreground">This invitation has expired. Please ask your accountant to resend the invitation.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Welcome to Charmy!</h1>
            <p className="text-sm text-muted-foreground">Your account has been set up. Redirecting to your workspace...</p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="h-10 w-10 rounded-lg bg-hero-gradient flex items-center justify-center mx-auto shadow-sm shadow-primary/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Set Up Your Account</h1>
            <p className="text-sm text-muted-foreground">
              <strong>{invitation.inviter_name}</strong> from <strong>{invitation.firm_name}</strong> has invited you to access your workspace.
            </p>
          </div>

          {/* Workspace info */}
          <div className="bg-accent/50 rounded-xl p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{invitation.workspace_name}</p>
              <p className="text-xs text-muted-foreground">Managed by {invitation.firm_name}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">First Name</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Last Name</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Email</Label>
              <Input value={invitation.client_email} disabled className="bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                minLength={8}
              />
            </div>

            <Button type="submit" className="w-full" disabled={submitting || !firstName || !lastName || !password || !confirmPassword}>
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create Account & Access Workspace
            </Button>
          </form>

          <p className="text-[11px] text-center text-muted-foreground">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
