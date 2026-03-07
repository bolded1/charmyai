
-- Demo uploads table (isolated from main documents)
CREATE TABLE public.demo_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  ip_address TEXT,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  extracted_data JSONB,
  confidence_score NUMERIC,
  ocr_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Demo settings table (admin-configurable)
CREATE TABLE public.demo_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for demo_uploads: public insert (no auth needed), no select/update/delete from client
ALTER TABLE public.demo_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demo_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can insert demo uploads (public demo)
CREATE POLICY "Public can insert demo uploads"
  ON public.demo_uploads FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view/manage demo uploads
CREATE POLICY "Admins can manage demo uploads"
  ON public.demo_uploads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can read demo settings
CREATE POLICY "Admins can manage demo settings"
  ON public.demo_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Public can read demo settings (needed for frontend config)
CREATE POLICY "Public can read demo settings"
  ON public.demo_settings FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert default demo settings
INSERT INTO public.demo_settings (key, value) VALUES
  ('enabled', 'true'::jsonb),
  ('allowed_file_types', '["PDF","PNG","JPG","JPEG"]'::jsonb),
  ('max_file_size_mb', '10'::jsonb),
  ('retention_minutes', '60'::jsonb),
  ('max_uploads_per_day', '50'::jsonb),
  ('rate_limit_per_minute', '5'::jsonb),
  ('cta_button_text', '"Start Free Trial"'::jsonb),
  ('show_sample_document', 'true'::jsonb),
  ('sample_fallback_mode', 'false'::jsonb);

-- Create demo-uploads storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('demo-uploads', 'demo-uploads', false);

-- Allow public uploads to demo-uploads bucket
CREATE POLICY "Public can upload demo files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'demo-uploads');

-- Allow service role to delete demo files (for cleanup)
CREATE POLICY "Admins can manage demo files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'demo-uploads' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'demo-uploads' AND public.has_role(auth.uid(), 'admin'));
