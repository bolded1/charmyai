
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  -- Auto-create organization so import email is ready immediately
  INSERT INTO public.organizations (owner_user_id, name)
  VALUES (NEW.id, 'My Organization');

  RETURN NEW;
END;
$function$;
