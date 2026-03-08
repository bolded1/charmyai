import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  homepageDefaults,
  featuresDefaults,
  pricingDefaults,
  aboutDefaults,
  contactDefaults,
  privacyDefaults,
  termsDefaults,
} from "@/lib/cms-defaults";

type PageConfig = {
  slug: string;
  label: string;
  defaults: Record<string, string>;
  fields: { key: string; label: string; type: "input" | "textarea" }[];
};

const pages: PageConfig[] = [
  {
    slug: "homepage",
    label: "Homepage",
    defaults: homepageDefaults,
    fields: [
      { key: "badge", label: "Badge Text", type: "input" },
      { key: "heroTitle", label: "Hero Title", type: "input" },
      { key: "heroTitleGradient", label: "Hero Title (Gradient Part)", type: "input" },
      { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea" },
      { key: "heroDisclaimer", label: "Hero Disclaimer", type: "input" },
      { key: "howItWorksTitle", label: "How It Works — Title", type: "input" },
      { key: "howItWorksSubtitle", label: "How It Works — Subtitle", type: "input" },
      { key: "step1Title", label: "Step 1 Title", type: "input" },
      { key: "step1Desc", label: "Step 1 Description", type: "textarea" },
      { key: "step2Title", label: "Step 2 Title", type: "input" },
      { key: "step2Desc", label: "Step 2 Description", type: "textarea" },
      { key: "step3Title", label: "Step 3 Title", type: "input" },
      { key: "step3Desc", label: "Step 3 Description", type: "textarea" },
      { key: "step4Title", label: "Step 4 Title", type: "input" },
      { key: "step4Desc", label: "Step 4 Description", type: "textarea" },
      { key: "fieldsTitle", label: "Fields Section — Title", type: "input" },
      { key: "fieldsTitleGradient", label: "Fields Section — Gradient Part", type: "input" },
      { key: "fieldsSubtitle", label: "Fields Section — Subtitle", type: "input" },
      { key: "benefitsTitle", label: "Benefits — Title", type: "input" },
      { key: "benefitsTitleGradient", label: "Benefits — Gradient Part", type: "input" },
      { key: "benefit1", label: "Benefit 1", type: "input" },
      { key: "benefit2", label: "Benefit 2", type: "input" },
      { key: "benefit3", label: "Benefit 3", type: "input" },
      { key: "benefit4", label: "Benefit 4", type: "input" },
      { key: "benefit5", label: "Benefit 5", type: "input" },
      { key: "benefit6", label: "Benefit 6", type: "input" },
      { key: "ctaTitle", label: "CTA Title", type: "input" },
      { key: "ctaTitleFaded", label: "CTA Title (Faded Part)", type: "input" },
      { key: "ctaSubtitle", label: "CTA Subtitle", type: "input" },
      { key: "ctaButton", label: "CTA Button Text", type: "input" },
    ],
  },
  {
    slug: "features",
    label: "Features",
    defaults: featuresDefaults,
    fields: [
      { key: "heroTitle", label: "Hero Title", type: "input" },
      { key: "heroTitleGradient", label: "Hero Title (Gradient Part)", type: "input" },
      { key: "heroSubtitle", label: "Hero Subtitle", type: "textarea" },
      { key: "feature1Title", label: "Feature 1 Title", type: "input" },
      { key: "feature1Desc", label: "Feature 1 Description", type: "textarea" },
      { key: "feature2Title", label: "Feature 2 Title", type: "input" },
      { key: "feature2Desc", label: "Feature 2 Description", type: "textarea" },
      { key: "feature3Title", label: "Feature 3 Title", type: "input" },
      { key: "feature3Desc", label: "Feature 3 Description", type: "textarea" },
      { key: "feature4Title", label: "Feature 4 Title", type: "input" },
      { key: "feature4Desc", label: "Feature 4 Description", type: "textarea" },
      { key: "feature5Title", label: "Feature 5 Title", type: "input" },
      { key: "feature5Desc", label: "Feature 5 Description", type: "textarea" },
      { key: "feature6Title", label: "Feature 6 Title", type: "input" },
      { key: "feature6Desc", label: "Feature 6 Description", type: "textarea" },
      { key: "feature7Title", label: "Feature 7 Title", type: "input" },
      { key: "feature7Desc", label: "Feature 7 Description", type: "textarea" },
      { key: "ctaTitle", label: "CTA Title", type: "input" },
      { key: "ctaSubtitle", label: "CTA Subtitle", type: "textarea" },
    ],
  },
  {
    slug: "pricing",
    label: "Pricing",
    defaults: pricingDefaults,
    fields: [
      { key: "heroTitle", label: "Page Title", type: "input" },
      { key: "heroSubtitle", label: "Page Subtitle", type: "input" },
      { key: "freeTitle", label: "Free Plan Name", type: "input" },
      { key: "freeDesc", label: "Free Plan Description", type: "input" },
      { key: "proTitle", label: "Pro Plan Name", type: "input" },
      { key: "proDesc", label: "Pro Plan Description", type: "input" },
      { key: "faqTitle", label: "FAQ Section Title", type: "input" },
      { key: "faq1Q", label: "FAQ 1 Question", type: "input" },
      { key: "faq1A", label: "FAQ 1 Answer", type: "textarea" },
      { key: "faq2Q", label: "FAQ 2 Question", type: "input" },
      { key: "faq2A", label: "FAQ 2 Answer", type: "textarea" },
      { key: "faq3Q", label: "FAQ 3 Question", type: "input" },
      { key: "faq3A", label: "FAQ 3 Answer", type: "textarea" },
      { key: "faq4Q", label: "FAQ 4 Question", type: "input" },
      { key: "faq4A", label: "FAQ 4 Answer", type: "textarea" },
      { key: "faq5Q", label: "FAQ 5 Question", type: "input" },
      { key: "faq5A", label: "FAQ 5 Answer", type: "textarea" },
    ],
  },
  {
    slug: "about",
    label: "About",
    defaults: aboutDefaults,
    fields: [
      { key: "title", label: "Page Title", type: "input" },
      { key: "intro", label: "Intro Paragraph", type: "textarea" },
      { key: "paragraph1", label: "Paragraph 1", type: "textarea" },
      { key: "paragraph2", label: "Paragraph 2", type: "textarea" },
      { key: "paragraph3", label: "Paragraph 3", type: "textarea" },
      { key: "stat1Value", label: "Stat 1 Value", type: "input" },
      { key: "stat1Label", label: "Stat 1 Label", type: "input" },
      { key: "stat2Value", label: "Stat 2 Value", type: "input" },
      { key: "stat2Label", label: "Stat 2 Label", type: "input" },
      { key: "stat3Value", label: "Stat 3 Value", type: "input" },
      { key: "stat3Label", label: "Stat 3 Label", type: "input" },
    ],
  },
  {
    slug: "contact",
    label: "Contact",
    defaults: contactDefaults,
    fields: [
      { key: "title", label: "Page Title", type: "input" },
      { key: "subtitle", label: "Page Subtitle", type: "input" },
      { key: "email", label: "Email Address", type: "input" },
      { key: "phone", label: "Phone Number", type: "input" },
      { key: "office", label: "Office Location", type: "input" },
    ],
  },
  {
    slug: "privacy",
    label: "Privacy Policy",
    defaults: privacyDefaults,
    fields: [
      { key: "title", label: "Page Title", type: "input" },
      { key: "lastUpdated", label: "Last Updated Text", type: "input" },
      { key: "intro", label: "Introduction", type: "textarea" },
      ...Array.from({ length: 14 }, (_, i) => [
        { key: `section${i + 1}Title`, label: `Section ${i + 1} Title`, type: "input" as const },
        { key: `section${i + 1}Body`, label: `Section ${i + 1} Body`, type: "textarea" as const },
      ]).flat(),
    ],
  },
  {
    slug: "terms",
    label: "Terms of Service",
    defaults: termsDefaults,
    fields: [
      { key: "title", label: "Page Title", type: "input" },
      { key: "lastUpdated", label: "Last Updated Text", type: "input" },
      { key: "intro", label: "Introduction", type: "textarea" },
      ...Array.from({ length: 12 }, (_, i) => [
        { key: `section${i + 1}Title`, label: `Section ${i + 1} Title`, type: "input" as const },
        { key: `section${i + 1}Body`, label: `Section ${i + 1} Body`, type: "textarea" as const },
      ]).flat(),
    ],
  },
];

function PageEditor({ config }: { config: PageConfig }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({ ...config.defaults });
  const [saving, setSaving] = useState(false);

  const { data: saved } = useQuery({
    queryKey: ["page-content", config.slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("page_content")
        .select("content")
        .eq("page_slug", config.slug)
        .maybeSingle();
      return (data?.content as Record<string, string>) ?? null;
    },
  });

  useEffect(() => {
    if (saved) setForm({ ...config.defaults, ...saved });
  }, [saved]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("page_content").upsert(
        {
          page_slug: config.slug,
          content: form,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page_slug" }
      );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["page-content", config.slug] });
      toast.success(`${config.label} page saved!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm({ ...config.defaults });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Edit the text content for the {config.label} page. Save to publish changes.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {config.fields.map((field) => (
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
      </div>
    </div>
  );
}

export default function AdminCMS() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Page Content Editor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit text content on your marketing pages.
        </p>
      </div>

      <Tabs defaultValue="homepage">
        <TabsList className="flex-wrap h-auto gap-1">
          {pages.map((p) => (
            <TabsTrigger key={p.slug} value={p.slug}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {pages.map((p) => (
          <TabsContent key={p.slug} value={p.slug}>
            <div className="surface-elevated rounded-xl border p-6 mt-4">
              <PageEditor config={p} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
