import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listExpensesTool from "./tools/list-expenses";
import listIncomeTool from "./tools/list-income";
import listDocumentsTool from "./tools/list-documents";
import listCategoriesTool from "./tools/list-categories";
import financialSummaryTool from "./tools/financial-summary";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "charmy-ai",
  title: "Charmy AI",
  version: "0.1.0",
  instructions:
    "Tools for Charmy AI, an accounting document platform. Read the signed-in user's expenses, income, uploaded documents and expense categories, and get period summaries of totals and VAT per currency. All data is scoped to the signed-in user's workspace.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listExpensesTool,
    listIncomeTool,
    listDocumentsTool,
    listCategoriesTool,
    financialSummaryTool,
  ],
});
