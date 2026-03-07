-- Update RLS policies on demo_settings
DROP POLICY IF EXISTS "Admins can manage demo settings" ON public.demo_settings;
CREATE POLICY "Platform admins can manage demo settings" ON public.demo_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Update RLS policies on demo_uploads
DROP POLICY IF EXISTS "Admins can manage demo uploads" ON public.demo_uploads;
CREATE POLICY "Platform admins can manage demo uploads" ON public.demo_uploads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Update RLS policies on user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Platform admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'platform_admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Platform admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Update RLS policies on profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Platform admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Platform admins can view all organizations
CREATE POLICY "Platform admins can view all organizations" ON public.organizations
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Platform admins can view all documents
CREATE POLICY "Platform admins can view all documents" ON public.documents
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Platform admins can view all expense records
CREATE POLICY "Platform admins can view all expenses" ON public.expense_records
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Platform admins can view all income records
CREATE POLICY "Platform admins can view all income" ON public.income_records
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Platform admins can view all email imports
CREATE POLICY "Platform admins can view all email imports" ON public.email_imports
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Platform admins can view all export history
CREATE POLICY "Platform admins can view all exports" ON public.export_history
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));

-- Platform admins can view all notifications (for support)
CREATE POLICY "Platform admins can view all notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'::app_role));
