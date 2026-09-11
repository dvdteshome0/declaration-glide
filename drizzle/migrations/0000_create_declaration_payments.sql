CREATE TYPE public.payment_basis AS ENUM ('Per truck', 'Per declaration', 'Other');

CREATE TABLE public.declaration_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id uuid NOT NULL REFERENCES public.import_declarations(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 1,
  amount_birr numeric NOT NULL DEFAULT 0,
  basis public.payment_basis NOT NULL DEFAULT 'Per declaration',
  other_reason text,
  collected_on date NOT NULL DEFAULT CURRENT_DATE,
  collected_by text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_declaration_payments_declaration ON public.declaration_payments(declaration_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.declaration_payments TO authenticated;
GRANT ALL ON public.declaration_payments TO service_role;

ALTER TABLE public.declaration_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access declaration payments"
ON public.declaration_payments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients read own declaration payments"
ON public.declaration_payments FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.import_declarations d
  WHERE d.id = declaration_payments.declaration_id
    AND lower(d.contact_email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
));

CREATE TRIGGER trg_declaration_payments_updated_at
BEFORE UPDATE ON public.declaration_payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();