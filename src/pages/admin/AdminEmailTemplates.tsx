import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Mail, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const EMAIL_SLUG = "email-templates";

type EmailTypeConfig = {
  key: string;
  label: string;
  description: string;
  fields: { key: string; label: string; type: "input" | "textarea" }[];
};

const emailTypes: EmailTypeConfig[] = [
  {
    key: "global",
    label: "Global",
    description: "Sender name and domain used across all emails.",
    fields: [
      { key: "senderName", label: "Sender Name (From name)", type: "input" },
    ],
  },
  {
    key: "signup",
    label: "Signup",
    description: "Sent when a new user signs up to confirm their email.",
    fields: [
      { key: "signup_subject", label: "Subject", type: "input" },
      { key: "signup_heading", label: "Heading", type: "input" },
      { key: "signup_body", label: "Body Text", type: "textarea" },
      { key: "signup_button", label: "Button Text", type: "input" },
      { key: "signup_step_1", label: "Onboarding Step 1", type: "input" },
      { key: "signup_step_2", label: "Onboarding Step 2", type: "input" },
      { key: "signup_step_3", label: "Onboarding Step 3", type: "input" },
      { key: "signup_footer", label: "Footer Text", type: "textarea" },
    ],
  },
  {
    key: "recovery",
    label: "Password Reset",
    description: "Sent when a user requests a password reset.",
    fields: [
      { key: "recovery_subject", label: "Subject", type: "input" },
      { key: "recovery_heading", label: "Heading", type: "input" },
      { key: "recovery_body", label: "Body Text", type: "textarea" },
      { key: "recovery_button", label: "Button Text", type: "input" },
      { key: "recovery_footer", label: "Footer Text", type: "textarea" },
    ],
  },
  {
    key: "magiclink",
    label: "Magic Link",
    description: "Sent when a user requests a magic link login.",
    fields: [
      { key: "magiclink_subject", label: "Subject", type: "input" },
      { key: "magiclink_heading", label: "Heading", type: "input" },
      { key: "magiclink_body", label: "Body Text", type: "textarea" },
      { key: "magiclink_button", label: "Button Text", type: "input" },
      { key: "magiclink_footer", label: "Footer Text", type: "textarea" },
    ],
  },
  {
    key: "invite",
    label: "Invitation",
    description: "Sent when a user is invited to join.",
    fields: [
      { key: "invite_subject", label: "Subject", type: "input" },
      { key: "invite_heading", label: "Heading", type: "input" },
      { key: "invite_body", label: "Body Text", type: "textarea" },
      { key: "invite_button", label: "Button Text", type: "input" },
      { key: "invite_footer", label: "Footer Text", type: "textarea" },
    ],
  },
  {
    key: "email_change",
    label: "Email Change",
    description: "Sent when a user requests to change their email address.",
    fields: [
      { key: "email_change_subject", label: "Subject", type: "input" },
      { key: "email_change_heading", label: "Heading", type: "input" },
      { key: "email_change_body", label: "Body Text", type: "textarea" },
      { key: "email_change_button", label: "Button Text", type: "input" },
      { key: "email_change_footer", label: "Footer Text", type: "textarea" },
    ],
  },
  {
    key: "reauthentication",
    label: "Reauthentication",
    description: "Sent with a verification code to confirm identity.",
    fields: [
      { key: "reauthentication_subject", label: "Subject", type: "input" },
      { key: "reauthentication_heading", label: "Heading", type: "input" },
      { key: "reauthentication_body", label: "Body Text", type: "textarea" },
      { key: "reauthentication_footer", label: "Footer Text", type: "textarea" },
    ],
  },
];

const defaults: Record<string, string> = {
  senderName: "charmyai",
  signup_subject: "Confirm your email",
  signup_heading: "Welcome to Charmy!",
  signup_body: "Thanks for signing up — you're just one step away from getting started.\n\nPlease confirm your email address by clicking the button below:",
  signup_button: "Verify Email",
  signup_step_1: "Upload your first invoice or receipt",
  signup_step_2: "Review the AI-extracted data",
  signup_step_3: "Approve and export to your accounting workflow",
  signup_footer: "If you didn't create an account, you can safely ignore this email.",
  recovery_subject: "Reset your password",
  recovery_heading: "Reset your password",
  recovery_body: "We received a request to reset your password. Click the button below to choose a new one.",
  recovery_button: "Reset Password",
  recovery_footer: "If you didn't request this, you can safely ignore this email — your password won't be changed.",
  magiclink_subject: "Your login link",
  magiclink_heading: "Your login link",
  magiclink_body: "Click the button below to sign in to Charmy. This link will expire shortly.",
  magiclink_button: "Sign In",
  magiclink_footer: "If you didn't request this link, you can safely ignore this email.",
  invite_subject: "You've been invited",
  invite_heading: "You've been invited",
  invite_body: "Someone invited you to join Charmy. Click the button below to accept and create your account.",
  invite_button: "Accept Invitation",
  invite_footer: "If you weren't expecting this invitation, you can safely ignore this email.",
  email_change_subject: "Confirm your new email",
  email_change_heading: "Confirm your email change",
  email_change_body: "You requested to change your email address. Click the button below to confirm the change.",
  email_change_button: "Confirm Email Change",
  email_change_footer: "If you didn't request this change, please secure your account immediately.",
  reauthentication_subject: "Your verification code",
  reauthentication_heading: "Verification code",
  reauthentication_body: "Use the code below to confirm your identity:",
  reauthentication_footer: "This code will expire shortly. If you didn't request this, you can safely ignore it.",
};

export default function AdminEmailTemplates() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({ ...defaults });
  const [saving, setSaving] = useState(false);

  const { data: saved } = useQuery({
    queryKey: ["page-content", EMAIL_SLUG],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_content")
        .select("content")
        .eq("page_slug", EMAIL_SLUG)
        .maybeSingle();
      return (data?.content as Record<string, string>) ?? null;
    },
  });

  useEffect(() => {
    if (saved) setForm({ ...defaults, ...saved });
  }, [saved]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("page_content").upsert(
        {
          page_slug: EMAIL_SLUG,
          content: form,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page_slug" }
      );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["page-content", EMAIL_SLUG] });
      toast.success("Email templates saved! Changes will take effect on the next email sent.");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setForm({ ...defaults });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="h-6 w-6" /> Email Templates
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the sender name, subjects, and body copy for all transactional emails.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" /> Reset Defaults
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save All
          </Button>
        </div>
      </div>

      <Tabs defaultValue="global">
        <TabsList className="flex-wrap h-auto gap-1">
          {emailTypes.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {emailTypes.map((t) => (
          <TabsContent key={t.key} value={t.key}>
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>{t.label}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {t.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label htmlFor={field.key} className="text-xs font-medium">
                      {field.label}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.key}
                        value={form[field.key] || ""}
                        onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                        rows={3}
                      />
                    ) : (
                      <Input
                        id={field.key}
                        value={form[field.key] || ""}
                        onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
