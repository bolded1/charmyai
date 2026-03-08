
-- Update the notification trigger to fire on new ticket_messages from admins
CREATE OR REPLACE FUNCTION public.notify_ticket_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _ticket RECORD;
BEGIN
  -- Only notify when an admin sends a message
  IF NEW.sender_role = 'admin' THEN
    SELECT user_id, subject INTO _ticket
    FROM public.support_tickets
    WHERE id = NEW.ticket_id;

    IF _ticket IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        _ticket.user_id,
        'ticket_reply',
        'New reply on your ticket',
        'Your ticket "' || _ticket.subject || '" has a new reply from support.',
        '/app/support'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Drop old trigger on support_tickets
DROP TRIGGER IF EXISTS on_ticket_reply ON public.support_tickets;

-- Create new trigger on ticket_messages
CREATE TRIGGER on_ticket_message_reply
  AFTER INSERT ON public.ticket_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ticket_reply();
