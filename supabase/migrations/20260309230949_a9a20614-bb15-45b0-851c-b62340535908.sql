
-- Create a function to generate short alphanumeric tokens
CREATE OR REPLACE FUNCTION generate_short_token(length int DEFAULT 6)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  chars text := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Update existing organizations to use 6-char tokens
UPDATE public.organizations
SET import_email_token = generate_short_token(6);

-- Change the default for new organizations
ALTER TABLE public.organizations
ALTER COLUMN import_email_token SET DEFAULT generate_short_token(6);
