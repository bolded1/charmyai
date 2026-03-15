
-- Make tokens shorter (10 chars instead of 32-char hex)
ALTER TABLE public.document_requests ALTER COLUMN token SET DEFAULT generate_short_token(10);
