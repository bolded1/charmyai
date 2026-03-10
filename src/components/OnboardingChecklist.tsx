import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboardingChecklist } from "@/hooks/useOnboardingChecklist";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useTranslation } from "react-i18next";

export function OnboardingChecklist() {
  const { isAccountingFirm } = useWorkspace();
  const { steps, completedCount, allDone, progress } = useOnboardingChecklist();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const stored = sessionStorage.getItem("onboarding-dismissed");
    if (stored === "true") setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("onboarding-dismissed", "true");
  };

  if (dismissed || allDone || isAccountingFirm) return null;

  return (
    <Card className="border-0 bg-gradient-to-br from-primary/5 via-background to-accent/10 overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="h-8 w-8 rounded-xl bg-hero-gradient flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            {t("onboarding.gettingStarted")}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("onboarding.completedOf", { completed: completedCount, total: steps.length })}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-1">
        <AnimatePresence>
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                step.completed ? "bg-primary/5" : "hover:bg-accent/50"
              }`}
              onClick={() => !step.completed && navigate(step.link)}
            >
              <div className="shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.completed ? "text-muted-foreground line-through" : "text-foreground"}`}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">{step.description}</p>
              </div>
              {!step.completed && (
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
