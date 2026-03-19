import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkBillingEntitlement } from "../_shared/check-billing.ts";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const internalKey = req.headers.get("x-internal-key");
    const isInternalCall = internalKey === serviceKey;

    let userId: string;
    let userEmail: string = "";

    if (isInternalCall) {
      // Internal service call — skip auth & billing, read userId from body
      const body = await req.json();
      if (!body.documentId || !body.userId) {
        return new Response(JSON.stringify({ error: "documentId and userId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = body.userId;
      var documentId = body.documentId;
      var skipRecordCreation = false;
    } else {
      // Normal authenticated call
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const callerClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = claimsData.claims.sub;
      userEmail = claimsData.claims.email as string;

      // Billing entitlement check
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey && userEmail) {
        const entitlement = await checkBillingEntitlement(userEmail, stripeKey, userId);
        if (!entitlement.valid) {
          return new Response(JSON.stringify({ error: "Active subscription required to process documents." }), {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const body = await req.json();
      if (!body.documentId) {
        return new Response(JSON.stringify({ error: "documentId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      var documentId = body.documentId;
      var skipRecordCreation = body.skipRecordCreation === true;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    // For normal calls verify ownership; internal calls skip this
    if (!isInternalCall && doc.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
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
    const mimeType = doc.file_type === "application/pdf" ? "application/pdf" : (doc.file_type || "image/jpeg");
    // google/gemini-2.5-flash is the confirmed working vision model on this gateway —
    // it handles both PDFs and images via the image_url / base64 format.
    const model = "google/gemini-2.5-flash";

    // Fetch existing category names to guide the AI
    let existingCategoryNames: string[] = [];
    try {
      let catContextQuery = supabase
        .from("expense_categories")
        .select("name")
        .eq("user_id", doc.user_id);
      if (doc.organization_id) {
        catContextQuery = catContextQuery.eq("organization_id", doc.organization_id);
      }
      const { data: catRows } = await catContextQuery;
      existingCategoryNames = (catRows ?? []).map((c: { name: string }) => c.name);
    } catch {}

    const categoryHint = existingCategoryNames.length > 0
      ? `\nExisting categories (prefer one of these if it fits): ${existingCategoryNames.join(", ")}. Only suggest a new category name if none of the existing ones are a good fit.`
      : "";

    // Hint from the document's existing type (set by the upload route, e.g. income page → sales_invoice)
    const typeHint = doc.document_type
      ? `\nThe system has pre-classified this document as "${doc.document_type}" based on upload context. Use this as a strong hint when classifying.`
      : "";

    // Call AI to extract data.
    // We use JSON mode (no tool_choice) for maximum compatibility with Gemini via this gateway.
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are a financial document extraction AI. Analyse the document image and return ONLY a single valid JSON object — no markdown, no explanation, no code fences.

JSON schema (all fields optional except document_type, currency, total_amount, confidence):
{
  "document_type": "expense_invoice" | "sales_invoice" | "receipt" | "credit_note",
  "supplier_name": string,      // company/person who ISSUED / is billing (seller)
  "customer_name": string,      // company/person being billed (buyer / recipient)
  "invoice_number": string,
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "currency": "EUR",            // 3-letter ISO code — infer from symbol (€→EUR, $→USD, £→GBP)
  "net_amount": 0.00,           // subtotal before tax — plain decimal, NO comma thousands separators
  "vat_amount": 0.00,           // tax/VAT amount
  "total_amount": 0.00,         // gross total including tax
  "vat_number": string,         // VAT/tax reg number (VAT No, TVA, MwSt-Nr, CIF, NIF, SIRET…)
  "category": string,           // e.g. "Office Supplies", "Consulting", "Utilities"
  "confidence": 85,             // 0-100 overall extraction confidence
  "ocr_text": string            // full raw text visible on the document
}${typeHint}${categoryHint}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all accounting fields from this financial document and return them as JSON.",
              },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
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

    // Parse JSON from message content (JSON mode) with fallback to tool_calls for
    // backwards compatibility if the gateway ever routes to a tool-calling model.
    let rawJson: string | null = null;
    const msg = aiResult.choices?.[0]?.message;
    if (msg?.content) {
      // Strip markdown code fences if the model wrapped the JSON
      rawJson = msg.content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    } else if (msg?.tool_calls?.[0]?.function?.arguments) {
      rawJson = msg.tool_calls[0].function.arguments;
    }

    if (!rawJson) {
      console.error("AI response had no usable content:", JSON.stringify(aiResult).slice(0, 500));
      await supabase
        .from("documents")
        .update({ status: "needs_review" })
        .eq("id", documentId);
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(rawJson);
    } catch (parseErr) {
      console.error("Failed to parse AI JSON:", parseErr, rawJson?.slice(0, 300));
      await supabase
        .from("documents")
        .update({ status: "needs_review" })
        .eq("id", documentId);
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalise amounts — the AI occasionally returns strings like "1,234.56"
    const parseAmount = (v: unknown): number => {
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        // Remove thousand separators but keep decimal point
        const cleaned = v.replace(/,(?=\d{3})/g, "").replace(/[^\d.]/g, "");
        const n = parseFloat(cleaned);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };
    extracted.net_amount   = parseAmount(extracted.net_amount);
    extracted.vat_amount   = parseAmount(extracted.vat_amount);
    extracted.total_amount = parseAmount(extracted.total_amount);

    // If only total is present, derive net/vat sensibly
    if (extracted.total_amount > 0 && extracted.net_amount === 0 && extracted.vat_amount === 0) {
      extracted.net_amount = extracted.total_amount;
    }

    // Validate extracted data
    const validationErrors: { field: string; message: string }[] = [];

    if (extracted.net_amount > 0 && extracted.vat_amount >= 0 && extracted.total_amount > 0) {
      const expectedTotal = Number((extracted.net_amount + extracted.vat_amount).toFixed(2));
      const actualTotal = Number(extracted.total_amount.toFixed(2));
      if (Math.abs(expectedTotal - actualTotal) > 0.05) {
        validationErrors.push({
          field: "total_amount",
          message: `Net (${extracted.net_amount}) + VAT (${extracted.vat_amount}) = ${expectedTotal}, but total is ${actualTotal}`,
        });
      }
    }

    if (extracted.invoice_date && isNaN(Date.parse(extracted.invoice_date))) {
      validationErrors.push({ field: "invoice_date", message: "Invalid date format" });
    }

    // Broad list — flag truly unknown codes only, don't block common world currencies
    const validCurrencies = [
      "EUR","USD","GBP","CHF","SEK","NOK","DKK","PLN","CZK","HUF","RON","BGN","HRK","RSD",
      "CAD","AUD","NZD","JPY","CNY","HKD","SGD","TWD","KRW","INR","IDR","MYR","THB","PHP","VND",
      "BRL","MXN","ARS","CLP","COP","PEN",
      "ZAR","NGN","KES","EGP","MAD","TND","GHS",
      "AED","SAR","QAR","KWD","BHD","OMR","JOD","ILS","TRY",
      "RUB","UAH","KZT","GEL",
    ];
    if (extracted.currency && !validCurrencies.includes(extracted.currency.toUpperCase())) {
      validationErrors.push({ field: "currency", message: `Unrecognized currency: ${extracted.currency}` });
    }
    // Normalise currency to uppercase
    if (extracted.currency) extracted.currency = extracted.currency.toUpperCase();

    // Check for duplicate documents
    let potentialDuplicateOf: string | null = null;
    try {
      const { data: dupResult } = await supabase.rpc("find_duplicate_document", {
        _user_id: doc.user_id,
        _document_id: documentId,
        _supplier_name: extracted.supplier_name || null,
        _invoice_number: extracted.invoice_number || null,
        _invoice_date: extracted.invoice_date || null,
        _total_amount: extracted.total_amount || null,
      });
      if (dupResult) {
        potentialDuplicateOf = dupResult;
        validationErrors.push({
          field: "duplicate",
          message: "This document appears to be a duplicate of an existing record.",
        });
      }
    } catch (dupErr) {
      console.error("Duplicate check error:", dupErr);
    }

    // Fetch AI settings to determine auto-approve behavior
    let autoApprove = false;
    let confidenceThreshold = 85;
    try {
      const { data: aiSettingsRow } = await supabase
        .from("demo_settings")
        .select("value")
        .eq("key", "ai_settings")
        .single();
      if (aiSettingsRow?.value) {
        const settings = aiSettingsRow.value as Record<string, unknown>;
        if (settings.autoApproveHighConfidence === true) autoApprove = true;
        if (typeof settings.confidenceThreshold === "number") confidenceThreshold = settings.confidenceThreshold;
      }
    } catch (settingsErr) {
      console.error("Failed to load AI settings:", settingsErr);
    }

    const confidence = extracted.confidence ?? 0;
    const hasDuplicate = potentialDuplicateOf !== null;
    const hasValidationIssues = validationErrors.length > 0;

    let newStatus: string;
    if (hasValidationIssues || confidence < confidenceThreshold) {
      newStatus = "needs_review";
    } else if (autoApprove && confidence >= confidenceThreshold && !hasDuplicate) {
      newStatus = "approved";
    } else {
      newStatus = "needs_review";
    }

    // Apply auto-categorization rules
    let finalCategory = extracted.category || null;
    try {
      let rulesQuery = supabase
        .from("auto_category_rules")
        .select("*")
        .eq("user_id", doc.user_id);
      if (doc.organization_id) {
        rulesQuery = rulesQuery.eq("organization_id", doc.organization_id);
      }
      const { data: rules } = await rulesQuery;

      if (rules && rules.length > 0) {
        for (const rule of rules) {
          const fieldValue = (extracted[rule.match_field] || "").toLowerCase().trim();
          const matchValue = rule.match_value.toLowerCase().trim();
          let matched = false;

          if (rule.match_type === "contains") matched = fieldValue.includes(matchValue);
          else if (rule.match_type === "starts_with") matched = fieldValue.startsWith(matchValue);
          else if (rule.match_type === "equals") matched = fieldValue === matchValue;

          if (matched) {
            finalCategory = rule.category;
            break;
          }
        }
      }
    } catch (ruleErr) {
      console.error("Auto-category rule error:", ruleErr);
    }

    // Normalize category against existing ones to avoid near-duplicates
    if (finalCategory) {
      try {
        let existingCatQuery = supabase
          .from("expense_categories")
          .select("id, name")
          .eq("user_id", doc.user_id);
        if (doc.organization_id) {
          existingCatQuery = existingCatQuery.eq("organization_id", doc.organization_id);
        }
        const { data: existingCats } = await existingCatQuery;

        // Normalize: lowercase, trim, collapse spaces & special chars, targeted plural collapse
        const normalize = (s: string) =>
          s.toLowerCase()
            .trim()
            .replace(/[&]/g, "and")
            .replace(/[^a-z0-9 ]/g, "")
            .replace(/\s+/g, " ")
            .replace(/ies$/, "y")
            .replace(/(?<=[a-z]{3})es$/, "")
            .replace(/(?<=[a-z]{3})s$/, "");

        const aiNorm = normalize(finalCategory);

        if (existingCats && existingCats.length > 0) {
          const match = existingCats.find((c: { id: string; name: string }) => normalize(c.name) === aiNorm);
          if (match) {
            // Use the existing category name instead of the AI-suggested one
            finalCategory = match.name;
            console.log("Matched existing category:", finalCategory);
          } else {
            // No match found — create new category
            await supabase
              .from("expense_categories")
              .insert({ user_id: doc.user_id, name: finalCategory, organization_id: doc.organization_id ?? null });
            console.log("Auto-created category:", finalCategory);
          }
        } else {
          // No categories exist yet — create first one
          await supabase
            .from("expense_categories")
            .insert({ user_id: doc.user_id, name: finalCategory, organization_id: doc.organization_id ?? null });
          console.log("Auto-created category:", finalCategory);
        }
      } catch (catErr) {
        console.error("Auto-create category error:", catErr);
      }
    }
    const { error: updateErr } = await supabase
      .from("documents")
      .update({
        // Preserve the document's original type when the upload route set it explicitly
        // (e.g. income page sets "sales_invoice"). Only override if AI is confident.
        document_type: skipRecordCreation
          ? (doc.document_type || extracted.document_type || "expense_invoice")
          : (extracted.document_type || doc.document_type || "expense_invoice"),
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
        category: finalCategory,
        status: newStatus,
        ocr_text: extracted.ocr_text || null,
        extracted_data: extracted,
        confidence_score: extracted.confidence || null,
        validation_errors: validationErrors.length > 0 ? validationErrors : null,
        potential_duplicate_of: potentialDuplicateOf,
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

    // Auto-create expense/income record when auto-approved.
    // Skip if the caller (e.g. useUploadIncomeDocument) handles record creation itself.
    if (newStatus === "approved" && !skipRecordCreation) {
      const docType = extracted.document_type || "expense_invoice";
      if (docType === "sales_invoice") {
        await supabase.from("income_records").insert({
          user_id: doc.user_id,
          organization_id: doc.organization_id || null,
          document_id: documentId,
          customer_name: extracted.customer_name || extracted.supplier_name || "Unknown",
          invoice_number: extracted.invoice_number || null,
          invoice_date: extracted.invoice_date || new Date().toISOString().split("T")[0],
          due_date: extracted.due_date || null,
          currency: extracted.currency || "EUR",
          net_amount: extracted.net_amount || 0,
          vat_amount: extracted.vat_amount || 0,
          total_amount: extracted.total_amount || 0,
          vat_number: extracted.vat_number || null,
          category: finalCategory,
        });
      } else {
        await supabase.from("expense_records").insert({
          user_id: doc.user_id,
          organization_id: doc.organization_id || null,
          document_id: documentId,
          supplier_name: extracted.supplier_name || "Unknown",
          invoice_number: extracted.invoice_number || null,
          invoice_date: extracted.invoice_date || new Date().toISOString().split("T")[0],
          due_date: extracted.due_date || null,
          currency: extracted.currency || "EUR",
          net_amount: extracted.net_amount || 0,
          vat_amount: extracted.vat_amount || 0,
          total_amount: extracted.total_amount || 0,
          vat_number: extracted.vat_number || null,
          category: finalCategory,
        });
      }
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
