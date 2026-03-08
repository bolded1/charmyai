import { useMemo } from "react";
import { useDocuments, useExpenseRecords } from "@/hooks/useDocuments";

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
        title: "Upload your first document",
        description: "Upload an invoice, receipt, or bill to get started",
        completed: hasUploaded,
        link: "/app",
      },
      {
        id: "review",
        title: "Review extracted data",
        description: "Check the AI-extracted fields and make corrections",
        completed: hasReviewed,
        link: "/app/documents",
      },
      {
        id: "approve",
        title: "Approve a document",
        description: "Approve a document to create an expense or income record",
        completed: hasApproved,
        link: "/app/documents",
      },
      {
        id: "export",
        title: "Export your records",
        description: "Export expenses or income as PDF, CSV, or Excel",
        completed: hasExported,
        link: "/app/exports",
      },
    ];
  }, [documents, expenses]);

  const completedCount = steps.filter((s) => s.completed).length;
  const allDone = completedCount === steps.length;
  const progress = Math.round((completedCount / steps.length) * 100);

  return { steps, completedCount, allDone, progress };
}
