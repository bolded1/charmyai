import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB

type AttachmentRef = {
  url: string;
  name?: string;
  contentType?: string;
};

function getAttachmentUrlCandidates(url: string): string[] {
  const candidates = [url];

  try {
    const parsed = new URL(url);
    const idxMatch = parsed.pathname.match(/\/attachments\/(\d+)$/);

    // Some providers announce /attachments/0 but file exists at /attachments/1
    if (idxMatch) {
      const idx = Number(idxMatch[1]);
      if (Number.isFinite(idx)) {
        const plusOne = new URL(url);
        plusOne.pathname = parsed.pathname.replace(/\/attachments\/\d+$/, `/attachments/${idx + 1}`);
        candidates.push(plusOne.toString());
      }
    }

    // Regional fallback hosts observed in Mailgun routes
    if (parsed.hostname === "storage-europe-west1.api.mailgun.net") {
      const euHost = new URL(url);
      euHost.hostname = "api.eu.mailgun.net";
      candidates.push(euHost.toString());

      const usHost = new URL(url);
      usHost.hostname = "api.mailgun.net";
      candidates.push(usHost.toString());
    }
  } catch {
    // keep original URL only
  }

  return [...new Set(candidates)];
}

async function downloadAttachmentFromRef(ref: AttachmentRef, mailgunApiKey?: string | null): Promise<{ file: File; name: string } | null> {
  const headers: Record<string, string> = {};
  if (mailgunApiKey) {
    headers.Authorization = `Basic ${btoa(`api:${mailgunApiKey}`)}`;
  }

  const candidates = getAttachmentUrlCandidates(ref.url);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { headers });
      if (!response.ok) {
        console.error(`Failed downloading attachment URL (${response.status}):`, candidate);
        continue;
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) continue;

      let filename = ref.name || "attachment";
      if (!ref.name) {
        try {
          const pathname = new URL(candidate).pathname;
          const lastSegment = pathname.split("/").pop();
          if (lastSegment) filename = decodeURIComponent(lastSegment);
        } catch {
          // keep fallback filename
        }
      }

      const file = new File([blob], filename, {
        type: ref.contentType || blob.type || "application/octet-stream",
      });

      return { file, name: file.name };
    } catch (downloadErr) {
      console.error("Attachment URL download error:", downloadErr);
    }
  }

  return null;
}

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
    // Mailgun can send files directly OR send an "attachments" JSON with downloadable URLs (store+notify)
    const attachments: { file: File; name: string }[] = [];
    let announcedAttachmentCount = 0;

    // Method 1: Try "attachment-N" format (Mailgun legacy)
    const attachmentCount = parseInt(formData.get("attachment-count") as string || "0", 10);
    for (let i = 1; i <= Math.max(attachmentCount, 30); i++) {
      const file = formData.get(`attachment-${i}`) as File | null;
      if (!file) {
        if (i > attachmentCount) break;
        continue;
      }
      attachments.push({ file, name: file.name || `attachment-${i}` });
    }

    // Method 2: Try "attachment" entries (Mailgun direct multipart)
    if (attachments.length === 0) {
      const allEntries = formData.getAll("attachment");
      for (const entry of allEntries) {
        if (entry instanceof File && entry.size > 0) {
          attachments.push({ file: entry, name: entry.name || `attachment-${attachments.length + 1}` });
        }
      }
    }

    // Method 3: Scan all form fields for File objects (catch-all)
    if (attachments.length === 0) {
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0 && !["inline", "content-id-map"].includes(key)) {
          const type = value.type?.toLowerCase() || "";
          const ext = value.name?.toLowerCase().split(".").pop() || "";
          if (SUPPORTED_TYPES.includes(type) || ["pdf", "png", "jpg", "jpeg"].includes(ext)) {
            attachments.push({ file: value, name: value.name || key });
          }
        }
      }
    }

    // Method 4: Mailgun store+notify format - "attachments" contains JSON with attachment URLs
    if (attachments.length === 0) {
      const attachmentsField = formData.get("attachments");
      if (typeof attachmentsField === "string" && attachmentsField.trim()) {
        try {
          const parsed = JSON.parse(attachmentsField) as unknown;

          const refs: { url: string; name?: string; contentType?: string }[] = [];
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && typeof item === "object") {
                const obj = item as Record<string, unknown>;
                const url = (obj.url || obj["attachment-url"] || obj.download_url) as string | undefined;
                if (url) {
                  refs.push({
                    url,
                    name: (obj.name || obj.filename) as string | undefined,
                    contentType: (obj["content-type"] || obj.contentType || obj.mimetype) as string | undefined,
                  });
                }
              }
            }
          } else if (parsed && typeof parsed === "object") {
            for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
              if (typeof value === "string") {
                refs.push({ url: value, name: key });
              } else if (value && typeof value === "object") {
                const obj = value as Record<string, unknown>;
                const url = (obj.url || obj["attachment-url"] || obj.download_url) as string | undefined;
                if (url) {
                  refs.push({
                    url,
                    name: (obj.name || obj.filename || key) as string | undefined,
                    contentType: (obj["content-type"] || obj.contentType || obj.mimetype) as string | undefined,
                  });
                }
              }
            }
          }

          announcedAttachmentCount = refs.length;
          const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");

          for (const [idx, ref] of refs.entries()) {
            try {
              // Mailgun storage URLs always require Basic auth
              const headers: Record<string, string> = {};
              if (mailgunApiKey) {
                headers["Authorization"] = `Basic ${btoa(`api:${mailgunApiKey}`)}`;
              }

              const response = await fetch(ref.url, { headers });
              if (!response.ok) {
                console.error(`Failed downloading attachment URL (${response.status}):`, ref.url);
                continue;
              }

              const blob = await response.blob();
              if (!blob || blob.size === 0) continue;

              let filename = ref.name || `attachment-${idx + 1}`;
              if (!ref.name) {
                try {
                  const pathname = new URL(ref.url).pathname;
                  const lastSegment = pathname.split("/").pop();
                  if (lastSegment) filename = decodeURIComponent(lastSegment);
                } catch {
                  // ignore URL parsing error and keep fallback filename
                }
              }

              const file = new File([blob], filename, {
                type: ref.contentType || blob.type || "application/octet-stream",
              });
              attachments.push({ file, name: file.name });
            } catch (downloadErr) {
              console.error("Attachment URL download error:", downloadErr);
            }
          }
        } catch (parseErr) {
          console.error("Could not parse Mailgun attachments field:", parseErr);
        }
      }
    }

    console.log(`Found ${attachments.length} attachments. Announced: ${announcedAttachmentCount}. Form fields: ${[...formData.keys()].join(", ")}`);

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
        ? (announcedAttachmentCount > 0
          ? "Attachments announced by provider but download failed"
          : "No attachments found")
        : `No supported attachments (found: ${attachments.map(a => a.name).join(", ")})`)
      : null;

    const { data: emailImport, error: importErr } = await supabase
      .from("email_imports")
      .insert({
        organization_id: org.id,
        sender_email: senderEmail,
        sender_name: senderName,
        recipient_address: recipient,
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
