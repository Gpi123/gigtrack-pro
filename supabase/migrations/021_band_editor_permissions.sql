-- Editores (role admin) têm as mesmas permissões do owner para ver/editar shows da banda.
-- Apenas owner pode excluir a banda e transferir propriedade.

-- Função: usuário é owner OU editor (admin) da banda
CREATE OR REPLACE FUNCTION public.is_band_owner_or_editor(band_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Owner da banda
  IF EXISTS (SELECT 1 FROM public.bands WHERE id = band_uuid AND owner_id = user_uuid) THEN
    RETURN TRUE;
  END IF;
  -- Membro com role admin (editor)
  IF EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_id = band_uuid AND user_id = user_uuid AND role = 'admin'
  ) THEN
    RETURN TRUE;
  END IF;
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar políticas de gigs para usar owner ou editor
DROP POLICY IF EXISTS "Users can create personal gigs; only band owner can create band gigs" ON public.gigs;
CREATE POLICY "Users can create personal gigs; owner or editor can create band gigs"
  ON public.gigs FOR INSERT
  WITH CHECK (
    (band_id IS NULL AND user_id = auth.uid())
    OR (band_id IS NOT NULL AND public.is_band_owner_or_editor(band_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update own personal gigs; only band owner can update band gigs" ON public.gigs;
CREATE POLICY "Users can update own personal gigs; owner or editor can update band gigs"
  ON public.gigs FOR UPDATE
  USING (
    (band_id IS NULL AND user_id = auth.uid())
    OR (band_id IS NOT NULL AND public.is_band_owner_or_editor(band_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete own personal gigs; only band owner can delete band gigs" ON public.gigs;
CREATE POLICY "Users can delete own personal gigs; owner or editor can delete band gigs"
  ON public.gigs FOR DELETE
  USING (
    (band_id IS NULL AND user_id = auth.uid())
    OR (band_id IS NOT NULL AND public.is_band_owner_or_editor(band_id, auth.uid()))
  );
