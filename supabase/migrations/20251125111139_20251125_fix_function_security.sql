-- Fix "Function Search Path Mutable" security warnings
-- This ensures functions always execute with a fixed search_path, preventing
-- potential privilege escalation attacks where malicious objects in other schemas
-- could be executed.

ALTER FUNCTION public.handle_vote(uuid, uuid, text) SET search_path = public;
ALTER FUNCTION public.handle_updated_at() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.get_user_voting_history(uuid) SET search_path = public;
ALTER FUNCTION public.get_active_reports() SET search_path = public;
ALTER FUNCTION public.update_user_report(uuid, uuid, text, text) SET search_path = public;
ALTER FUNCTION public.get_user_reports(uuid) SET search_path = public;
ALTER FUNCTION public.delete_user_report(uuid, uuid) SET search_path = public;
