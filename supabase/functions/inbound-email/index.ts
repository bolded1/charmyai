import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Mailgun Inbound Routes sends multipart/form-data
    const formData = await req.formData();

    const recipient = formData.get("recipient") as string || "";
    const from = formData.get("from") as string || "";
    const subject = formData.get("subject") as string || "";
    const messageHeaders = formData.get("message-headers") as string || "";

    // Extract email and name from "from" field: "John Doe <john@example.com>"
    const fromMatch = from.match(/^(?:"?(.+?)"?\s)?<?([^\s>]+@[^\s>]+)>?$/);
    const senderName = fromMatch?.[1] || "";
    const senderEmail = fromMatch?.[2] || from;

    // Extract import token from recipient address
    // Format: {token}@imports.appdomain.com or prefix+{token}@imports.appdomain.com
    const toMatch = recipient.match(/(?:\+)?([a-f0-9]{32})@/i);
    const importToken = toMatch?.[1];

    if (!importToken) {
      console.error("Could not extract import token from:", recipient);
      return new Response(JSON.stringify({ error: "Invalid import address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up organization by import token
    const { data: org, error: orgErr } = await supabase
      .from("organizations")
      .select("id, owner_user_id")
      .eq("import_email_token", importToken)
      .single();

    if (orgErr || !org) {
      console.error("Organization not found for token:", importToken);
      return new Response(JSON.stringify({ error: "Organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract message ID from Mailgun's message-headers (JSON array of [name, value] pairs)
    let messageId: string | null = null;
    try {
      const headersArray = JSON.parse(messageHeaders) as [string, string][];
      const msgIdHeader = headersArray.find(([name]) => name.toLowerCase() === "message-id");
      if (msgIdHeader) {
        messageId = msgIdHeader[1].replace(/^<|>$/g, "");
      }
    } catch {
      // fallback: no message ID
    }

    // Check for duplicate
    if (messageId) {
      const { data: existing } = await supabase
        .from("email_imports")
        .select("id")
        .eq("message_id", messageId)
        .maybeSingle();

      if (existing) {
        return new Response(JSON.stringify({ message: "Duplicate email, skipped" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Collect attachments from form data
    // Mailgun sends attachments as "attachment-1", "attachment-2", etc.
    const attachments: { file: File; name: string }[] = [];
    const attachmentCount = parseInt(formData.get("attachment-count") as string || "0", 10);

    for (let i = 1; i <= Math.max(attachmentCount, 30); i++) {
      const file = formData.get(`attachment-${i}`) as File | null;
      if (!file) {
        if (i > attachmentCount) break;
        continue;
      }
      attachments.push({ file, name: file.name || `attachment-${i}` });
    }

    // Filter supported attachments
    const supportedAttachments = attachments.filter((a) => {
      const type = a.file.type.toLowerCase();
      const ext = a.name.toLowerCase().split(".").pop();
      const isSupported = SUPPORTED_TYPES.includes(type) || ["pdf", "png", "jpg", "jpeg"].includes(ext || "");
      const isWithinSize = a.file.size <= MAX_ATTACHMENT_SIZE;
      return isSupported && isWithinSize;
    });

    // Create email import record
    const importStatus = supportedAttachments.length === 0
      ? (attachments.length === 0 ? "ignored" : "failed")
      : "processing";

    const errorMessage = supportedAttachments.length === 0
      ? (attachments.length === 0
        ? "No attachments found"
        : `No supported attachments (found: ${attachments.map(a => a.name).join(", ")})`)
      : null;

    const { data: emailImport, error: importErr } = await supabase
      .from("email_imports")
      .insert({
        organization_id: org.id,
        sender_email: senderEmail,
        sender_name: senderName,
        recipient_address: to,
        subject,
        message_id: messageId,
        attachment_count: attachments.length,
        processed_count: 0,
        status: importStatus,
        error_message: errorMessage,
      })
      .select()
      .single();

    if (importErr) {
      console.error("Failed to create email import:", importErr);
      return new Response(JSON.stringify({ error: "Failed to log email import" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (supportedAttachments.length === 0) {
      return new Response(JSON.stringify({ message: importStatus, emailImportId: emailImport.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process each supported attachment
    let processedCount = 0;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    for (const att of supportedAttachments) {
      try {
        const filePath = `${org.owner_user_id}/${Date.now()}-${att.name}`;

        // Upload to storage
        const { error: uploadErr } = await supabase.storage
          .from("documents")
          .upload(filePath, att.file);

        if (uploadErr) {
          console.error("Upload error for", att.name, uploadErr);
          continue;
        }

        // Determine MIME type
        let fileType = att.file.type;
        if (!fileType || fileType === "application/octet-stream") {
          const ext = att.name.toLowerCase().split(".").pop();
          const mimeMap: Record<string, string> = {
            pdf: "application/pdf",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
          };
          fileType = mimeMap[ext || ""] || "application/octet-stream";
        }

        // Create document record
        const { data: doc, error: docErr } = await supabase
          .from("documents")
          .insert({
            user_id: org.owner_user_id,
            file_name: att.name,
            file_path: filePath,
            file_type: fileType,
            file_size: att.file.size,
            status: "processing",
            source: "email_import",
            email_import_id: emailImport.id,
          })
          .select()
          .single();

        if (docErr) {
          console.error("Doc insert error for", att.name, docErr);
          continue;
        }

        processedCount++;

        // Trigger AI extraction (fire and forget for each attachment)
        if (LOVABLE_API_KEY) {
          const extractUrl = `${supabaseUrl}/functions/v1/extract-document`;
          fetch(extractUrl, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ documentId: doc.id }),
          }).catch((e) => console.error("Extract trigger failed for", doc.id, e));
        }
      } catch (e) {
        console.error("Error processing attachment", att.name, e);
      }
    }

    // Update email import with final counts
    await supabase
      .from("email_imports")
      .update({
        processed_count: processedCount,
        status: processedCount > 0 ? "processed" : "failed",
        error_message: processedCount === 0 ? "All attachments failed to process" : null,
      })
      .eq("id", emailImport.id);

    return new Response(
      JSON.stringify({
        success: true,
        emailImportId: emailImport.id,
        processed: processedCount,
        total: supportedAttachments.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("inbound-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
