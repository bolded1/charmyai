-- Add colour and monthly budget fields to expense_categories
ALTER TABLE expense_categories
  ADD COLUMN IF NOT EXISTS color TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS monthly_budget NUMERIC(12, 2) DEFAULT NULL;
