-- 1. Harden has_role: signed-in users may only ask about themselves
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN auth.uid() IS NOT NULL AND _user_id IS DISTINCT FROM auth.uid() THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- 2. Explicit, scoped INSERT policy for import_declarations
CREATE POLICY "Clients insert own declarations"
ON public.import_declarations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND lower(contact_email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
);

-- 3. Recipients can read their own notifications
CREATE POLICY "Recipients read own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (lower(recipient_email) = lower(COALESCE((auth.jwt() ->> 'email'), '')));