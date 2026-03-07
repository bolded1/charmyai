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
    const { demoUploadId } = await req.json();
    if (!demoUploadId) {
      return new Response(JSON.stringify({ error: "demoUploadId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Check rate limiting via demo_settings
    const { data: rateSetting } = await supabase
      .from("demo_settings")
      .select("value")
      .eq("key", "enabled")
      .single();

    if (!rateSetting || rateSetting.value !== true) {
      return new Response(JSON.stringify({ error: "Demo is currently disabled" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get demo upload record
    const { data: demo, error: demoErr } = await supabase
      .from("demo_uploads")
      .select("*")
      .eq("id", demoUploadId)
      .single();

    if (demoErr || !demo) {
      return new Response(JSON.stringify({ error: "Demo upload not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download file from demo-uploads bucket
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("demo-uploads")
      .download(demo.file_path);

    if (fileErr || !fileData) {
      await supabase
        .from("demo_uploads")
        .update({ status: "error" })
        .eq("id", demoUploadId);
      return new Response(JSON.stringify({ error: "Could not download file" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64
    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const mimeType = demo.file_type === "application/pdf" ? "application/pdf" : demo.file_type;
    const isPdf = demo.file_type === "application/pdf";
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
            content: "You are a financial document extraction AI for a demo. Extract accounting data from the uploaded document. Always return structured data using the provided tool.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all accounting fields from this financial document. Identify supplier/customer info, invoice details, dates, amounts, VAT, and category.",
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
                  supplier_name: { type: "string" },
                  customer_name: { type: "string" },
                  invoice_number: { type: "string" },
                  invoice_date: { type: "string", description: "YYYY-MM-DD" },
                  due_date: { type: "string", description: "YYYY-MM-DD" },
                  currency: { type: "string", description: "3-letter code" },
                  net_amount: { type: "number" },
                  vat_amount: { type: "number" },
                  total_amount: { type: "number" },
                  vat_number: { type: "string" },
                  discount_amount: { type: "number", description: "Discount amount if any" },
                  category: { type: "string" },
                  confidence: { type: "number", description: "0-100" },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      await supabase.from("demo_uploads").update({ status: "error" }).eq("id", demoUploadId);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      await supabase.from("demo_uploads").update({ status: "error" }).eq("id", demoUploadId);
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(toolCall.function.arguments);

    // Update demo record with extracted data
    await supabase
      .from("demo_uploads")
      .update({
        status: "completed",
        extracted_data: extracted,
        confidence_score: extracted.confidence || null,
      })
      .eq("id", demoUploadId);

    return new Response(
      JSON.stringify({ success: true, extracted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("demo-extract error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
