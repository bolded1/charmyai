import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, Building2, UserCircle, ArrowRight, ArrowLeft, Camera, Check, ChevronsUpDown } from "lucide-react";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const steps = [
  { title: "Your Profile", icon: UserCircle },
  { title: "Organization Details", icon: Building2 },
];

const companyRoles = ["Owner", "Founder", "Accountant", "Finance Manager", "Admin", "Staff"];

const INDUSTRIES = [
  { value: "technology", label: "Technology" },
  { value: "consulting", label: "Consulting" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "healthcare", label: "Healthcare" },
  { value: "construction", label: "Construction" },
  { value: "other", label: "Other" },
];

const CURRENCIES = [
  { value: "EUR", label: "EUR — Euro" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "CHF", label: "CHF — Swiss Franc" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Argentina","Armenia","Australia","Austria","Azerbaijan",
  "Bahrain","Bangladesh","Belarus","Belgium","Bolivia","Bosnia and Herzegovina","Brazil","Bulgaria","Cambodia",
  "Cameroon","Canada","Chile","China","Colombia","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic",
  "Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Estonia","Ethiopia","Finland","France",
  "Georgia","Germany","Ghana","Greece","Guatemala","Honduras","Hong Kong","Hungary","Iceland","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya",
  "Kuwait","Latvia","Lebanon","Libya","Lithuania","Luxembourg","Malaysia","Malta","Mexico","Moldova",
  "Monaco","Montenegro","Morocco","Myanmar","Nepal","Netherlands","New Zealand","Nigeria","North Macedonia",
  "Norway","Oman","Pakistan","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Qatar",
  "Romania","Russia","Saudi Arabia","Senegal","Serbia","Singapore","Slovakia","Slovenia","South Africa",
  "South Korea","Spain","Sri Lanka","Sweden","Switzerland","Taiwan","Tanzania","Thailand","Tunisia",
  "Turkey","UAE","Uganda","Ukraine","United Kingdom","United States","Uruguay","Uzbekistan","Venezuela","Vietnam",
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const { data: org } = useOrganization();
  const updateOrg = useUpdateOrganization();

  // Auto-detect which step to start on based on saved data
  const profileComplete = !!profile?.first_name && !!profile?.last_name;
  const initialStep = profileComplete ? 1 : 0;
  const [step, setStep] = useState(initialStep);

  // Update step when profile loads and we detect step 0 was already done
  useEffect(() => {
    if (!profileLoading && profileComplete) {
      setStep((prev) => Math.max(prev, 1));
    }
  }, [profileLoading, profileComplete]);

  // Redirect already-onboarded users away from onboarding
  useEffect(() => {
    if (!authLoading && !profileLoading && user && profile?.onboarding_completed_at) {
      navigate("/app", { replace: true });
    }
  }, [authLoading, profileLoading, user, profile?.onboarding_completed_at, navigate]);

  // Pre-populate from saved profile data first, then signup metadata as fallback
  const metaFirst = user?.user_metadata?.first_name || "";
  const metaLast = user?.user_metadata?.last_name || "";

  // Step 1 state — pre-fill from existing profile
  const [firstName, setFirstName] = useState(profile?.first_name || metaFirst);
  const [lastName, setLastName] = useState(profile?.last_name || metaLast);
  const [jobTitle, setJobTitle] = useState(profile?.job_title || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [companyRole, setCompanyRole] = useState("Owner");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const brandLogo = useBrandLogo();

  // Step 2 state — pre-fill from existing org
  const [orgName, setOrgName] = useState(org?.name && org.name !== "My Organization" ? org.name : "");
  const [industry, setIndustry] = useState("technology");
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [currency, setCurrency] = useState(org?.default_currency || "EUR");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState("");

  // Update pre-filled values when profile/org data loads
  useEffect(() => {
    if (profile) {
      if (profile.first_name && !firstName) setFirstName(profile.first_name);
      if (profile.last_name && !lastName) setLastName(profile.last_name);
      if (profile.job_title && !jobTitle) setJobTitle(profile.job_title);
      if (profile.phone && !phone) setPhone(profile.phone);
      if (profile.avatar_url && !avatarPreview) setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    if (org) {
      if (org.name && org.name !== "My Organization" && !orgName) setOrgName(org.name);
      if (org.default_currency) setCurrency(org.default_currency);
    }
  }, [org]);

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

    if (step === 1) {
      if (!orgName.trim()) {
        toast.error("Company name is required.");
        return;
      }
      if (!currency) {
        toast.error("Default currency is required.");
        return;
      }
      if (org) {
        try {
          await updateOrg.mutateAsync({ id: org.id, name: orgName.trim(), default_currency: currency });
        } catch {
          toast.error("Failed to update organization.");
          return;
        }
      }
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Mark onboarding as completed
      try {
        await updateProfile.mutateAsync({
          onboarding_completed_at: new Date().toISOString(),
        } as any);
      } catch {}
      toast.success("Setup complete! Let's activate your trial.");
      navigate("/activate-trial");
    }
  };

  const profileInitials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(224 76% 48% / 0.5), transparent 70%)' }} />
      <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.4), transparent 70%)' }} />
      <div className="absolute top-[30%] right-[5%] w-[300px] h-[300px] rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(172 66% 40% / 0.4), transparent 70%)' }} />
      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 font-bold text-xl mb-4">
            {brandLogo ? (
              <img src={brandLogo} alt="Charmy" className="h-10 max-w-[10rem] object-contain" />
            ) : (
              <>
                <div className="h-11 w-11 rounded-2xl bg-hero-gradient flex items-center justify-center shadow-lg shadow-primary/25">
                  <FileText className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-gradient text-2xl">Charmy</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 w-10 rounded-full transition-all duration-300 ${i <= step ? 'bg-hero-gradient shadow-sm shadow-primary/20' : 'bg-border'}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {steps.length} — {steps[step].title}</p>
        </div>

        <div className="glass-auth rounded-2xl p-6">
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
                <Label>Company Name *</Label>
                <Input placeholder="Acme Corp" value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
              </div>

              {/* Industry as tabs */}
              <div className="space-y-2">
                <Label>Industry</Label>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind.value}
                      type="button"
                      onClick={() => setIndustry(ind.value)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium border transition-colors",
                        industry === ind.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                      )}
                    >
                      {ind.label}
                    </button>
                  ))}
                </div>
                {industry === "other" && (
                  <Input
                    placeholder="Enter your industry..."
                    value={customIndustry}
                    onChange={(e) => setCustomIndustry(e.target.value)}
                    className="mt-2"
                  />
                )}
              </div>

              {/* Country with search */}
              <div className="space-y-2">
                <Label>Country</Label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={countryOpen}
                      className="w-full justify-between font-normal"
                    >
                      {country || "Select country..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandList>
                        <CommandEmpty>No country found.</CommandEmpty>
                        <CommandGroup>
                          {COUNTRIES.map((c) => (
                            <CommandItem
                              key={c}
                              value={c}
                              onSelect={() => {
                                setCountry(c);
                                setCountryOpen(false);
                              }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", country === c ? "opacity-100" : "opacity-0")} />
                              {c}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Currency & VAT */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Currency *</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>VAT Number</Label>
                  <Input placeholder="DE123456789" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input placeholder="123 Main St, Berlin" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
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
