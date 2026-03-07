import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId } = await req.json();
    if (!documentId) {
      return new Response(JSON.stringify({ error: "documentId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get document record
    const { data: doc, error: docErr } = await supabase
      .from("documents")
      .select("*")
      .eq("id", documentId)
      .single();

    if (docErr || !doc) {
      return new Response(JSON.stringify({ error: "Document not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from storage
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("documents")
      .download(doc.file_path);

    if (fileErr || !fileData) {
      await supabase
        .from("documents")
        .update({ status: "needs_review", validation_errors: [{ field: "file", message: "Could not download file" }] })
        .eq("id", documentId);
      return new Response(JSON.stringify({ error: "Could not download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const mimeType = doc.file_type === "application/pdf" ? "application/pdf" : doc.file_type;
    const isPdf = doc.file_type === "application/pdf";
    const model = isPdf ? "google/gemini-2.5-flash" : "openai/gpt-5";

    // Call AI to extract data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are a financial document extraction AI. Extract accounting data from uploaded invoices, receipts, and credit notes. Always return structured data using the provided tool.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract all accounting fields from this financial document. Identify the document type (expense_invoice, sales_invoice, receipt, or credit_note), supplier/customer info, invoice details, dates, amounts, VAT, and category.`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_document_data",
              description: "Extract structured accounting data from a financial document",
              parameters: {
                type: "object",
                properties: {
                  document_type: { type: "string", enum: ["expense_invoice", "sales_invoice", "receipt", "credit_note"] },
                  supplier_name: { type: "string", description: "Name of the supplier/vendor" },
                  customer_name: { type: "string", description: "Name of the customer/buyer" },
                  invoice_number: { type: "string" },
                  invoice_date: { type: "string", description: "Date in YYYY-MM-DD format" },
                  due_date: { type: "string", description: "Due date in YYYY-MM-DD format, if present" },
                  currency: { type: "string", description: "3-letter currency code e.g. EUR, USD, GBP" },
                  net_amount: { type: "number", description: "Net amount before tax" },
                  vat_amount: { type: "number", description: "VAT/tax amount" },
                  total_amount: { type: "number", description: "Total amount including tax" },
                   vat_number: { type: "string", description: "VAT registration number if present" },
                  discount_amount: { type: "number", description: "Discount amount if any" },
                  category: { type: "string", description: "Expense/income category e.g. Office Supplies, Consulting, Rent" },
                  confidence: { type: "number", description: "Overall confidence score 0-100" },
                  ocr_text: { type: "string", description: "Full extracted text from the document" },
                },
                required: ["document_type", "currency", "total_amount", "confidence"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_document_data" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      await supabase
        .from("documents")
        .update({ status: "needs_review" })
        .eq("id", documentId);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      await supabase
        .from("documents")
        .update({ status: "needs_review" })
        .eq("id", documentId);
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Validate extracted data
    const validationErrors: { field: string; message: string }[] = [];

    if (extracted.net_amount && extracted.vat_amount && extracted.total_amount) {
      const expectedTotal = Number((extracted.net_amount + extracted.vat_amount).toFixed(2));
      const actualTotal = Number(extracted.total_amount.toFixed(2));
      if (Math.abs(expectedTotal - actualTotal) > 0.02) {
        validationErrors.push({
          field: "total_amount",
          message: `Net (${extracted.net_amount}) + VAT (${extracted.vat_amount}) = ${expectedTotal}, but total is ${actualTotal}`,
        });
      }
    }

    if (extracted.invoice_date && isNaN(Date.parse(extracted.invoice_date))) {
      validationErrors.push({ field: "invoice_date", message: "Invalid date format" });
    }

    const validCurrencies = ["EUR", "USD", "GBP", "CHF", "SEK", "NOK", "DKK", "PLN", "CZK", "HUF", "RON", "BGN", "HRK", "CAD", "AUD", "JPY", "CNY", "BRL"];
    if (extracted.currency && !validCurrencies.includes(extracted.currency)) {
      validationErrors.push({ field: "currency", message: `Unrecognized currency: ${extracted.currency}` });
    }

    const newStatus = validationErrors.length > 0 || (extracted.confidence && extracted.confidence < 80)
      ? "needs_review"
      : "needs_review"; // Always needs_review so user can approve

    // Update document with extracted data
    const { error: updateErr } = await supabase
      .from("documents")
      .update({
        document_type: extracted.document_type || "expense_invoice",
        supplier_name: extracted.supplier_name || null,
        customer_name: extracted.customer_name || null,
        invoice_number: extracted.invoice_number || null,
        invoice_date: extracted.invoice_date || null,
        due_date: extracted.due_date || null,
        currency: extracted.currency || "EUR",
        net_amount: extracted.net_amount || 0,
        vat_amount: extracted.vat_amount || 0,
        total_amount: extracted.total_amount || 0,
        vat_number: extracted.vat_number || null,
        category: extracted.category || null,
        status: newStatus,
        ocr_text: extracted.ocr_text || null,
        extracted_data: extracted,
        confidence_score: extracted.confidence || null,
        validation_errors: validationErrors.length > 0 ? validationErrors : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", documentId);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return new Response(JSON.stringify({ error: "Failed to save extraction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted,
        validationErrors,
        status: newStatus,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("extract-document error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
