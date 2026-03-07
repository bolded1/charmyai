import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
const SUPPORTED_EXTS = ["pdf", "png", "jpg", "jpeg"];
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024; // 20MB

type AttachmentRef = {
  url: string;
  name?: string;
  contentType?: string;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response | null> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;

      // Retry on transient errors
      if ([404, 408, 429, 500, 502, 503, 504].includes(response.status) && attempt < attempts) {
        // Consume body to avoid resource leak
        await response.text();
        await sleep(500 * attempt);
        continue;
      }
      return response;
    } catch {
      if (attempt < attempts) {
        await sleep(500 * attempt);
        continue;
      }
    }
  }
  return null;
}

function getApiHosts(originalUrl: string): string[] {
  const hosts: string[] = [];
  try {
    const parsed = new URL(originalUrl);
    hosts.push(parsed.hostname);

    // Add regional variants
    const variants = [
      "api.eu.mailgun.net",
      "storage-europe-west1.api.mailgun.net",
      "api.mailgun.net",
    ];
    for (const v of variants) {
      if (!hosts.includes(v)) hosts.push(v);
    }
  } catch {
    // keep empty
  }
  return hosts;
}

async function downloadFromMailgun(
  url: string,
  mailgunApiKey: string,
): Promise<Response | null> {
  const headers = { Authorization: `Basic ${btoa(`api:${mailgunApiKey}`)}` };

  // Try original URL first
  let response = await fetchWithRetry(url, { headers });
  if (response?.ok) return response;
  if (response) await response.text().catch(() => {}); // consume body

  // Try alternate hosts
  const altHosts = getApiHosts(url);
  try {
    const parsed = new URL(url);
    for (const host of altHosts) {
      if (host === parsed.hostname) continue;
      const altUrl = new URL(url);
      altUrl.hostname = host;
      response = await fetchWithRetry(altUrl.toString(), { headers });
      if (response?.ok) return response;
      if (response) await response.text().catch(() => {}); // consume body
    }
  } catch {
    // URL parsing error
  }

  return null;
}

// Parse MIME boundary and extract attachment parts from raw MIME body
function parseMimeAttachments(mimeBody: string): { name: string; contentType: string; data: Uint8Array }[] {
  const results: { name: string; contentType: string; data: Uint8Array }[] = [];

  // Find boundary from Content-Type header in MIME
  const boundaryMatch = mimeBody.match(/boundary="?([^"\r\n;]+)"?/i);
  if (!boundaryMatch) return results;

  const boundary = boundaryMatch[1];
  const parts = mimeBody.split(`--${boundary}`);

  for (const part of parts) {
    if (part.trim() === "--" || part.trim() === "") continue;

    // Check if this part is an attachment
    const contentDisp = part.match(/Content-Disposition:\s*attachment[^;\r\n]*(?:;\s*filename="?([^"\r\n]+)"?)?/i);
    if (!contentDisp) continue;

    const filename = contentDisp[1]?.trim() || "attachment";
    const ext = filename.toLowerCase().split(".").pop() || "";
    if (!SUPPORTED_EXTS.includes(ext)) continue;

    const contentTypeMatch = part.match(/Content-Type:\s*([^\r\n;]+)/i);
    const contentType = contentTypeMatch?.[1]?.trim() || "application/octet-stream";

    const encodingMatch = part.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i);
    const encoding = encodingMatch?.[1]?.trim().toLowerCase() || "";

    // Split headers from body (double newline)
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const bodyStr = part.substring(headerEnd + 4).trim();

    let data: Uint8Array;
    if (encoding === "base64") {
      try {
        const binary = atob(bodyStr.replace(/[\r\n\s]/g, ""));
        data = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          data[i] = binary.charCodeAt(i);
        }
      } catch {
        continue;
      }
    } else {
      // 7bit, 8bit, or quoted-printable — treat as raw text
      data = new TextEncoder().encode(bodyStr);
    }

    if (data.length > 0 && data.length <= MAX_ATTACHMENT_SIZE) {
      results.push({ name: filename, contentType, data });
    }
  }

  return results;
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
    const messageUrl = formData.get("message-url") as string || "";
    const bodyMime = formData.get("body-mime") as string || "";

    // === DIAGNOSTIC LOGGING ===
    const fieldDiag: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        fieldDiag.push(`${key}=[File: ${value.name}, type=${value.type}, size=${value.size}]`);
      } else {
        const str = String(value);
        fieldDiag.push(`${key}=[${str.length > 80 ? str.substring(0, 80) + "..." : str}]`);
      }
    }
    console.log("DIAG: All form fields:", fieldDiag.join(" | "));

    const attachmentsRaw = formData.get("attachments") as string || "";
    if (attachmentsRaw) {
      console.log("DIAG: attachments field value:", attachmentsRaw.substring(0, 500));
    }
    if (messageUrl) {
      console.log("DIAG: message-url:", messageUrl);
    }
    if (bodyMime) {
      console.log("DIAG: body-mime present, length:", bodyMime.length);
    }
    // === END DIAGNOSTIC ===

    // Extract email and name from "from" field
    const fromMatch = from.match(/^(?:"?(.+?)"?\s)?<?([^\s>]+@[^\s>]+)>?$/);
    const senderName = fromMatch?.[1] || "";
    const senderEmail = fromMatch?.[2] || from;

    // Extract import token from recipient address
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

    // Extract message ID
    let messageId: string | null = null;
    try {
      const headersArray = JSON.parse(messageHeaders) as [string, string][];
      const msgIdHeader = headersArray.find(([name]) => name.toLowerCase() === "message-id");
      if (msgIdHeader) {
        messageId = msgIdHeader[1].replace(/^<|>$/g, "");
      }
    } catch {
      // fallback
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

    // ═══════════════════════════════════════════
    //  ATTACHMENT COLLECTION (multiple strategies)
    // ═══════════════════════════════════════════
    const attachments: { file: File; name: string }[] = [];
    let announcedAttachmentCount = 0;

    // Strategy 1: Direct file parts ("attachment-N" or "attachment" entries)
    const attachmentCount = parseInt(formData.get("attachment-count") as string || "0", 10);
    if (attachmentCount > 0) {
      announcedAttachmentCount = attachmentCount;
    }

    for (let i = 1; i <= Math.max(attachmentCount, 30); i++) {
      const file = formData.get(`attachment-${i}`) as File | null;
      if (!file) {
        if (i > attachmentCount) break;
        continue;
      }
      attachments.push({ file, name: file.name || `attachment-${i}` });
    }

    if (attachments.length === 0) {
      const allEntries = formData.getAll("attachment");
      for (const entry of allEntries) {
        if (entry instanceof File && entry.size > 0) {
          attachments.push({ file: entry, name: entry.name || `attachment-${attachments.length + 1}` });
        }
      }
    }

    // Strategy 2: Scan ALL form fields for File objects
    if (attachments.length === 0) {
      for (const [key, value] of formData.entries()) {
        if (value instanceof File && value.size > 0 && !["inline", "content-id-map"].includes(key)) {
          attachments.push({ file: value, name: value.name || key });
        }
      }
    }

    // Strategy 3: Parse "attachments" JSON field → download from URLs
    const mailgunApiKey = Deno.env.get("MAILGUN_API_KEY");

    if (attachments.length === 0 && attachmentsRaw) {
      try {
        const parsed = JSON.parse(attachmentsRaw) as unknown;
        const refs: AttachmentRef[] = [];

        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && typeof item === "object") {
              const obj = item as Record<string, unknown>;
              const url = (obj.url || obj["attachment-url"] || obj.download_url) as string | undefined;
              refs.push({
                url: url || "",
                name: (obj.name || obj.filename) as string | undefined,
                contentType: (obj["content-type"] || obj.contentType || obj.mimetype) as string | undefined,
              });
            }
          }
        }

        announcedAttachmentCount = Math.max(announcedAttachmentCount, refs.length);

        // Download refs that have URLs
        if (mailgunApiKey) {
          for (const ref of refs.filter((r) => r.url)) {
            const response = await downloadFromMailgun(ref.url, mailgunApiKey);
            if (!response || !response.ok) {
              console.error("Strategy 3: All download attempts failed for:", ref.url);
              continue;
            }

            const blob = await response.blob();
            if (!blob || blob.size === 0) continue;

            const filename = ref.name || "attachment";
            const file = new File([blob], filename, {
              type: ref.contentType || blob.type || "application/octet-stream",
            });
            attachments.push({ file, name: file.name });
          }
        }
      } catch (parseErr) {
        console.error("Could not parse attachments field:", parseErr);
      }
    }

    // Strategy 4: Fetch full message from message-url, then download attachments from it
    if (attachments.length === 0 && messageUrl && mailgunApiKey) {
      console.log("Strategy 4: Trying message-url fetch...");

      const messageRes = await downloadFromMailgun(messageUrl, mailgunApiKey);

      if (messageRes?.ok) {
        try {
          const payload = await messageRes.json() as Record<string, unknown>;
          const payloadAttachments = Array.isArray(payload.attachments)
            ? payload.attachments as Record<string, unknown>[]
            : [];

          announcedAttachmentCount = Math.max(announcedAttachmentCount, payloadAttachments.length);
          console.log("Strategy 4: Message payload has", payloadAttachments.length, "attachments");

          for (const item of payloadAttachments) {
            const url = (item.url || item["attachment-url"]) as string | undefined;
            if (!url) continue;

            const response = await downloadFromMailgun(url, mailgunApiKey);
            if (!response?.ok) {
              console.error("Strategy 4: Failed downloading attachment:", url);
              continue;
            }

            const blob = await response.blob();
            if (!blob || blob.size === 0) continue;

            const filename = (item.name || item.filename || "attachment") as string;
            const file = new File([blob], filename, {
              type: (item["content-type"] || blob.type || "application/octet-stream") as string,
            });
            attachments.push({ file, name: file.name });
          }
        } catch (err) {
          console.error("Strategy 4: Failed parsing message payload:", err);
        }
      } else {
        const status = messageRes?.status ?? "no-response";
        console.error(`Strategy 4: message-url fetch failed (${status})`);
        if (messageRes) await messageRes.text().catch(() => {});
      }
    }

    // Strategy 5: Parse raw MIME body if present (body-mime field)
    if (attachments.length === 0 && bodyMime) {
      console.log("Strategy 5: Parsing raw MIME body...");
      const mimeAttachments = parseMimeAttachments(bodyMime);
      console.log("Strategy 5: Found", mimeAttachments.length, "MIME attachments");

      for (const att of mimeAttachments) {
        const file = new File([att.data], att.name, { type: att.contentType });
        attachments.push({ file, name: att.name });
      }
    }

    console.log(`RESULT: Found ${attachments.length} attachments. Announced: ${announcedAttachmentCount}.`);

    // Filter supported attachments
    const supportedAttachments = attachments.filter((a) => {
      const type = a.file.type.toLowerCase();
      const ext = a.name.toLowerCase().split(".").pop();
      const isSupported = SUPPORTED_TYPES.includes(type) || SUPPORTED_EXTS.includes(ext || "");
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
        : `No supported attachments (found: ${attachments.map((a) => a.name).join(", ")})`)
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

        const { error: uploadErr } = await supabase.storage
          .from("documents")
          .upload(filePath, att.file);

        if (uploadErr) {
          console.error("Upload error for", att.name, uploadErr);
          continue;
        }

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
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("inbound-email error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
