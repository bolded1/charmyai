import { supabase } from "@/integrations/supabase/client";

type AuditAction =
  | "user_login" | "user_login_failed" | "user_signup" | "password_reset"
  | "admin_gdpr_export" | "admin_gdpr_delete"
  | "admin_user_suspended" | "admin_bulk_role_change" | "admin_bulk_deactivate"
  | "admin_firm_action" | "admin_flag_created" | "admin_flag_deleted" | "admin_flag_toggled";

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
