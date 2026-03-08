
-- Add duplicate tracking column to documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS potential_duplicate_of uuid REFERENCES public.documents(id) ON DELETE SET NULL;

-- Create a function to find potential duplicates for a document
CREATE OR REPLACE FUNCTION public.find_duplicate_document(
  _user_id uuid,
  _document_id uuid,
  _supplier_name text,
  _invoice_number text,
  _invoice_date date,
  _total_amount numeric
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _duplicate_id uuid;
BEGIN
  -- Priority 1: Exact invoice number match from same supplier
  IF _invoice_number IS NOT NULL AND _supplier_name IS NOT NULL THEN
    SELECT id INTO _duplicate_id
    FROM public.documents
    WHERE user_id = _user_id
      AND id != _document_id
      AND LOWER(TRIM(invoice_number)) = LOWER(TRIM(_invoice_number))
      AND LOWER(TRIM(supplier_name)) = LOWER(TRIM(_supplier_name))
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF _duplicate_id IS NOT NULL THEN
      RETURN _duplicate_id;
    END IF;
  END IF;

  -- Priority 2: Same supplier + same total + same date
  IF _supplier_name IS NOT NULL AND _total_amount IS NOT NULL AND _total_amount > 0 AND _invoice_date IS NOT NULL THEN
    SELECT id INTO _duplicate_id
    FROM public.documents
    WHERE user_id = _user_id
      AND id != _document_id
      AND LOWER(TRIM(supplier_name)) = LOWER(TRIM(_supplier_name))
      AND total_amount = _total_amount
      AND invoice_date = _invoice_date
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF _duplicate_id IS NOT NULL THEN
      RETURN _duplicate_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;
