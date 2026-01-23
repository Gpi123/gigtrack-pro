-- Fix FINAL para band_invites - garantir que todas as políticas funcionem
-- Execute esta migração para resolver definitivamente os erros 403

-- ============================================
-- PASSO 1: Remover TODAS as políticas antigas
-- ============================================
DROP POLICY IF EXISTS "Users can view invites for their bands" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can create invites" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can update invites" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can delete invites" ON public.band_invites;

-- ============================================
-- PASSO 2: Garantir que as funções existam e funcionem
-- ============================================
CREATE OR REPLACE FUNCTION public.is_band_member(band_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_id = band_uuid AND user_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.bands
    WHERE id = band_uuid AND owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_band_admin(band_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.bands
    WHERE id = band_uuid AND owner_id = user_uuid
  ) OR EXISTS (
    SELECT 1 FROM public.band_members
    WHERE band_id = band_uuid 
    AND user_id = user_uuid 
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PASSO 3: Criar políticas SIMPLES e DIRETAS
-- ============================================

-- SELECT: Admins da banda OU quem criou o convite OU email corresponde
CREATE POLICY "band_invites_select_policy"
  ON public.band_invites FOR SELECT
  USING (
    -- É admin da banda
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE id = band_invites.band_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = band_invites.band_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
    -- OU criou o convite
    OR invited_by = auth.uid()
    -- OU o email corresponde ao usuário logado
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- INSERT: Apenas admins podem criar, e invited_by DEVE ser o usuário atual
CREATE POLICY "band_invites_insert_policy"
  ON public.band_invites FOR INSERT
  WITH CHECK (
    -- É admin da banda
    (
      EXISTS (
        SELECT 1 FROM public.bands
        WHERE id = band_invites.band_id AND owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.band_members
        WHERE band_id = band_invites.band_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      )
    )
    -- E invited_by DEVE ser o usuário atual
    AND invited_by = auth.uid()
  );

-- UPDATE: Admins da banda OU quem criou o convite
CREATE POLICY "band_invites_update_policy"
  ON public.band_invites FOR UPDATE
  USING (
    -- É admin da banda
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE id = band_invites.band_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = band_invites.band_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
    -- OU criou o convite
    OR invited_by = auth.uid()
  );

-- DELETE: Apenas admins da banda
CREATE POLICY "band_invites_delete_policy"
  ON public.band_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE id = band_invites.band_id AND owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = band_invites.band_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
