
CREATE OR REPLACE FUNCTION public.find_duplicate_document(_user_id uuid, _document_id uuid, _supplier_name text, _invoice_number text, _invoice_date date, _total_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _duplicate_id uuid;
BEGIN
  -- Only flag as duplicate if same invoice number exists
  IF _invoice_number IS NOT NULL AND TRIM(_invoice_number) != '' THEN
    SELECT id INTO _duplicate_id
    FROM public.documents
    WHERE user_id = _user_id
      AND id != _document_id
      AND LOWER(TRIM(invoice_number)) = LOWER(TRIM(_invoice_number))
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF _duplicate_id IS NOT NULL THEN
      RETURN _duplicate_id;
    END IF;
  END IF;

  RETURN NULL;
END;
$function$;
