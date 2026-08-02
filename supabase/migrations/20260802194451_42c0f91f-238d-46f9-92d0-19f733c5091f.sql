
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin','client');
CREATE TYPE public.declaration_status AS ENUM ('Submitted','Paid','Cleared','Exited','Cancelled','National Bank Cleared');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'client') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Declarations
CREATE TABLE public.import_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  importer_name text NOT NULL,
  importer_tin text NOT NULL UNIQUE,
  contact_phone text NOT NULL,
  contact_email text NOT NULL,
  commodity text NOT NULL,
  hs_code text,
  declaration_number text NOT NULL UNIQUE,
  bill_of_lading_number text,
  health_ministry_app_no text,
  trade_ministry_app_no text,
  declaration_status public.declaration_status NOT NULL DEFAULT 'Submitted',
  national_bank_cleared_date date,
  date_cleared_customs date,
  date_exited_port date,
  date_submitted date NOT NULL DEFAULT current_date,
  last_updated timestamptz NOT NULL DEFAULT now(),
  assigned_agent text,
  remarks text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_decl_email ON public.import_declarations (lower(contact_email));
CREATE INDEX idx_decl_status ON public.import_declarations (declaration_status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_declarations TO authenticated;
GRANT ALL ON public.import_declarations TO service_role;
ALTER TABLE public.import_declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access declarations" ON public.import_declarations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clients read own declarations" ON public.import_declarations FOR SELECT TO authenticated
  USING (lower(contact_email) = lower(coalesce(auth.jwt()->>'email','')));

CREATE OR REPLACE FUNCTION public.validate_declaration()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.declaration_status = 'National Bank Cleared' AND NEW.national_bank_cleared_date IS NULL THEN
    RAISE EXCEPTION 'National Bank Cleared date is required when status is National Bank Cleared';
  END IF;
  IF NEW.declaration_number !~ '^[0-9]{4}-[0-9]{6}$' THEN
    RAISE EXCEPTION 'Declaration number must use the format YYYY-NNNNNN';
  END IF;
  NEW.last_updated = now();
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_validate_declaration BEFORE INSERT OR UPDATE ON public.import_declarations
  FOR EACH ROW EXECUTE FUNCTION public.validate_declaration();

-- Audit log
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id uuid,
  declaration_number text,
  action text NOT NULL,
  changed_by uuid,
  changed_by_email text,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read audit" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Notifications queue
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id uuid,
  declaration_number text,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read notifications" ON public.notifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.log_declaration_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_email text;
BEGIN
  actor_email := coalesce(auth.jwt()->>'email','system');
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (declaration_id, declaration_number, action, changed_by, changed_by_email, new_values)
    VALUES (NEW.id, NEW.declaration_number, 'created', auth.uid(), actor_email, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log (declaration_id, declaration_number, action, changed_by, changed_by_email, old_values, new_values)
    VALUES (NEW.id, NEW.declaration_number, 'updated', auth.uid(), actor_email, to_jsonb(OLD), to_jsonb(NEW));
    IF NEW.declaration_status IS DISTINCT FROM OLD.declaration_status
       AND NEW.declaration_status IN ('Paid','National Bank Cleared','Cleared','Exited') THEN
      INSERT INTO public.notifications (declaration_id, declaration_number, recipient_email, subject, body)
      VALUES (NEW.id, NEW.declaration_number, NEW.contact_email,
        'Declaration ' || NEW.declaration_number || ' is now ' || NEW.declaration_status,
        'Dear ' || NEW.importer_name || ', the status of declaration ' || NEW.declaration_number ||
        ' (' || NEW.commodity || ') has been updated to ' || NEW.declaration_status || '.');
    END IF;
    RETURN NEW;
  ELSE
    INSERT INTO public.audit_log (declaration_id, declaration_number, action, changed_by, changed_by_email, old_values)
    VALUES (OLD.id, OLD.declaration_number, 'deleted', auth.uid(), actor_email, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END; $$;
CREATE TRIGGER trg_audit_declarations AFTER INSERT OR UPDATE OR DELETE ON public.import_declarations
  FOR EACH ROW EXECUTE FUNCTION public.log_declaration_change();
