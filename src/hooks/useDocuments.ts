import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  return useQuery({
    queryKey: ["documents", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter && statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentRecord[];
    },
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: doc, error: insertError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
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

      // Create expense record for all approved documents
      const { error } = await supabase.from("expense_records").insert({
        user_id: user.id,
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
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expense_records")
        .select("*")
        .order("invoice_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useIncomeRecords() {
  return useQuery({
    queryKey: ["income"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("income_records")
        .select("*")
        .order("invoice_date", { ascending: false });
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

      const filePath = `${user.id}/${Date.now()}-${file.name}`;

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
