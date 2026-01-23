-- Fix para erro "permission denied for table users"
-- O problema é que não podemos acessar auth.users diretamente nas políticas RLS

-- Remover TODAS as políticas que referenciam auth.users
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'band_invites') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.band_invites';
    END LOOP;
END $$;

-- Criar função para obter email do usuário atual (sem acessar auth.users diretamente)
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar políticas SEM referência direta a auth.users
CREATE POLICY "band_invites_select_final"
  ON public.band_invites FOR SELECT
  USING (
    -- É owner da banda
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    -- OU é member da banda
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid())
    -- OU criou o convite
    OR invited_by = auth.uid()
    -- OU o email corresponde (usando função)
    OR email = public.get_current_user_email()
  );

CREATE POLICY "band_invites_insert_final"
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

CREATE POLICY "band_invites_update_final"
  ON public.band_invites FOR UPDATE
  USING (
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
    OR invited_by = auth.uid()
  );

CREATE POLICY "band_invites_delete_final"
  ON public.band_invites FOR DELETE
  USING (
    band_id IN (SELECT id FROM public.bands WHERE owner_id = auth.uid())
    OR band_id IN (SELECT band_id FROM public.band_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
  );
