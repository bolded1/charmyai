import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useImpersonation } from "@/contexts/ImpersonationContext";
import { useActiveOrgId } from "@/hooks/useOrganization";

const CATEGORY_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
  "#a855f7", "#d946ef", "#0ea5e9", "#10b981", "#f59e0b",
];

/** Ensure a category exists in expense_categories; create with a random color if missing. */
async function ensureCategoryExists(
  categoryName: string | null | undefined,
  userId: string,
  organizationId: string | null
) {
  if (!categoryName || !categoryName.trim()) return;
  const trimmed = categoryName.trim();

  let query = supabase
    .from("expense_categories")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", trimmed);

  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  } else {
    query = query.is("organization_id", null);
  }

  const { data: existing } = await query.maybeSingle();
  if (existing) return;

  const color = CATEGORY_COLORS[Math.floor(Math.random() * CATEGORY_COLORS.length)];

  await supabase.from("expense_categories").insert({
    user_id: userId,
    name: trimmed,
    color,
    organization_id: organizationId,
  });
}

const WEBHOOK_FN = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/trigger-webhook`;

/** Fire-and-forget: dispatch a webhook event without blocking the caller. */
async function dispatchWebhookEvent(event: string, payload: Record<string, unknown>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    fetch(WEBHOOK_FN, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ event, payload }),
    }).catch(() => {/* silently ignore delivery failures */});
  } catch { /* ignore */ }
}

export interface DocumentRecord {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  document_type: string | null;
  supplier_name: string | null;
  customer_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  currency: string | null;
  net_amount: number | null;
  vat_amount: number | null;
  total_amount: number | null;
  vat_number: string | null;
  category: string | null;
  status: string;
  ocr_text: string | null;
  extracted_data: any;
  user_corrections: any;
  confidence_score: number | null;
  validation_errors: any;
  created_at: string;
  updated_at: string;
}

export function useDocuments(statusFilter?: string) {
  const { effectiveUserId } = useImpersonation();
  return useQuery({
    queryKey: ["documents", statusFilter, effectiveUserId],
    queryFn: async () => {
      // Get user's active workspace
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = effectiveUserId || user?.id;
      if (!targetUserId) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", effectiveUserId || user!.id)
        .maybeSingle();

      let query = supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (effectiveUserId) {
        query = query.eq("user_id", effectiveUserId);
      }

      // Filter by active workspace if set
      if (profile?.active_organization_id) {
        query = query.eq("organization_id", profile.active_organization_id);
      }

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentRecord[];
    },
  });
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get active workspace
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Duplicate detection: same file_name + file_size for this user
      const { data: existing } = await supabase
        .from("documents")
        .select("id, file_name")
        .eq("user_id", user.id)
        .eq("file_name", file.name)
        .eq("file_size", file.size)
        .maybeSingle();

      if (existing) {
        throw new Error(
          `"${file.name}" looks like a duplicate — a file with the same name and size was already uploaded. Check your existing documents to avoid double entries.`
        );
      }

      const filePath = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record with organization_id
      const { data: doc, error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          organization_id: profile?.active_organization_id || null,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          status: "processing",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger AI extraction
      const { error: fnError } = await supabase.functions.invoke("extract-document", {
        body: { documentId: doc.id },
      });

      if (fnError) {
        console.error("Extraction error:", fnError);
        const message = typeof fnError.message === "string" ? fnError.message : "";
        const isAccessOrBillingBlock = message.includes("403") || /forbidden|subscription required/i.test(message);
        if (!isAccessOrBillingBlock) {
          toast.error(`Extraction failed for ${file.name}. You can review manually.`);
        }
      }

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<DocumentRecord> }) => {
      const { data, error } = await supabase
        .from("documents")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Notes sync removed — notes column does not exist on expense/income records

      // Dispatch webhook (fire-and-forget)
      dispatchWebhookEvent("document.updated", { document: data });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

export function useApproveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: DocumentRecord) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save user corrections first (without changing status yet)
      const { error: updateErr } = await supabase
        .from("documents")
        .update({
          user_corrections: doc.user_corrections,
          updated_at: new Date().toISOString(),
        })
        .eq("id", doc.id);

      if (updateErr) throw updateErr;

      // Get active workspace for the expense record
      const { data: approverProfile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Resolve org default currency for fallback
      let orgDefaultCurrency = "EUR";
      if (approverProfile?.active_organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("default_currency")
          .eq("id", approverProfile.active_organization_id)
          .maybeSingle();
        if (orgData?.default_currency) orgDefaultCurrency = orgData.default_currency;
      }

      // Auto-create category if AI assigned one
      await ensureCategoryExists(
        doc.category,
        user.id,
        approverProfile?.active_organization_id || null
      );

      // Create expense or income record based on document type
      // notes column added in migration 20260317120000 – omit if column absent
      const docNotes = (doc.user_corrections as any)?._notes || null;
      const notesField = docNotes !== null ? { notes: docNotes } : {};

      // Guard: skip record creation if one already exists for this document
      if (doc.document_type === "sales_invoice") {
        const { data: existingIncome } = await supabase
          .from("income_records")
          .select("id")
          .eq("document_id", doc.id)
          .maybeSingle();
        if (!existingIncome) {
          const { error } = await supabase.from("income_records").insert({
            user_id: user.id,
            organization_id: approverProfile?.active_organization_id || null,
            document_id: doc.id,
            customer_name: doc.customer_name || doc.supplier_name || "Unknown",
            invoice_number: doc.invoice_number,
            invoice_date: doc.invoice_date || new Date().toISOString().split("T")[0],
            due_date: doc.due_date,
            currency: doc.currency || orgDefaultCurrency,
            net_amount: doc.net_amount || 0,
            vat_amount: doc.vat_amount || 0,
            total_amount: doc.total_amount || 0,
            vat_number: doc.vat_number,
            category: doc.category,
            ...notesField,
          });
          if (error) throw error;
        }
      } else {
        const { data: existingExpense } = await supabase
          .from("expense_records")
          .select("id")
          .eq("document_id", doc.id)
          .maybeSingle();
        if (!existingExpense) {
          const { error } = await supabase.from("expense_records").insert({
            user_id: user.id,
            organization_id: approverProfile?.active_organization_id || null,
            document_id: doc.id,
            supplier_name: doc.supplier_name || doc.customer_name || "Unknown",
            invoice_number: doc.invoice_number,
            invoice_date: doc.invoice_date || new Date().toISOString().split("T")[0],
            due_date: doc.due_date,
            currency: doc.currency || orgDefaultCurrency,
            net_amount: doc.net_amount || 0,
            vat_amount: doc.vat_amount || 0,
            total_amount: doc.total_amount || 0,
            vat_number: doc.vat_number,
            category: doc.category,
            ...notesField,
          });
          if (error) throw error;
        }
      }

      // Only mark as approved AFTER record creation succeeds
      await supabase
        .from("documents")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", doc.id);

      // Dispatch webhook (fire-and-forget)
      const isIncome = doc.document_type === "sales_invoice";
      dispatchWebhookEvent("document.approved", {
        document: doc,
        record_type: isIncome ? "income" : "expense",
      });

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["expense_categories"] });
      toast.success("Document approved and record created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useExpenseRecords() {
  const { data: identity, isLoading: identityLoading } = useActiveOrgId();
  const { effectiveUserId } = useImpersonation();
  const query = useQuery({
    queryKey: ["expenses", identity?.userId, identity?.orgId],
    queryFn: async () => {
      if (!identity?.userId) return [];
      let q = supabase
        .from("expense_records")
        .select("*")
        .order("invoice_date", { ascending: false });
      if (effectiveUserId) {
        q = q.eq("user_id", effectiveUserId);
      }
      if (identity.orgId) {
        q = q.eq("organization_id", identity.orgId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!identity?.userId,
  });
  return { ...query, isLoading: query.isLoading || identityLoading };
}

export function useIncomeRecords() {
  const { data: identity, isLoading: identityLoading } = useActiveOrgId();
  const { effectiveUserId } = useImpersonation();
  const query = useQuery({
    queryKey: ["income", identity?.userId, identity?.orgId],
    queryFn: async () => {
      if (!identity?.userId) return [];
      let q = supabase
        .from("income_records")
        .select("*")
        .order("invoice_date", { ascending: false });
      if (effectiveUserId) {
        q = q.eq("user_id", effectiveUserId);
      }
      if (identity.orgId) {
        q = q.eq("organization_id", identity.orgId);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!identity?.userId,
  });
  return { ...query, isLoading: query.isLoading || identityLoading };
}

export function useUploadIncomeDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const filePath = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      // Create document record as sales_invoice
      const { data: doc, error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          organization_id: profile?.active_organization_id || null,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          status: "processing",
          document_type: "sales_invoice",
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // Trigger AI extraction — pass skipRecordCreation so the edge function doesn't
      // create its own income_record (we do it below, unconditionally).
      const { error: fnError } = await supabase.functions.invoke("extract-document", {
        body: { documentId: doc.id, skipRecordCreation: true },
      });

      if (fnError) {
        console.error("Extraction error:", fnError);
        // Don't bail out — still approve + create income record with whatever data we have.
      }

      // Fetch the updated document (has extracted fields if extraction succeeded).
      // Fall back to the original doc object so we never skip record creation.
      let finalDoc: typeof doc = doc;
      const { data: updatedDoc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", doc.id)
        .single();
      if (updatedDoc) finalDoc = updatedDoc;

      // Auto-approve
      await supabase
        .from("documents")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", doc.id);

      let orgDefaultCurrencyIncome = "EUR";
      if (profile?.active_organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("default_currency")
          .eq("id", profile.active_organization_id)
          .maybeSingle();
        if (orgData?.default_currency) orgDefaultCurrencyIncome = orgData.default_currency;
      }

      const { error: incomeErr } = await supabase.from("income_records").insert({
        user_id: user.id,
        organization_id: profile?.active_organization_id || null,
        document_id: doc.id,
        customer_name: finalDoc.customer_name || finalDoc.supplier_name || "Unknown",
        invoice_number: finalDoc.invoice_number,
        invoice_date: finalDoc.invoice_date || new Date().toISOString().split("T")[0],
        due_date: finalDoc.due_date,
        currency: finalDoc.currency || orgDefaultCurrencyIncome,
        net_amount: finalDoc.net_amount || 0,
        vat_amount: finalDoc.vat_amount || 0,
        total_amount: finalDoc.total_amount || 0,
        vat_number: finalDoc.vat_number,
        category: finalDoc.category,
      });

      if (incomeErr) {
        console.error("Income record error:", incomeErr);
        throw new Error("Failed to save income record. Please try again.");
      }

      return finalDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      toast.success("Invoice processed and added to income");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export interface ManualExpenseInput {
  expense_type: "general" | "mileage" | "per_diem" | "cash";
  supplier_name: string;
  invoice_number?: string;
  invoice_date: string;
  currency: string;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  category?: string;
  receipt_file?: File;
  // Mileage extras
  distance_km?: number;
  rate_per_km?: number;
  // Per diem extras
  days?: number;
  daily_rate?: number;
}

export function useCreateManualExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ManualExpenseInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Build a human-readable reference for mileage / per diem
      let reference = input.invoice_number || "";
      if (input.expense_type === "mileage" && input.distance_km && input.rate_per_km) {
        reference = reference || `${input.distance_km} km @ ${input.rate_per_km}/km`;
      } else if (input.expense_type === "per_diem" && input.days && input.daily_rate) {
        reference = reference || `${input.days} days @ ${input.daily_rate}/day`;
      }

      // Optional receipt file upload
      let documentId: string | null = null;
      if (input.receipt_file) {
        const file = input.receipt_file;
        const filePath = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);
        if (!uploadError) {
          const { data: doc } = await supabase.from("documents").insert({
            user_id: user.id,
            organization_id: profile?.active_organization_id || null,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            status: "approved",
            supplier_name: input.supplier_name,
            invoice_date: input.invoice_date,
            currency: input.currency,
            total_amount: input.total_amount,
          }).select().single();
          if (doc) documentId = doc.id;
        }
      }

      // Auto-create category if provided
      await ensureCategoryExists(input.category, user.id, profile?.active_organization_id || null);

      const { data, error } = await supabase.from("expense_records").insert({
        user_id: user.id,
        organization_id: profile?.active_organization_id || null,
        document_id: documentId,
        supplier_name: input.supplier_name,
        invoice_number: reference || null,
        invoice_date: input.invoice_date,
        currency: input.currency,
        net_amount: input.net_amount,
        vat_amount: input.vat_amount,
        total_amount: input.total_amount,
        category: input.category || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Manual expense added");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch the record first to find linked document
      const { data: record } = await supabase
        .from("expense_records")
        .select("document_id")
        .eq("id", id)
        .maybeSingle();

      const { error } = await supabase
        .from("expense_records")
        .delete()
        .eq("id", id);
      if (error) throw error;

      // Revert linked document to "needs_review" so it can be re-approved
      if (record?.document_id) {
        await supabase
          .from("documents")
          .update({ status: "needs_review", updated_at: new Date().toISOString() })
          .eq("id", record.document_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Expense deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Fetch the record first to find linked document
      const { data: record } = await supabase
        .from("income_records")
        .select("document_id")
        .eq("id", id)
        .maybeSingle();

      const { error } = await supabase
        .from("income_records")
        .delete()
        .eq("id", id);
      if (error) throw error;

      // Revert linked document to "needs_review" so it can be re-approved
      if (record?.document_id) {
        await supabase
          .from("documents")
          .update({ status: "needs_review", updated_at: new Date().toISOString() })
          .eq("id", record.document_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Income record deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, documentId }: { id: string; updates: Record<string, any>; documentId?: string | null }) => {
      // notes column added in migration 20260317120000 – retry without it if absent
      let { data, error } = await supabase
        .from("expense_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error?.message?.includes("notes")) {
        const { notes: _dropped, ...rest } = updates as any;
        ({ data, error } = await supabase.from("expense_records").update(rest).eq("id", id).select().single());
      }
      if (error) throw error;

      // Sync notes back to the linked document (best-effort, don't fail the mutation)
      if (documentId && updates.notes !== undefined) {
        try {
          const { data: docData } = await supabase.from("documents").select("user_corrections").eq("id", documentId).single();
          const existing = (docData?.user_corrections as any) || {};
          await supabase.from("documents").update({
            user_corrections: { ...existing, _notes: updates.notes || null },
            updated_at: new Date().toISOString(),
          }).eq("id", documentId);
        } catch { /* notes sync is best-effort */ }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Expense updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates, documentId }: { id: string; updates: Record<string, any>; documentId?: string | null }) => {
      // notes column added in migration 20260317120000 – retry without it if absent
      let { data, error } = await supabase
        .from("income_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error?.message?.includes("notes")) {
        const { notes: _dropped, ...rest } = updates as any;
        ({ data, error } = await supabase.from("income_records").update(rest).eq("id", id).select().single());
      }
      if (error) throw error;

      // Sync notes back to the linked document (best-effort, don't fail the mutation)
      if (documentId && updates.notes !== undefined) {
        try {
          const { data: docData } = await supabase.from("documents").select("user_corrections").eq("id", documentId).single();
          const existing = (docData?.user_corrections as any) || {};
          await supabase.from("documents").update({
            user_corrections: { ...existing, _notes: updates.notes || null },
            updated_at: new Date().toISOString(),
          }).eq("id", documentId);
        } catch { /* notes sync is best-effort */ }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Income record updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useBulkApproveDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docs: DocumentRecord[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      let orgDefaultCurrencyBulk = "EUR";
      if (profile?.active_organization_id) {
        const { data: orgData } = await supabase
          .from("organizations")
          .select("default_currency")
          .eq("id", profile.active_organization_id)
          .maybeSingle();
        if (orgData?.default_currency) orgDefaultCurrencyBulk = orgData.default_currency;
      }

      for (const doc of docs) {
        if (doc.status === "approved" || doc.status === "exported") continue;

        // Auto-create category if AI assigned one
        await ensureCategoryExists(doc.category, user.id, profile?.active_organization_id || null);

        await supabase
          .from("documents")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("id", doc.id);

        // Guard: skip record creation if one already exists for this document
        if (doc.document_type === "sales_invoice") {
          const { data: existingInc } = await supabase
            .from("income_records").select("id").eq("document_id", doc.id).maybeSingle();
          if (!existingInc) {
            await supabase.from("income_records").insert({
              user_id: user.id,
              organization_id: profile?.active_organization_id || null,
              document_id: doc.id,
              customer_name: doc.customer_name || doc.supplier_name || "Unknown",
              invoice_number: doc.invoice_number,
              invoice_date: doc.invoice_date || new Date().toISOString().split("T")[0],
              due_date: doc.due_date,
              currency: doc.currency || orgDefaultCurrencyBulk,
              net_amount: doc.net_amount || 0,
              vat_amount: doc.vat_amount || 0,
              total_amount: doc.total_amount || 0,
              vat_number: doc.vat_number,
              category: doc.category,
            });
          }
        } else {
          const { data: existingExp } = await supabase
            .from("expense_records").select("id").eq("document_id", doc.id).maybeSingle();
          if (!existingExp) {
            await supabase.from("expense_records").insert({
              user_id: user.id,
              organization_id: profile?.active_organization_id || null,
              document_id: doc.id,
              supplier_name: doc.supplier_name || doc.customer_name || "Unknown",
              invoice_number: doc.invoice_number,
              invoice_date: doc.invoice_date || new Date().toISOString().split("T")[0],
              due_date: doc.due_date,
              currency: doc.currency || orgDefaultCurrencyBulk,
              net_amount: doc.net_amount || 0,
              vat_amount: doc.vat_amount || 0,
              total_amount: doc.total_amount || 0,
              vat_number: doc.vat_number,
              category: doc.category,
            });
          }
        }
      }
    },
    onSuccess: (_, docs) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      toast.success(`${docs.length} document(s) approved`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useBulkDeleteDocuments() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await supabase.from("documents").delete().eq("id", id);
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success(`${ids.length} document(s) deleted`);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRetryExtraction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      // Set status back to processing
      await supabase
        .from("documents")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", documentId);

      // Re-trigger extraction
      const { error } = await supabase.functions.invoke("extract-document", {
        body: { documentId },
      });

      if (error) throw new Error("Extraction failed. Please try again.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document queued for re-extraction");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function getDocumentFileUrl(filePath: string): string {
  const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getDocumentSignedUrl(filePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 3600);
  if (error) return null;
  return data.signedUrl;
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export interface ContactRecord {
  id: string;
  user_id: string;
  organization_id: string | null;
  name: string;
  type: "supplier" | "customer" | "both";
  vat_number: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface CreateContactInput {
  name: string;
  type: "supplier" | "customer" | "both";
  vat_number?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export function useContacts() {
  const { data: identity, isLoading: identityLoading } = useActiveOrgId();

  const query = useQuery<ContactRecord[]>({
    queryKey: ["contacts", identity?.userId, identity?.orgId],
    queryFn: async () => {
      if (!identity?.userId) return [];
      const q = identity.orgId
        ? supabase.from("contacts").select("*")
            .or(`user_id.eq.${identity.userId},organization_id.eq.${identity.orgId}`)
        : supabase.from("contacts").select("*").eq("user_id", identity.userId);
      const { data, error } = await q.order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as ContactRecord[];
    },
    enabled: !!identity?.userId,
  });
  return { ...query, isLoading: query.isLoading || identityLoading };
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContactInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data, error } = await supabase.from("contacts").insert({
        user_id: user.id,
        organization_id: profile?.active_organization_id || null,
        name: input.name.trim(),
        type: input.type,
        vat_number: input.vat_number?.trim() || null,
        email: input.email?.trim() || null,
        phone: input.phone?.trim() || null,
        notes: input.notes?.trim() || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

// ─── Manual Income ─────────────────────────────────────────────────────────────

export interface CreateManualIncomeInput {
  customer_name: string;
  invoice_number?: string;
  invoice_date: string;
  due_date?: string;
  currency: string;
  net_amount: number;
  vat_amount: number;
  total_amount: number;
  category?: string;
  vat_number?: string;
  notes?: string;
  receipt_file?: File;
}

export function useCreateManualIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateManualIncomeInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Optional receipt file upload
      let documentId: string | null = null;
      if (input.receipt_file) {
        const file = input.receipt_file;
        const filePath = `${user.id}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);
        if (!uploadError) {
          const { data: doc } = await supabase.from("documents").insert({
            user_id: user.id,
            organization_id: profile?.active_organization_id || null,
            file_name: file.name,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            status: "approved",
            document_type: "sales_invoice",
            customer_name: input.customer_name,
            invoice_date: input.invoice_date,
            currency: input.currency,
            total_amount: input.total_amount,
          }).select().single();
          if (doc) documentId = doc.id;
        }
      }

      const { data, error } = await supabase.from("income_records").insert({
        user_id: user.id,
        organization_id: profile?.active_organization_id || null,
        document_id: documentId,
        customer_name: input.customer_name,
        invoice_number: input.invoice_number || null,
        invoice_date: input.invoice_date,
        due_date: input.due_date || null,
        currency: input.currency,
        net_amount: input.net_amount,
        vat_amount: input.vat_amount,
        total_amount: input.total_amount,
        vat_number: input.vat_number || null,
        category: input.category || null,
        notes: input.notes || null,
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Income record added");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
