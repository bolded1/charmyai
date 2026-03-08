
-- Auto-categorization rules table
CREATE TABLE public.auto_category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  match_field text NOT NULL DEFAULT 'supplier_name',
  match_type text NOT NULL DEFAULT 'contains',
  match_value text NOT NULL,
  category text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rules" ON public.auto_category_rules FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own rules" ON public.auto_category_rules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rules" ON public.auto_category_rules FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rules" ON public.auto_category_rules FOR DELETE TO authenticated USING (auth.uid() = user_id);
