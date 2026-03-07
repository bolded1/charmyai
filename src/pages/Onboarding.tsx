import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Building2, Upload, Users, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const steps = [
  { title: "Create Organization", icon: Building2 },
  { title: "Company Information", icon: FileText },
  { title: "Upload First Document", icon: Upload },
  { title: "Invite Team", icon: Users },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (step < 3) setStep(step + 1);
    else {
      toast.success("Setup complete! Welcome to DocuLedger.");
      navigate("/app");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 surface-sunken">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-bold text-xl mb-4">
            <div className="h-10 w-10 rounded-xl bg-hero-gradient flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            DocuLedger
          </div>
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 w-12 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Step {step + 1} of 4 — {steps[step].title}</p>
        </div>

        <div className="surface-elevated rounded-xl p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Organization Name</Label>
                <Input placeholder="Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label>Industry</Label>
                <Input placeholder="Technology, Consulting, etc." />
              </div>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input placeholder="Germany" />
                </div>
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Input placeholder="EUR" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>VAT Number</Label>
                <Input placeholder="DE123456789" />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="123 Main St, Berlin" />
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-xl p-12 text-center">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-sm">Drag and drop your first document</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, PNG, or JPG up to 20MB</p>
                <Button variant="outline" size="sm" className="mt-4">Browse Files</Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full" onClick={next}>
                Skip for now
              </Button>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Invite team members to collaborate on document processing.</p>
              {[1, 2].map((i) => (
                <div key={i} className="grid grid-cols-2 gap-3">
                  <Input placeholder="Email address" />
                  <Input placeholder="Role (e.g. Accountant)" />
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full" onClick={next}>
                Skip for now
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button size="sm" onClick={next}>
              {step === 3 ? "Finish Setup" : "Continue"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
