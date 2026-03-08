
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL,
  feedback_type text NOT NULL DEFAULT 'nps',
  comment text,
  page text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own feedback"
  ON public.user_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own feedback"
  ON public.user_feedback FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Platform admins can view all feedback"
  ON public.user_feedback FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));
