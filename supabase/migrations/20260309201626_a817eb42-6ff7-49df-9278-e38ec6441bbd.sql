
-- Add workspace-scoped RLS policies for documents (organization_id based)
-- Users with workspace access can view documents in their workspaces
CREATE POLICY "Users can view workspace documents"
ON public.documents FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert workspace documents"
ON public.documents FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (organization_id IS NULL OR has_workspace_access(auth.uid(), organization_id))
);

-- Workspace-scoped policies for expense_records
CREATE POLICY "Users can view workspace expenses"
ON public.expense_records FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert workspace expenses"
ON public.expense_records FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (organization_id IS NULL OR has_workspace_access(auth.uid(), organization_id))
);

CREATE POLICY "Users can update workspace expenses"
ON public.expense_records FOR UPDATE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can delete workspace expenses"
ON public.expense_records FOR DELETE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

-- Workspace-scoped policies for income_records
CREATE POLICY "Users can view workspace income"
ON public.income_records FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert workspace income"
ON public.income_records FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (organization_id IS NULL OR has_workspace_access(auth.uid(), organization_id))
);

CREATE POLICY "Users can update workspace income"
ON public.income_records FOR UPDATE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can delete workspace income"
ON public.income_records FOR DELETE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

-- Workspace-scoped policies for expense_categories
CREATE POLICY "Users can view workspace categories"
ON public.expense_categories FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert workspace categories"
ON public.expense_categories FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (organization_id IS NULL OR has_workspace_access(auth.uid(), organization_id))
);

CREATE POLICY "Users can update workspace categories"
ON public.expense_categories FOR UPDATE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can delete workspace categories"
ON public.expense_categories FOR DELETE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

-- Workspace-scoped policies for auto_category_rules
CREATE POLICY "Users can view workspace rules"
ON public.auto_category_rules FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert workspace rules"
ON public.auto_category_rules FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (organization_id IS NULL OR has_workspace_access(auth.uid(), organization_id))
);

CREATE POLICY "Users can update workspace rules"
ON public.auto_category_rules FOR UPDATE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can delete workspace rules"
ON public.auto_category_rules FOR DELETE
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

-- Workspace-scoped policies for export_history
CREATE POLICY "Users can view workspace exports"
ON public.export_history FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND has_workspace_access(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert workspace exports"
ON public.export_history FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (organization_id IS NULL OR has_workspace_access(auth.uid(), organization_id))
);
