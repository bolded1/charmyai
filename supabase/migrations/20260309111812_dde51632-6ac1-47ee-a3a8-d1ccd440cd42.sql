
-- Promo codes table
CREATE TABLE public.promo_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  internal_name TEXT,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  applies_to_plans TEXT[] DEFAULT '{"pro"}',
  applies_to_billing TEXT DEFAULT 'both',
  applies_to_first_only BOOLEAN DEFAULT false,
  recurring_cycles INTEGER,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  max_redemptions INTEGER,
  max_redemptions_per_org INTEGER DEFAULT 1,
  current_redemptions INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  requires_card BOOLEAN DEFAULT true,
  stacks_with_trial BOOLEAN DEFAULT true,
  extra_trial_days INTEGER DEFAULT 0,
  free_duration_months INTEGER,
  stripe_coupon_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Promo code redemptions table
CREATE TABLE public.promo_code_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  subscription_id TEXT,
  discount_snapshot JSONB,
  redeemed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active'
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_code_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS: Platform admins can manage promo codes
CREATE POLICY "Platform admins can manage promo codes"
  ON public.promo_codes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- RLS: Anyone can read active promo codes (for validation)
CREATE POLICY "Anyone can read active promo codes"
  ON public.promo_codes FOR SELECT TO authenticated
  USING (active = true);

-- RLS: Platform admins can manage redemptions
CREATE POLICY "Platform admins can manage redemptions"
  ON public.promo_code_redemptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

-- RLS: Users can view own redemptions
CREATE POLICY "Users can view own redemptions"
  ON public.promo_code_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- RLS: Users can insert own redemptions
CREATE POLICY "Users can insert own redemptions"
  ON public.promo_code_redemptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index for fast code lookups
CREATE INDEX idx_promo_codes_code ON public.promo_codes(code);
CREATE INDEX idx_promo_code_redemptions_user ON public.promo_code_redemptions(user_id);
CREATE INDEX idx_promo_code_redemptions_code ON public.promo_code_redemptions(promo_code_id);
