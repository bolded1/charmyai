import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Save, FolderOpen, Trash2, Loader2 } from "lucide-react";

interface Template {
  id: string;
  name: string;
  subject: string;
  html_body: string;
  category: string;
  created_at: string;
}

interface Props {
  onLoad: (subject: string, htmlBody: string) => void;
  currentSubject: string;
  currentHtmlBody: string;
}

export default function EmailTemplatesPanel({ onLoad, currentSubject, currentHtmlBody }: Props) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("updated_at", { ascending: false });
    if (!error) setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchTemplates();
  }, [open]);

  const handleSave = async () => {
    if (!newName.trim()) return toast.error("Template name is required");
    if (!currentHtmlBody.trim()) return toast.error("Email body is empty");
    setSaving(true);
    const { error } = await supabase.from("email_templates").insert({
      name: newName.trim(),
      subject: currentSubject,
      html_body: currentHtmlBody,
    });
    if (error) {
      toast.error("Failed to save template");
    } else {
      toast.success("Template saved!");
      setNewName("");
      setSaveOpen(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("email_templates").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else {
      toast.success("Template deleted");
      setTemplates((t) => t.filter((x) => x.id !== id));
    }
  };

  return (
    <div className="flex gap-2">
      {/* Save as template */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="h-4 w-4 mr-1" /> Save Template
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                placeholder="e.g. Product Update"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Save Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Load template */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <FolderOpen className="h-4 w-4 mr-1" /> Load Template
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Email Templates</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : templates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No templates saved yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {templates.map((t) => (
                <Card key={t.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div
                      className="flex-1 min-w-0"
                      onClick={() => {
                        onLoad(t.subject, t.html_body);
                        setOpen(false);
                        toast.success(`Loaded "${t.name}"`);
                      }}
                    >
                      <p className="font-medium text-sm truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.subject || "No subject"}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(t.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
