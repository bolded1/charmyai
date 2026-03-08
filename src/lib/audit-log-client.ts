import { supabase } from "@/integrations/supabase/client";

type AuditAction = "user_login" | "user_login_failed" | "user_signup" | "password_reset";

interface LogAuditEventParams {
  action: AuditAction;
  userId?: string;
  userEmail?: string;
  details?: string;
  metadata?: Record<string, string | number | boolean | null>;
  entityType?: string;
  entityId?: string;
}

export async function logAuditEvent({
  action,
  userId,
  userEmail,
  details,
  metadata,
  entityType,
  entityId,
}: LogAuditEventParams) {
  const { error } = await supabase.from("audit_logs").insert({
    action,
    user_id: userId,
    user_email: userEmail,
    details: details ?? null,
    metadata: metadata ?? {},
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
  });

  if (error) {
    console.warn("Failed to write audit log", { action, error: error.message });
  }
}
