
CREATE TABLE public.page_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text NOT NULL UNIQUE,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;

-- Anyone can read page content (public marketing pages)
CREATE POLICY "Anyone can read page content"
  ON public.page_content FOR SELECT
  USING (true);

-- Only platform admins can manage page content
CREATE POLICY "Platform admins can manage page content"
  ON public.page_content FOR ALL
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));
