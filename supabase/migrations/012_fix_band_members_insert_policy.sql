-- Fix para permitir que usuários aceitem convites e se adicionem à banda
-- O problema: a política atual só permite admins adicionarem membros
-- Solução: permitir que usuários se adicionem se tiverem um convite válido

-- Remover política antiga de INSERT
DROP POLICY IF EXISTS "Owners and admins can add members" ON public.band_members;

-- Criar função para verificar se existe convite válido para o usuário na banda
CREATE OR REPLACE FUNCTION public.has_valid_invite(band_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Obter email do usuário do perfil
  SELECT email INTO user_email FROM public.profiles WHERE id = user_uuid;
  
  -- Verificar se existe convite válido
  RETURN EXISTS (
    SELECT 1 FROM public.band_invites
    WHERE band_id = band_uuid
    AND status = 'pending'
    AND expires_at > NOW()
    AND (
      -- Convite específico para o email do usuário
      (email IS NOT NULL AND email != '' AND email = COALESCE(user_email, ''))
      -- OU convite aberto (email vazio/NULL)
      OR (email IS NULL OR email = '')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Nova política de INSERT que permite:
-- 1. Admins adicionarem outros membros
-- 2. Usuários se adicionarem se tiverem convite válido
CREATE POLICY "Users can add themselves with valid invite or admins can add others"
  ON public.band_members FOR INSERT
  WITH CHECK (
    -- É admin da banda (pode adicionar qualquer um)
    public.is_band_admin(band_id, auth.uid())
    -- OU está se adicionando E tem convite válido
    OR (
      user_id = auth.uid()
      AND public.has_valid_invite(band_id, auth.uid())
    )
  );
