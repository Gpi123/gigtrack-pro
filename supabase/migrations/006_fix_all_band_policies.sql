-- Fix completo para todas as políticas de bandas
-- Execute esta migração para corrigir todos os erros 403 e 400

-- ============================================
-- FIX 1: Política de SELECT para band_invites
-- ============================================
DROP POLICY IF EXISTS "Users can view invites for their bands" ON public.band_invites;

CREATE POLICY "Users can view invites for their bands"
  ON public.band_invites FOR SELECT
  USING (
    public.is_band_admin(band_id, auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );

-- ============================================
-- FIX 2: Política de INSERT para band_invites
-- ============================================
DROP POLICY IF EXISTS "Owners and admins can create invites" ON public.band_invites;

CREATE POLICY "Owners and admins can create invites"
  ON public.band_invites FOR INSERT
  WITH CHECK (
    public.is_band_admin(band_id, auth.uid())
    AND invited_by = auth.uid()
  );

-- ============================================
-- FIX 3: Política de UPDATE para band_invites
-- ============================================
DROP POLICY IF EXISTS "Owners and admins can update invites" ON public.band_invites;

CREATE POLICY "Owners and admins can update invites"
  ON public.band_invites FOR UPDATE
  USING (
    public.is_band_admin(band_id, auth.uid())
    OR invited_by = auth.uid()
  );

-- ============================================
-- FIX 4: Verificar se as funções existem
-- ============================================
-- Garantir que as funções de verificação existam
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
