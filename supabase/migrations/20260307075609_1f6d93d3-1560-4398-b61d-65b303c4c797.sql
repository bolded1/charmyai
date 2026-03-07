
-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  document_type TEXT DEFAULT 'expense_invoice',
  supplier_name TEXT,
  customer_name TEXT,
  invoice_number TEXT,
  invoice_date DATE,
  due_date DATE,
  currency TEXT DEFAULT 'EUR',
  net_amount NUMERIC(12,2) DEFAULT 0,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) DEFAULT 0,
  vat_number TEXT,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  ocr_text TEXT,
  extracted_data JSONB,
  user_corrections JSONB,
  confidence_score NUMERIC(5,2),
  validation_errors JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expense records table
CREATE TABLE public.expense_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  invoice_number TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  currency TEXT NOT NULL DEFAULT 'EUR',
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_number TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create income records table
CREATE TABLE public.income_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  invoice_number TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  currency TEXT NOT NULL DEFAULT 'EUR',
  net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  vat_number TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create export history table
CREATE TABLE public.export_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  export_name TEXT NOT NULL,
  export_type TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'csv',
  row_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']);

-- RLS policies for documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for expense_records
ALTER TABLE public.expense_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own expenses" ON public.expense_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expenses" ON public.expense_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own expenses" ON public.expense_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own expenses" ON public.expense_records FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for income_records
ALTER TABLE public.income_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own income" ON public.income_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own income" ON public.income_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own income" ON public.income_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own income" ON public.income_records FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for export_history
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own exports" ON public.export_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exports" ON public.export_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Storage policies
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);
