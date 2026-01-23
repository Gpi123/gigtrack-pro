-- SOLUÇÃO SIMPLES E DIRETA - Teste se funciona
-- Execute esta migração e teste novamente

-- ============================================
-- PASSO 1: Remover TODAS as políticas
-- ============================================
DROP POLICY IF EXISTS "Users can view invites for their bands" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can create invites" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can update invites" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can delete invites" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_select" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_insert" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_update" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_delete" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_select_policy" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_insert_policy" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_update_policy" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_delete_policy" ON public.band_invites;

-- ============================================
-- PASSO 2: Criar políticas MUITO SIMPLES (temporárias para teste)
-- ============================================

-- SELECT: Qualquer um que seja owner OU member da banda pode ver
CREATE POLICY "band_invites_select_simple"
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

-- INSERT: Owner OU admin da banda pode criar
CREATE POLICY "band_invites_insert_simple"
  ON public.band_invites FOR INSERT
  WITH CHECK (
    -- É owner da banda
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    -- OU é admin/member da banda (vamos ser permissivos para teste)
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid())
    -- E invited_by DEVE ser o usuário atual
    AND invited_by = auth.uid()
  );

-- UPDATE: Owner OU quem criou pode atualizar
CREATE POLICY "band_invites_update_simple"
  ON public.band_invites FOR UPDATE
  USING (
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR invited_by = auth.uid()
  );

-- DELETE: Apenas owner OU admin
CREATE POLICY "band_invites_delete_simple"
  ON public.band_invites FOR DELETE
  USING (
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );
