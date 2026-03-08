import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch user's financial context
    const [expenseRes, incomeRes, docRes, catRes] = await Promise.all([
      supabase
        .from("expense_records")
        .select("supplier_name, category, total_amount, vat_amount, net_amount, currency, invoice_date")
        .order("invoice_date", { ascending: false })
        .limit(100),
      supabase
        .from("income_records")
        .select("customer_name, category, total_amount, vat_amount, net_amount, currency, invoice_date")
        .order("invoice_date", { ascending: false })
        .limit(100),
      supabase
        .from("documents")
        .select("file_name, status, document_type, supplier_name, customer_name, total_amount, invoice_date, category, confidence_score")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("expense_categories")
        .select("name"),
    ]);

    const expenses = expenseRes.data || [];
    const income = incomeRes.data || [];
    const documents = docRes.data || [];
    const categories = (catRes.data || []).map((c) => c.name);

    // Compute summaries
    const totalExpenses = expenses.reduce((s, e) => s + (e.total_amount || 0), 0);
    const totalIncome = income.reduce((s, e) => s + (e.total_amount || 0), 0);
    const totalVatExpenses = expenses.reduce((s, e) => s + (e.vat_amount || 0), 0);
    const totalVatIncome = income.reduce((s, e) => s + (e.vat_amount || 0), 0);

    // Expense by category
    const expByCat: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || "Uncategorized";
      expByCat[cat] = (expByCat[cat] || 0) + (e.total_amount || 0);
    });

    // Top suppliers/customers
    const supplierTotals: Record<string, number> = {};
    expenses.forEach((e) => {
      supplierTotals[e.supplier_name] = (supplierTotals[e.supplier_name] || 0) + (e.total_amount || 0);
    });
    const topSuppliers = Object.entries(supplierTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const customerTotals: Record<string, number> = {};
    income.forEach((i) => {
      customerTotals[i.customer_name] = (customerTotals[i.customer_name] || 0) + (i.total_amount || 0);
    });
    const topCustomers = Object.entries(customerTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const systemPrompt = `You are Charmy AI, a helpful financial assistant for the Charmy accounting platform. You help users understand their financial data, generate reports, and answer questions about the app.

## User's Financial Data Summary
- **Total Expenses**: €${totalExpenses.toFixed(2)} (VAT: €${totalVatExpenses.toFixed(2)}) across ${expenses.length} records
- **Total Income**: €${totalIncome.toFixed(2)} (VAT: €${totalVatIncome.toFixed(2)}) across ${income.length} records
- **Net Profit/Loss**: €${(totalIncome - totalExpenses).toFixed(2)}
- **Documents**: ${documents.length} total (${documents.filter((d) => d.status === "processed").length} processed, ${documents.filter((d) => d.status === "needs_review").length} needs review)
- **Categories**: ${categories.join(", ") || "None defined"}

## Expenses by Category
${Object.entries(expByCat).map(([cat, total]) => `- ${cat}: €${total.toFixed(2)}`).join("\n") || "No categorized expenses"}

## Top Suppliers (by spend)
${topSuppliers.map(([name, total]) => `- ${name}: €${(total as number).toFixed(2)}`).join("\n") || "No suppliers"}

## Top Customers (by revenue)
${topCustomers.map(([name, total]) => `- ${name}: €${(total as number).toFixed(2)}`).join("\n") || "No customers"}

## Recent Expenses (last 20)
${expenses.slice(0, 20).map((e) => `- ${e.invoice_date} | ${e.supplier_name} | €${e.total_amount} | ${e.category || "N/A"}`).join("\n") || "None"}

## Recent Income (last 20)
${income.slice(0, 20).map((i) => `- ${i.invoice_date} | ${i.customer_name} | €${i.total_amount} | ${i.category || "N/A"}`).join("\n") || "None"}

## Guidelines
- Use markdown formatting (headers, tables, bold, lists) to make responses clear and scannable.
- When generating reports, use markdown tables.
- When users ask about data you don't have (e.g. specific date ranges not in context), let them know what data you can see.
- Be concise but thorough. Use € as the default currency unless the user's data shows otherwise.
- For app help questions, explain Charmy features: document upload/OCR, expense tracking, income tracking, categories, exports, team management, and settings.
- Never fabricate financial data. Only reference what's in the context above.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
