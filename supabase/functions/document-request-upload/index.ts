import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPPORTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    // ── GET: look up a request by token ────────────────────────────────
    if (req.method === "GET") {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");

      if (!token) {
        return new Response(JSON.stringify({ error: "token required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: request, error } = await adminClient
        .from("document_requests")
        .select("id, title, description, status, expires_at, upload_count, firm_org_id, workspace_id")
        .eq("token", token)
        .maybeSingle();

      if (error || !request) {
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Fetch firm and workspace names
      const [{ data: firm }, { data: workspace }] = await Promise.all([
        adminClient.from("organizations").select("name").eq("id", request.firm_org_id).single(),
        adminClient.from("organizations").select("name").eq("id", request.workspace_id).single(),
      ]);

      const isExpired = request.expires_at ? new Date(request.expires_at) < new Date() : false;

      return new Response(
        JSON.stringify({
          request: {
            title: request.title,
            description: request.description,
            status: isExpired ? "expired" : request.status,
            expires_at: request.expires_at,
            upload_count: request.upload_count,
            firm_name: firm?.name ?? "Your accountant",
            workspace_name: workspace?.name ?? "Your workspace",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── POST: upload one file ───────────────────────────────────────────
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") ?? "";

      if (!contentType.includes("multipart/form-data")) {
        return new Response(JSON.stringify({ error: "multipart/form-data required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const formData = await req.formData();
      const token = formData.get("token") as string | null;
      const file = formData.get("file") as File | null;
      const uploaderName = (formData.get("uploader_name") as string | null) ?? null;
      const uploaderEmail = (formData.get("uploader_email") as string | null) ?? null;

      if (!token || !file) {
        return new Response(JSON.stringify({ error: "token and file are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate request
      const { data: request, error: reqErr } = await adminClient
        .from("document_requests")
        .select("*")
        .eq("token", token)
        .eq("status", "active")
        .maybeSingle();

      if (reqErr || !request) {
        return new Response(JSON.stringify({ error: "Upload link is invalid or has been closed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (request.expires_at && new Date(request.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "This upload link has expired" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate file
      if (file.size > MAX_FILE_SIZE) {
        return new Response(JSON.stringify({ error: `File exceeds 20MB limit` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!SUPPORTED_TYPES.includes(file.type)) {
        return new Response(
          JSON.stringify({ error: `Unsupported file type. Please upload PDF or image files.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Store file in documents bucket
      const filePath = `${request.created_by}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const fileBuffer = await file.arrayBuffer();

      const { error: uploadErr } = await adminClient.storage
        .from("documents")
        .upload(filePath, fileBuffer, { contentType: file.type });

      if (uploadErr) {
        console.error("Storage upload error:", uploadErr);
        return new Response(JSON.stringify({ error: "Failed to store file" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create document record attributed to the firm member who created the request
      const { data: doc, error: docErr } = await adminClient
        .from("documents")
        .insert({
          user_id: request.created_by,
          organization_id: request.workspace_id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          source: "document_request",
          status: "processing",
        })
        .select("id")
        .single();

      if (docErr || !doc) {
        // Clean up orphaned file
        await adminClient.storage.from("documents").remove([filePath]);
        return new Response(JSON.stringify({ error: "Failed to register document" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Record the upload in the tracking table
      await adminClient.from("document_request_uploads").insert({
        request_id: request.id,
        document_id: doc.id,
        uploader_name: uploaderName,
        uploader_email: uploaderEmail,
      });

      // Increment upload_count
      await adminClient
        .from("document_requests")
        .update({ upload_count: request.upload_count + 1, updated_at: new Date().toISOString() })
        .eq("id", request.id);

      // Trigger AI extraction (fire-and-forget style, don't block response)
      try {
        const extractUrl = `${supabaseUrl}/functions/v1/extract-document`;
        fetch(extractUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": serviceRoleKey,
          },
          body: JSON.stringify({ documentId: doc.id, userId: request.created_by }),
        }).catch((e) => console.error("Extract trigger failed:", e));
      } catch (triggerErr) {
        console.error("Failed to trigger extraction:", triggerErr);
      }

      return new Response(
        JSON.stringify({ document_id: doc.id, file_name: file.name }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("document-request-upload error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
