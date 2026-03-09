INSERT INTO public.profiles (user_id, email, active_organization_id)
VALUES ('c837197b-2c71-43f2-a435-138625dcb240', 'chris@devitus.com', 'd19ada97-f1ed-4c97-8015-8b3f77f4db5b')
ON CONFLICT (user_id) DO NOTHING;