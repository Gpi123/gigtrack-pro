-- Fix para política de band_invites - permitir que criadores vejam seus convites
-- Execute esta migração para corrigir o erro 403 ao convidar usuários

-- Remover política antiga
DROP POLICY IF EXISTS "Users can view invites for their bands" ON public.band_invites;

-- Nova política que permite:
-- 1. Admins da banda veem todos os convites
-- 2. Usuários veem convites enviados para seu email
-- 3. Usuários veem convites que eles criaram (invited_by)
CREATE POLICY "Users can view invites for their bands"
  ON public.band_invites FOR SELECT
  USING (
    public.is_band_admin(band_id, auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by = auth.uid()
  );
