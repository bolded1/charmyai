
ALTER TABLE public.broadcast_history
  ADD COLUMN scheduled_at timestamp with time zone,
  ADD COLUMN status text NOT NULL DEFAULT 'sent';
