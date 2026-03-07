import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Building2, Users, UserCircle, ArrowRight, ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const steps = [
  { title: "Your Profile", icon: UserCircle },
  { title: "Create Organization", icon: Building2 },
  { title: "Company Information", icon: FileText },
  { title: "Upload First Document", icon: Upload },
  { title: "Invite Team", icon: Users },
];

const companyRoles = ["Owner", "Founder", "Accountant", "Finance Manager", "Admin", "Staff"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateProfile, uploadAvatar } = useProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [companyRole, setCompanyRole] = useState("Owner");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const next = async () => {
    if (step === 0) {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error("First name and last name are required.");
        return;
      }
      try {
        await updateProfile.mutateAsync({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          job_title: jobTitle.trim() || null,
          phone: phone.trim() || null,
        });
        if (avatarFile) {
          await uploadAvatar(avatarFile);
        }
      } catch {
        toast.error("Failed to save profile.");
        return;
      }
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      toast.success("Setup complete! Welcome to DocuLedger.");
      navigate("/app");
    }
  };

  const profileInitials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

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
          <div className="flex items-center justify-center gap-2 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 w-10 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length} — {steps[step].title}</p>
        </div>

        <div className="surface-elevated rounded-xl p-6">
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <label className="relative cursor-pointer group">
                  <Avatar className="h-20 w-20">
                    {avatarPreview ? (
                      <AvatarImage src={avatarPreview} />
                    ) : null}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">{profileInitials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name *</Label>
                  <Input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Last Name *</Label>
                  <Input placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input placeholder="e.g. Finance Manager" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="+49 123 456 789" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Role in Company</Label>
                <Select value={companyRole} onValueChange={setCompanyRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {companyRoles.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          {step === 1 && (
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
          {step === 2 && (
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
          {step === 3 && (
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
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Invite team members to collaborate on document processing.</p>
              {[1, 2].map((i) => (
                <div key={i} className="grid grid-cols-3 gap-3">
                  <Input placeholder="First name" />
                  <Input placeholder="Last name" />
                  <Input placeholder="Email address" />
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
              {step === steps.length - 1 ? "Finish Setup" : "Continue"} <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
