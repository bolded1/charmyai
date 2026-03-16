-- Update organizations that still have the old blue/indigo default brand colours
-- to the new Warm Terracotta primary colour (#9B2335).
-- Only touches rows whose primary_color matches one of the previous default
-- blue values — custom colours set by organisations are left untouched.

UPDATE organizations
SET primary_color = '#9B2335'
WHERE primary_color IN (
  '#1E3A8A',   -- old DEFAULT_ACCENT_COLOR (Navy)
  '#1e3a8a',
  '#2563EB',   -- Blue
  '#2563eb',
  '#4F46E5',   -- Indigo
  '#4f46e5',
  '#6366F1',   -- Indigo-400
  '#6366f1',
  '#7C3AED',   -- Violet
  '#7c3aed',
  '#3B82F6',   -- Blue-500
  '#3b82f6',
  '#1D4ED8',   -- Blue-700
  '#1d4ed8',
  '#1E40AF',   -- Blue-800
  '#1e40af'
)
   OR primary_color IS NULL;
