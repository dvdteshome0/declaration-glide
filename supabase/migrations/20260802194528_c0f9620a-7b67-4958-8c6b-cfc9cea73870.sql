
CREATE POLICY "Admins manage attachments" ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'declaration-attachments' AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id = 'declaration-attachments' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "Clients download own attachments" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'declaration-attachments'
  AND EXISTS (
    SELECT 1 FROM public.import_declarations d
    WHERE d.id::text = (storage.foldername(name))[1]
      AND lower(d.contact_email) = lower(coalesce(auth.jwt()->>'email',''))
  )
);
