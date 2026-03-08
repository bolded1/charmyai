import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Brain, Zap, FileText, ImageIcon, TrendingUp, AlertTriangle, CheckCircle2, Settings2 } from "lucide-react";
import { toast } from "sonner";

const modelOptions = [
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Fast & balanced – best for most workloads", speed: "Fast", quality: "High" },
  { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Top-tier reasoning & multi-page PDFs", speed: "Slower", quality: "Highest" },
  { value: "gpt-5-mini", label: "GPT-5 Mini", description: "Strong accuracy, lower cost than GPT-5", speed: "Medium", quality: "High" },
  { value: "gpt-5", label: "GPT-5", description: "Maximum accuracy for complex documents", speed: "Slow", quality: "Highest" },
];

const usageStats = {
  totalExtractions: 1_284,
  thisMonth: 312,
  avgConfidence: 94.2,
  autoApproved: 78,
  needsReview: 22,
};

export default function AdminAISettings() {
  const [pdfModel, setPdfModel] = useState("gemini-2.5-flash");
  const [imageModel, setImageModel] = useState("gpt-5-mini");
  const [confidenceThreshold, setConfidenceThreshold] = useState([85]);
  const [autoCategorizationEnabled, setAutoCategorizationEnabled] = useState(true);
  const [autoCategorizeOnUpload, setAutoCategorizeOnUpload] = useState(true);
  const [duplicateDetection, setDuplicateDetection] = useState(true);
  const [autoApproveHighConfidence, setAutoApproveHighConfidence] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("AI settings saved successfully");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Settings
          </h2>
          <p className="text-muted-foreground mt-1">Configure document extraction models, thresholds, and automation rules.</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="rounded-xl">
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Extractions", value: usageStats.totalExtractions.toLocaleString(), icon: FileText },
          { label: "This Month", value: usageStats.thisMonth.toLocaleString(), icon: TrendingUp },
          { label: "Avg Confidence", value: `${usageStats.avgConfidence}%`, icon: CheckCircle2 },
          { label: "Auto-Approved", value: `${usageStats.autoApproved}%`, icon: Zap },
          { label: "Needs Review", value: `${usageStats.needsReview}%`, icon: AlertTriangle },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/40">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <stat.icon className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium uppercase tracking-wider">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Extraction Models */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            Extraction Models
          </CardTitle>
          <CardDescription>Choose which AI models handle document extraction by file type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* PDF Model */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-red-500" />
                PDF Documents
              </Label>
              <Select value={pdfModel} onValueChange={setPdfModel}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <span>{m.label}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{m.speed}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {modelOptions.find((m) => m.value === pdfModel)?.description}
              </p>
            </div>

            {/* Image Model */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <ImageIcon className="h-4 w-4 text-blue-500" />
                Images (JPEG, PNG)
              </Label>
              <Select value={imageModel} onValueChange={setImageModel}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelOptions.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <div className="flex items-center gap-2">
                        <span>{m.label}</span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{m.quality}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {modelOptions.find((m) => m.value === imageModel)?.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confidence & Approval */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Confidence & Approval
          </CardTitle>
          <CardDescription>Set the minimum confidence score for automatic document approval.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Confidence Threshold</Label>
              <Badge variant="outline" className="text-sm font-mono">{confidenceThreshold[0]}%</Badge>
            </div>
            <Slider
              value={confidenceThreshold}
              onValueChange={setConfidenceThreshold}
              min={50}
              max={99}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Documents with confidence below {confidenceThreshold[0]}% will be flagged for manual review.
            </p>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Auto-Approve High Confidence</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically approve documents scoring above the threshold.
              </p>
            </div>
            <Switch checked={autoApproveHighConfidence} onCheckedChange={setAutoApproveHighConfidence} />
          </div>
        </CardContent>
      </Card>

      {/* Automation */}
      <Card className="border-border/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Automation
          </CardTitle>
          <CardDescription>Configure automatic behaviors during document processing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Auto-Categorization</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically assign categories based on extraction results and rules.
              </p>
            </div>
            <Switch checked={autoCategorizationEnabled} onCheckedChange={setAutoCategorizationEnabled} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Categorize on Upload</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Apply category rules immediately when a document is uploaded.
              </p>
            </div>
            <Switch checked={autoCategorizeOnUpload} onCheckedChange={setAutoCategorizeOnUpload} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-semibold">Duplicate Detection</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Flag potential duplicate documents based on invoice number, date, and amount.
              </p>
            </div>
            <Switch checked={duplicateDetection} onCheckedChange={setDuplicateDetection} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
