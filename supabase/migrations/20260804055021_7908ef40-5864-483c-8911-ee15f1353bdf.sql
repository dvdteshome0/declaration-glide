CREATE TABLE public.declaration_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id uuid NOT NULL REFERENCES public.import_declarations(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 1,
  description text NOT NULL,
  hs_code text,
  quantity numeric,
  unit text,
  unit_value numeric,
  currency text NOT NULL DEFAULT 'USD',
  country_of_origin text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_declaration_items_declaration ON public.declaration_items(declaration_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.declaration_items TO authenticated;
GRANT ALL ON public.declaration_items TO service_role;

ALTER TABLE public.declaration_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access declaration items"
ON public.declaration_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients read own declaration items"
ON public.declaration_items
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.import_declarations d
  WHERE d.id = declaration_items.declaration_id
    AND lower(d.contact_email) = lower(COALESCE((auth.jwt() ->> 'email'), ''))
));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_declaration_items_updated_at
BEFORE UPDATE ON public.declaration_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.declaration_items (declaration_id, position, description, hs_code)
SELECT id, 1, commodity, hs_code FROM public.import_declarations;