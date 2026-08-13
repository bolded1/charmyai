import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_documents",
  title: "List documents",
  description:
    "List the signed-in user's uploaded documents with their processing status, extracted fields and confidence score, newest first.",
  inputSchema: {
    status: z
      .string()
      .optional()
      .describe("Filter by status, e.g. processing, processed, needs_review, failed."),
    document_type: z
      .string()
      .optional()
      .describe("Filter by document type, e.g. expense_invoice or sales_invoice."),
    search: z.string().optional().describe("Filter by file name (partial, case-insensitive)."),
    limit: z.number().int().min(1).max(200).optional().describe("Max records to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, document_type, search, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("documents")
      .select(
        "id, file_name, file_type, status, source, document_type, supplier_name, customer_name, invoice_number, invoice_date, currency, net_amount, vat_amount, total_amount, category, confidence_score, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);

    if (status) query = query.eq("status", status);
    if (document_type) query = query.eq("document_type", document_type);
    if (search) query = query.ilike("file_name", `%${search}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { count: data?.length ?? 0, documents: data ?? [] },
    };
  },
});
