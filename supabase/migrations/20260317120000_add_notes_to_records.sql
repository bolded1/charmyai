-- Add notes column to expense_records and income_records
ALTER TABLE expense_records ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE income_records ADD COLUMN IF NOT EXISTS notes text;
