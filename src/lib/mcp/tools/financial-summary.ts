import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

type Row = {
  currency: string | null;
  total_amount: number | null;
  vat_amount: number | null;
  net_amount: number | null;
  category?: string | null;
};

function totals(rows: Row[]) {
  const byCurrency: Record<string, { total: number; vat: number; net: number; count: number }> = {};
  for (const r of rows) {
    const cur = r.currency || "EUR";
    byCurrency[cur] ??= { total: 0, vat: 0, net: 0, count: 0 };
    byCurrency[cur].total += Number(r.total_amount ?? 0);
    byCurrency[cur].vat += Number(r.vat_amount ?? 0);
    byCurrency[cur].net += Number(r.net_amount ?? 0);
    byCurrency[cur].count += 1;
  }
  return byCurrency;
}

export default defineTool({
  name: "financial_summary",
  title: "Financial summary",
  description:
    "Summarise the signed-in user's income and expenses for an optional date range: totals and VAT per currency, plus expense totals per category.",
  inputSchema: {
    from: z.string().optional().describe("Start of the period (YYYY-MM-DD, inclusive)."),
    to: z.string().optional().describe("End of the period (YYYY-MM-DD, inclusive)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ from, to }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);

    let expenseQuery = supabase
      .from("expense_records")
      .select("currency, total_amount, vat_amount, net_amount, category")
      .limit(2000);
    let incomeQuery = supabase
      .from("income_records")
      .select("currency, total_amount, vat_amount, net_amount")
      .limit(2000);

    if (from) {
      expenseQuery = expenseQuery.gte("invoice_date", from);
      incomeQuery = incomeQuery.gte("invoice_date", from);
    }
    if (to) {
      expenseQuery = expenseQuery.lte("invoice_date", to);
      incomeQuery = incomeQuery.lte("invoice_date", to);
    }

    const [expenseRes, incomeRes] = await Promise.all([expenseQuery, incomeQuery]);
    if (expenseRes.error) return { content: [{ type: "text", text: expenseRes.error.message }], isError: true };
    if (incomeRes.error) return { content: [{ type: "text", text: incomeRes.error.message }], isError: true };

    const expenses = (expenseRes.data ?? []) as Row[];
    const income = (incomeRes.data ?? []) as Row[];

    const byCategory: Record<string, Record<string, number>> = {};
    for (const e of expenses) {
      const cat = e.category || "Uncategorized";
      const cur = e.currency || "EUR";
      byCategory[cat] ??= {};
      byCategory[cat][cur] = (byCategory[cat][cur] ?? 0) + Number(e.total_amount ?? 0);
    }

    const summary = {
      period: { from: from ?? null, to: to ?? null },
      expenses: { count: expenses.length, byCurrency: totals(expenses), byCategory },
      income: { count: income.length, byCurrency: totals(income) },
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
