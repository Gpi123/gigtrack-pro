-- Fix para permitir que usuários autenticados vejam e aceitem convites pelo token
-- Isso é necessário porque agora os convites podem não ter email específico (email vazio)

-- Remover políticas existentes
DROP POLICY IF EXISTS "band_invites_select_final" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_update_final" ON public.band_invites;

-- Criar nova política de SELECT que permite ver convites pelo token
-- IMPORTANTE: Qualquer usuário autenticado pode ver convites com email vazio (convites abertos)
CREATE POLICY "band_invites_select_final"
  ON public.band_invites FOR SELECT
  USING (
    -- É owner da banda
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    -- OU é member da banda
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid())
    -- OU criou o convite
    OR invited_by = auth.uid()
    -- OU o email corresponde (usando função) - permite ver convites específicos para o email do usuário
    OR (email IS NOT NULL AND email != '' AND email = public.get_current_user_email())
    -- OU o email está vazio/NULL (convite aberto) - qualquer usuário autenticado pode ver
    OR (email IS NULL OR email = '')
  );

-- Criar nova política de UPDATE que permite aceitar convites
-- Qualquer usuário autenticado pode atualizar convites com email vazio para aceitar
CREATE POLICY "band_invites_update_final"
  ON public.band_invites FOR UPDATE
  USING (
    -- É owner da banda
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    -- OU é member/admin da banda
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    -- OU criou o convite
    OR invited_by = auth.uid()
    -- OU o email corresponde - permite aceitar convites específicos
    OR (email IS NOT NULL AND email != '' AND email = public.get_current_user_email())
    -- OU o email está vazio/NULL (convite aberto) - qualquer usuário autenticado pode aceitar
    OR (email IS NULL OR email = '')
  );
