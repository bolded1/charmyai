import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useImpersonation } from "@/contexts/ImpersonationContext";

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
        // Don't throw - the doc is created, extraction just failed
        toast.error(`Extraction failed for ${file.name}. You can review manually.`);
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
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useApproveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (doc: DocumentRecord) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update document status
      const { error: updateErr } = await supabase
        .from("documents")
        .update({
          status: "approved",
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

      // Create expense or income record based on document type
      if (doc.document_type === "sales_invoice") {
        const { error } = await supabase.from("income_records").insert({
          user_id: user.id,
          organization_id: approverProfile?.active_organization_id || null,
          document_id: doc.id,
          customer_name: doc.customer_name || doc.supplier_name || "Unknown",
          invoice_number: doc.invoice_number,
          invoice_date: doc.invoice_date || new Date().toISOString().split("T")[0],
          due_date: doc.due_date,
          currency: doc.currency || "EUR",
          net_amount: doc.net_amount || 0,
          vat_amount: doc.vat_amount || 0,
          total_amount: doc.total_amount || 0,
          vat_number: doc.vat_number,
          category: doc.category,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("expense_records").insert({
          user_id: user.id,
          organization_id: approverProfile?.active_organization_id || null,
          document_id: doc.id,
          supplier_name: doc.supplier_name || doc.customer_name || "Unknown",
          invoice_number: doc.invoice_number,
          invoice_date: doc.invoice_date || new Date().toISOString().split("T")[0],
          due_date: doc.due_date,
          currency: doc.currency || "EUR",
          net_amount: doc.net_amount || 0,
          vat_amount: doc.vat_amount || 0,
          total_amount: doc.total_amount || 0,
          vat_number: doc.vat_number,
          category: doc.category,
        });
        if (error) throw error;
      }

      return doc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["income"] });
      toast.success("Document approved and record created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useExpenseRecords() {
  const { effectiveUserId } = useImpersonation();
  return useQuery({
    queryKey: ["expenses", effectiveUserId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = effectiveUserId || user?.id;
      if (!uid) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", uid)
        .maybeSingle();

      let query = supabase
        .from("expense_records")
        .select("*")
        .order("invoice_date", { ascending: false });
      if (effectiveUserId) {
        query = query.eq("user_id", effectiveUserId);
      }
      if (profile?.active_organization_id) {
        query = query.eq("organization_id", profile.active_organization_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useIncomeRecords() {
  const { effectiveUserId } = useImpersonation();
  return useQuery({
    queryKey: ["income", effectiveUserId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = effectiveUserId || user?.id;
      if (!uid) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("active_organization_id")
        .eq("user_id", uid)
        .maybeSingle();

      let query = supabase
        .from("income_records")
        .select("*")
        .order("invoice_date", { ascending: false });
      if (effectiveUserId) {
        query = query.eq("user_id", effectiveUserId);
      }
      if (profile?.active_organization_id) {
        query = query.eq("organization_id", profile.active_organization_id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
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

      // Trigger AI extraction
      const { data: extractResult, error: fnError } = await supabase.functions.invoke("extract-document", {
        body: { documentId: doc.id },
      });

      if (fnError) {
        console.error("Extraction error:", fnError);
        toast.error(`Extraction failed for ${file.name}.`);
        return doc;
      }

      // Fetch updated document after extraction
      const { data: updatedDoc, error: fetchErr } = await supabase
        .from("documents")
        .select("*")
        .eq("id", doc.id)
        .single();

      if (fetchErr || !updatedDoc) return doc;

      // Auto-approve and create income record
      await supabase
        .from("documents")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("id", doc.id);

      const { error: incomeErr } = await supabase.from("income_records").insert({
        user_id: user.id,
        organization_id: profile?.active_organization_id || null,
        document_id: doc.id,
        customer_name: updatedDoc.customer_name || updatedDoc.supplier_name || "Unknown",
        invoice_number: updatedDoc.invoice_number,
        invoice_date: updatedDoc.invoice_date || new Date().toISOString().split("T")[0],
        due_date: updatedDoc.due_date,
        currency: updatedDoc.currency || "EUR",
        net_amount: updatedDoc.net_amount || 0,
        vat_amount: updatedDoc.vat_amount || 0,
        total_amount: updatedDoc.total_amount || 0,
        vat_number: updatedDoc.vat_number,
        category: updatedDoc.category,
      });

      if (incomeErr) {
        console.error("Income record error:", incomeErr);
        toast.error("Failed to create income record");
      }

      return updatedDoc;
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
  // Mileage extras (stored in invoice_number as metadata)
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

      const { data, error } = await supabase.from("expense_records").insert({
        user_id: user.id,
        organization_id: profile?.active_organization_id || null,
        document_id: null,
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
      const { error } = await supabase
        .from("expense_records")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
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
      const { error } = await supabase
        .from("income_records")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
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
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from("expense_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
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
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, any> }) => {
      const { data, error } = await supabase
        .from("income_records")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
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

      for (const doc of docs) {
        if (doc.status === "approved" || doc.status === "exported") continue;

        await supabase
          .from("documents")
          .update({ status: "approved", updated_at: new Date().toISOString() })
          .eq("id", doc.id);

        if (doc.document_type === "sales_invoice") {
          await supabase.from("income_records").insert({
            user_id: user.id,
            organization_id: profile?.active_organization_id || null,
            document_id: doc.id,
            customer_name: doc.customer_name || doc.supplier_name || "Unknown",
            invoice_number: doc.invoice_number,
            invoice_date: doc.invoice_date || new Date().toISOString().split("T")[0],
            due_date: doc.due_date,
            currency: doc.currency || "EUR",
            net_amount: doc.net_amount || 0,
            vat_amount: doc.vat_amount || 0,
            total_amount: doc.total_amount || 0,
            vat_number: doc.vat_number,
            category: doc.category,
          });
        } else {
          await supabase.from("expense_records").insert({
            user_id: user.id,
            organization_id: profile?.active_organization_id || null,
            document_id: doc.id,
            supplier_name: doc.supplier_name || doc.customer_name || "Unknown",
            invoice_number: doc.invoice_number,
            invoice_date: doc.invoice_date || new Date().toISOString().split("T")[0],
            due_date: doc.due_date,
            currency: doc.currency || "EUR",
            net_amount: doc.net_amount || 0,
            vat_amount: doc.vat_amount || 0,
            total_amount: doc.total_amount || 0,
            vat_number: doc.vat_number,
            category: doc.category,
          });
        }
      }
    },
    onSuccess: (_, docs) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
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
