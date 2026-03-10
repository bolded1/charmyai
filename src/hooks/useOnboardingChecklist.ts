import { useMemo } from "react";
import { useDocuments, useExpenseRecords } from "@/hooks/useDocuments";
import { useTranslation } from "react-i18next";

export interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  link: string;
}

export function useOnboardingChecklist() {
  const { data: documents = [] } = useDocuments();
  const { data: expenses = [] } = useExpenseRecords();
  const { t } = useTranslation();

  const steps = useMemo<ChecklistStep[]>(() => {
    const hasUploaded = documents.length > 0;
    const hasReviewed = documents.some(
      (d) => d.status === "needs_review" || d.status === "processed" || d.status === "approved" || d.status === "exported"
    );
    const hasApproved = documents.some(
      (d) => d.status === "approved" || d.status === "exported"
    );
    const hasExported = documents.some((d) => d.status === "exported");

    return [
      {
        id: "upload",
        title: t("onboarding.step1Title"),
        description: t("onboarding.step1Desc"),
        completed: hasUploaded,
        link: "/app",
      },
      {
        id: "review",
        title: t("onboarding.step2Title"),
        description: t("onboarding.step2Desc"),
        completed: hasReviewed,
        link: "/app/documents",
      },
      {
        id: "approve",
        title: t("onboarding.step3Title"),
        description: t("onboarding.step3Desc"),
        completed: hasApproved,
        link: "/app/documents",
      },
      {
        id: "export",
        title: t("onboarding.step4Title"),
        description: t("onboarding.step4Desc"),
        completed: hasExported,
        link: "/app/exports",
      },
    ];
  }, [documents, expenses, t]);

  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return { steps, completedCount, allDone, progress };
}
