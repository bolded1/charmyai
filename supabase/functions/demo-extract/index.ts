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

    // Check if demo is enabled
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

    // Enforce per-session rate limiting using max_uploads_per_day from demo_settings
    const { data: maxSetting } = await supabase
      .from("demo_settings")
      .select("value")
      .eq("key", "max_uploads_per_day")
      .single();

    const maxUploadsPerDay = typeof maxSetting?.value === "number" ? maxSetting.value : 50;

    // Get the requesting IP from headers for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") || "unknown";

    // Count today's uploads for this IP address
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);

    const { count: todayCount, error: countErr } = await supabase
      .from("demo_uploads")
      .select("id", { count: "exact", head: true })
      .eq("ip_address", clientIp)
      .gte("created_at", todayStart.toISOString());

    if (!countErr && todayCount !== null && todayCount >= maxUploadsPerDay) {
      return new Response(JSON.stringify({ error: "Daily demo limit reached. Please try again tomorrow." }), {
        status: 429,
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

    // Idempotency: return cached result if already completed
    if (demo.status === "completed" && demo.extracted_data) {
      return new Response(
        JSON.stringify({ success: true, extracted: demo.extracted_data }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already errored, don't retry automatically
    if (demo.status === "error") {
      return new Response(JSON.stringify({ error: "This demo upload previously failed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Optimistic status lock: only proceed if status is still 'processing' (initial state)
    const { data: lockResult, error: lockErr } = await supabase
      .from("demo_uploads")
      .update({ status: "extracting" })
      .eq("id", demoUploadId)
      .eq("status", "processing")
      .select("id");

    if (lockErr || !lockResult || lockResult.length === 0) {
      return new Response(JSON.stringify({ error: "Upload is already being processed" }), {
        status: 409,
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
    const model = "google/gemini-2.5-flash";

    // Call AI to extract data
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
            content: `You are a financial document extraction AI. Analyse the document and return ONLY a single valid JSON object — no markdown, no explanation, no code fences.

JSON schema:
{
  "document_type": "expense_invoice" | "sales_invoice" | "receipt" | "credit_note",
  "supplier_name": string,
  "customer_name": string,
  "invoice_number": string,
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD",
  "currency": "EUR",
  "net_amount": 0.00,
  "vat_amount": 0.00,
  "total_amount": 0.00,
  "vat_number": string,
  "category": string,
  "confidence": 85
}`,
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
    const msg = aiResult.choices?.[0]?.message;
    let rawJson: string | null = null;
    if (msg?.content) {
      rawJson = msg.content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    } else if (msg?.tool_calls?.[0]?.function?.arguments) {
      rawJson = msg.tool_calls[0].function.arguments;
    }

    if (!rawJson) {
      await supabase.from("demo_uploads").update({ status: "error" }).eq("id", demoUploadId);
      return new Response(JSON.stringify({ error: "AI did not return structured data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extracted: Record<string, unknown>;
    try {
      extracted = JSON.parse(rawJson);
    } catch {
      await supabase.from("demo_uploads").update({ status: "error" }).eq("id", demoUploadId);
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
