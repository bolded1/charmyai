
CREATE OR REPLACE FUNCTION public.notify_ticket_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.admin_reply IS DISTINCT FROM NEW.admin_reply AND NEW.admin_reply IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'ticket_reply',
      'Support ticket replied',
      'Your ticket "' || NEW.subject || '" has received a reply from the support team.',
      '/app/support'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_reply
  AFTER UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_reply();
