import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  extractLegalSections,
  sectionsToFlat,
  type LegalSection,
} from "@/lib/cms-defaults";

type LegalPageConfig = {
  slug: string;
  label: string;
  defaults: Record<string, string>;
};

export default function LegalPageEditor({ config }: { config: LegalPageConfig }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(config.defaults.title || "");
  const [lastUpdated, setLastUpdated] = useState(config.defaults.lastUpdated || "");
  const [intro, setIntro] = useState(config.defaults.intro || "");
  const [sections, setSections] = useState<LegalSection[]>(() =>
    extractLegalSections(config.defaults)
  );
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
    if (saved) {
      const merged = { ...config.defaults, ...saved };
      setTitle(merged.title || "");
      setLastUpdated(merged.lastUpdated || "");
      setIntro(merged.intro || "");
      // If saved content has a `sections` array, use it; otherwise extract from flat keys
      if (saved.sections && Array.isArray(JSON.parse(saved.sections as string))) {
        setSections(JSON.parse(saved.sections as string));
      } else {
        setSections(extractLegalSections(merged));
      }
    }
  }, [saved]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save both flat keys (backward compat) and sections array
      const content: Record<string, any> = {
        title,
        lastUpdated,
        intro,
        sections: JSON.stringify(sections),
        ...sectionsToFlat(sections),
      };
      const { error } = await supabase.from("page_content").upsert(
        {
          page_slug: config.slug,
          content,
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
    setTitle(config.defaults.title || "");
    setLastUpdated(config.defaults.lastUpdated || "");
    setIntro(config.defaults.intro || "");
    setSections(extractLegalSections(config.defaults));
  };

  const addSection = () => {
    setSections((prev) => [...prev, { title: "", body: "" }]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: "title" | "body", value: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const moveSection = (from: number, to: number) => {
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Edit the text content for the {config.label} page. Add or remove sections as needed.
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

      {/* Header fields */}
      <div className="grid gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Page Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Last Updated Text</Label>
          <Input value={lastUpdated} onChange={(e) => setLastUpdated(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Introduction</Label>
          <Textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} />
        </div>
      </div>

      {/* Dynamic sections */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Sections ({sections.length})</h3>
          <Button variant="outline" size="sm" onClick={addSection}>
            <Plus className="h-4 w-4 mr-1" /> Add Section
          </Button>
        </div>

        <div className="space-y-4 mt-3">
          {sections.map((section, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 bg-card/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">Section {i + 1}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={i === 0}
                    onClick={() => moveSection(i, i - 1)}
                    title="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    disabled={i === sections.length - 1}
                    onClick={() => moveSection(i, i + 1)}
                    title="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeSection(i)}
                    title="Remove section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Title</Label>
                <Input
                  value={section.title}
                  onChange={(e) => updateSection(i, "title", e.target.value)}
                  placeholder="Section title..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Body</Label>
                <Textarea
                  value={section.body}
                  onChange={(e) => updateSection(i, "body", e.target.value)}
                  rows={4}
                  placeholder="Section content..."
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
