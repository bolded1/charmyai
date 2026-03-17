import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { FileText, Building2, UserCircle, ArrowRight, ArrowLeft, Camera, Check, ChevronsUpDown, Briefcase, Users, FolderOpen, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useBrandLogo } from "@/hooks/useBrandLogo";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useOrganization, useUpdateOrganization } from "@/hooks/useOrganization";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type AccountType = "business" | "firm" | null;

const COMPANY_ROLE_KEYS = ["Owner", "Founder", "Accountant", "Finance Manager", "Admin", "Staff"] as const;
const INDUSTRY_VALUES = ["technology", "consulting", "retail", "healthcare", "construction", "other"] as const;

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const { data: org } = useOrganization();
  const updateOrg = useUpdateOrganization();

  const [accountType, setAccountType] = useState<AccountType>(null);
  const [step, setStep] = useState(0);
  const [hasStartedOnboardingFlow, setHasStartedOnboardingFlow] = useState(false);

  const companyRoleOptions = COMPANY_ROLE_KEYS.map((r) => ({
    value: r,
    label: t(`onboarding.role${r.replace(/\s/g, "")}` as any, r),
  }));
  const industryOptions = INDUSTRY_VALUES.map((v) => ({
    value: v,
    label: t(`onboarding.industry${v.charAt(0).toUpperCase() + v.slice(1)}` as any, v),
  }));

  const steps = accountType === "firm"
    ? [
        { title: t("onboarding.stepAccountType"), icon: Briefcase },
        { title: t("onboarding.stepYourProfile"), icon: UserCircle },
        { title: t("onboarding.stepFirmDetails"), icon: Building2 },
      ]
    : [
        { title: t("onboarding.stepAccountType"), icon: Briefcase },
        { title: t("onboarding.stepYourProfile"), icon: UserCircle },
        { title: t("onboarding.stepOrgDetails"), icon: Building2 },
      ];

  // Auto-detect which step to start on based on saved data
  const profileComplete = !!profile?.first_name && !!profile?.last_name;

  useEffect(() => {
    if (!profileLoading && profileComplete && step === 1) {
      setStep((prev) => Math.max(prev, 2));
    }
  }, [profileLoading, profileComplete]);

  // Redirect users who already completed onboarding
  useEffect(() => {
    if (
      !authLoading &&
      !profileLoading &&
      user &&
      profile?.onboarding_completed_at &&
      !hasStartedOnboardingFlow
    ) {
      if (profile?.billing_setup_at) {
        navigate("/app", { replace: true });
      } else {
        navigate("/activate-trial", { replace: true });
      }
    }
  }, [authLoading, profileLoading, user, profile?.onboarding_completed_at, profile?.billing_setup_at, hasStartedOnboardingFlow, navigate]);

  // Pre-populate from saved profile data
  const metaFirst = user?.user_metadata?.first_name || "";
  const metaLast = user?.user_metadata?.last_name || "";

  const [firstName, setFirstName] = useState(profile?.first_name || metaFirst);
  const [lastName, setLastName] = useState(profile?.last_name || metaLast);
  const [jobTitle, setJobTitle] = useState(profile?.job_title || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [companyRole, setCompanyRole] = useState("Owner");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const brandLogo = useBrandLogo();

  const [orgName, setOrgName] = useState(org?.name && org.name !== "My Organization" ? org.name : "");
  const [industry, setIndustry] = useState("technology");
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const [currency, setCurrency] = useState(org?.default_currency || "EUR");
  const [vatNumber, setVatNumber] = useState("");
  const [address, setAddress] = useState("");

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
    setHasStartedOnboardingFlow(true);

    // Step 0: Account type selection
    if (step === 0) {
      if (!accountType) {
        toast.error(t("onboarding.errorChooseType"));
        return;
      }
      setStep(1);
      return;
    }

    // Step 1: Profile
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error(t("onboarding.errorNameRequired"));
        return;
      }
      try {
        const profileUpdate: any = {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          job_title: jobTitle.trim() || null,
          phone: phone.trim() || null,
        };
        await updateProfile.mutateAsync(profileUpdate);
        if (avatarFile) {
          await uploadAvatar(avatarFile);
        }
      } catch (err: any) {
        console.error("Onboarding profile save error:", err);
        toast.error(t("onboarding.errorSaveProfile"));
        return;
      }
      setStep(2);
      return;
    }

    // Step 2: Organization/Firm details
    if (step === 2) {
      if (!orgName.trim()) {
        toast.error(accountType === "firm" ? t("onboarding.errorFirmNameRequired") : t("onboarding.errorCompanyNameRequired"));
        return;
      }
      if (!currency) {
        toast.error(t("onboarding.errorCurrencyRequired"));
        return;
      }
      if (org) {
        try {
          const orgUpdate: Record<string, any> = {
            id: org.id,
            name: orgName.trim(),
            default_currency: currency,
          };
          if (accountType === "firm") {
            orgUpdate.workspace_type = "accounting_firm";
            orgUpdate.max_client_workspaces = 10;
          }
          await updateOrg.mutateAsync(orgUpdate as any);
        } catch (err: any) {
          console.error("Onboarding org save error:", err);
          toast.error(t("onboarding.errorSaveOrg"));
          return;
        }
      }

      // Mark onboarding as completed
      try {
        await updateProfile.mutateAsync({
          onboarding_completed_at: new Date().toISOString(),
        } as any);
      } catch {}

      if (accountType === "firm") {
        toast.success(t("onboarding.successFirm"));
        navigate("/activate-firm");
      } else {
        toast.success(t("onboarding.successBusiness"));
        navigate("/activate-trial");
      }
    }
  };

  const profileInitials = firstName && lastName
    ? `${firstName[0]}${lastName[0]}`.toUpperCase()
    : (user?.email?.[0] || "U").toUpperCase();

  return (
    <div className="marketing min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-30%] left-[-15%] w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(351 63% 37% / 0.5), transparent 70%)' }} />
      <div className="absolute bottom-[-25%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(circle, hsl(17 69% 60% / 0.4), transparent 70%)' }} />
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
          <p className="text-sm text-muted-foreground">{t("onboarding.stepOf", { current: step + 1, total: steps.length, title: steps[step].title })}</p>
        </div>

        <div className="glass-auth rounded-2xl p-6">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="text-center mb-6">
                  <h2 className="text-lg font-bold text-foreground mb-1">{t("onboarding.chooseHowTitle")}</h2>
                  <p className="text-sm text-muted-foreground">{t("onboarding.chooseHowDesc")}</p>
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setAccountType("business")}
                    className={cn(
                      "w-full rounded-xl border-2 p-5 text-left transition-all group",
                      accountType === "business"
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        accountType === "business" ? "bg-primary/15" : "bg-muted"
                      )}>
                        <Briefcase className={cn("h-5 w-5", accountType === "business" ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{t("onboarding.businessTitle")}</span>
                          {accountType === "business" && <Check className="h-4 w-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{t("onboarding.businessDesc")}</p>
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType("firm")}
                    className={cn(
                      "w-full rounded-xl border-2 p-5 text-left transition-all group",
                      accountType === "firm"
                        ? "border-amber-500 bg-amber-500/5 shadow-sm"
                        : "border-border hover:border-muted-foreground/30 hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        accountType === "firm" ? "bg-amber-500/15" : "bg-muted"
                      )}>
                        <Building2 className={cn("h-5 w-5", accountType === "firm" ? "text-amber-600" : "text-muted-foreground")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-foreground">{t("onboarding.firmTitle")}</span>
                          {accountType === "firm" && <Check className="h-4 w-4 text-amber-600" />}
                        </div>
                        <p className="text-sm text-muted-foreground">{t("onboarding.firmDesc")}</p>
                      </div>
                    </div>
                  </button>
                </div>

                {accountType === "firm" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium">
                        <Sparkles className="h-4 w-4 text-amber-600" />
                        {t("onboarding.firmPlanTitle")}
                      </div>
                      <div className="space-y-1.5">
                        {[
                          t("onboarding.firmFeature1"),
                          t("onboarding.firmFeature2"),
                          t("onboarding.firmFeature3"),
                          t("onboarding.firmFeature4"),
                        ].map((feat) => (
                          <div key={feat} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Check className="h-3 w-3 text-amber-600 shrink-0" />
                            {feat}
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground pt-1 border-t border-amber-500/10">
                        {t("onboarding.firmPlanNote")}
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step-1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <label className="relative cursor-pointer group">
                      <Avatar className="h-20 w-20">
                        {avatarPreview ? <AvatarImage src={avatarPreview} /> : null}
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
                      <Label>{t("onboarding.firstName")} *</Label>
                      <Input placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("onboarding.lastName")} *</Label>
                      <Input placeholder="Smith" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("onboarding.jobTitle")}</Label>
                    <Input placeholder={accountType === "firm" ? t("onboarding.jobTitlePlaceholderFirm") : t("onboarding.jobTitlePlaceholderBusiness")} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("onboarding.phoneNumber")}</Label>
                    <Input placeholder="+49 123 456 789" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("onboarding.roleInCompany")}</Label>
                    <Select value={companyRole} onValueChange={setCompanyRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {companyRoleOptions.map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step-2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{accountType === "firm" ? `${t("onboarding.firmName")} *` : `${t("onboarding.companyName")} *`}</Label>
                    <Input
                      placeholder={accountType === "firm" ? "Smith & Partners Accounting" : "Acme Corp"}
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      required
                    />
                  </div>

                  {accountType !== "firm" && (
                    <div className="space-y-2">
                      <Label>{t("onboarding.industry")}</Label>
                      <div className="flex flex-wrap gap-2">
                        {industryOptions.map((ind) => (
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
                        <Input placeholder={t("onboarding.industryPlaceholder")} value={customIndustry} onChange={(e) => setCustomIndustry(e.target.value)} className="mt-2" />
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>{t("onboarding.country")}</Label>
                    <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={countryOpen} className="w-full justify-between font-normal">
                          {country || t("onboarding.selectCountry")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder={t("onboarding.searchCountry")} />
                          <CommandList>
                            <CommandEmpty>{t("onboarding.noCountryFound")}</CommandEmpty>
                            <CommandGroup>
                              {COUNTRIES.map((c) => (
                                <CommandItem key={c} value={c} onSelect={() => { setCountry(c); setCountryOpen(false); }}>
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

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t("onboarding.defaultCurrency")} *</Label>
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
                      <Label>{t("onboarding.vatNumber")}</Label>
                      <Input placeholder="DE123456789" value={vatNumber} onChange={(e) => setVatNumber(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("onboarding.address")}</Label>
                    <Input placeholder="123 Main St, Berlin" value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>

                  {accountType === "firm" && (
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 flex items-start gap-3">
                      <Building2 className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {t("onboarding.firmSetupNote")} <span className="font-medium text-foreground">{t("onboarding.firmSetupNoteHighlight")}</span> {t("onboarding.firmSetupNoteEnd")}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <Button variant="ghost" size="sm" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
              <ArrowLeft className="h-4 w-4 mr-1" /> {t("onboarding.back")}
            </Button>
            <Button size="sm" onClick={next}>
              {step === steps.length - 1
                ? (accountType === "firm" ? t("onboarding.continueToPayment") : t("onboarding.finishSetup"))
                : t("onboarding.continue")
              } <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
