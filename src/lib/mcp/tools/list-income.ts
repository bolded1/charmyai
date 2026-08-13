import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_income",
  title: "List income",
  description:
    "List the signed-in user's income records / sales invoices (customer, amounts, VAT, dates), newest first. Supports optional date range and customer filters.",
  inputSchema: {
    from: z.string().optional().describe("Only include invoices on/after this date (YYYY-MM-DD)."),
    to: z.string().optional().describe("Only include invoices on/before this date (YYYY-MM-DD)."),
    customer: z.string().optional().describe("Filter by customer name (partial, case-insensitive)."),
    limit: z.number().int().min(1).max(200).optional().describe("Max records to return (default 50)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to, customer, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("income_records")
      .select(
        "id, customer_name, invoice_number, invoice_date, due_date, category, currency, net_amount, vat_amount, total_amount",
      )
      .order("invoice_date", { ascending: false })
      .limit(limit ?? 50);

    if (from) query = query.gte("invoice_date", from);
    if (to) query = query.lte("invoice_date", to);
    if (customer) query = query.ilike("customer_name", `%${customer}%`);

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: JSON.stringify(data ?? [], null, 2) }],
      structuredContent: { count: data?.length ?? 0, income: data ?? [] },
    };
  },
});
