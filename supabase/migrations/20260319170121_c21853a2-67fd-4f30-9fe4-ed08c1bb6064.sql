ALTER TABLE public.expense_records ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
ALTER TABLE public.income_records ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;