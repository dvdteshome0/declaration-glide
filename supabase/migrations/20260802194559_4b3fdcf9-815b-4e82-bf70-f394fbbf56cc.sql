ALTER TABLE public.import_declarations DROP CONSTRAINT import_declarations_importer_tin_key;
CREATE INDEX idx_decl_tin ON public.import_declarations (importer_tin);