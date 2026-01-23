-- ============================================
-- SOLUÇÃO FINAL - Execute esta migração
-- ============================================

-- Remover TODAS as políticas existentes
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'band_invites') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.band_invites';
    END LOOP;
END $$;

-- Criar políticas usando IN (mais simples e direto)
CREATE POLICY "band_invites_select_v2"
  ON public.band_invites FOR SELECT
  USING (
    -- É owner da banda
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    -- OU é member da banda
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid())
    -- OU criou o convite
    OR invited_by = auth.uid()
    -- OU o email corresponde
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "band_invites_insert_v2"
  ON public.band_invites FOR INSERT
  WITH CHECK (
    -- É owner OU member da banda
    (
      band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
      OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid())
    )
    -- E invited_by DEVE ser o usuário atual
    AND invited_by = auth.uid()
  );

CREATE POLICY "band_invites_update_v2"
  ON public.band_invites FOR UPDATE
  USING (
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR invited_by = auth.uid()
  );

CREATE POLICY "band_invites_delete_v2"
  ON public.band_invites FOR DELETE
  USING (
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );
