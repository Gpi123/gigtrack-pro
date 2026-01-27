-- Permitir que membros de uma banda vejam os perfis uns dos outros
-- Isso é necessário para exibir nomes e fotos dos membros na lista

-- Remover política antiga que só permite ver próprio perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Criar nova política que permite:
-- 1. Ver próprio perfil
-- 2. Ver perfis de membros da mesma banda (usando função helper)
CREATE POLICY "Users can view their own profile or profiles of band members"
  ON public.profiles FOR SELECT
  USING (
    -- Próprio perfil
    id = auth.uid()
    -- OU compartilha uma banda com este perfil (owner ou membro)
    OR EXISTS (
      SELECT 1 FROM (
        -- Caso 1: Ambos são membros da mesma banda
        SELECT DISTINCT bm1.band_id
        FROM public.band_members bm1
        INNER JOIN public.band_members bm2 ON bm1.band_id = bm2.band_id
        WHERE bm1.user_id = auth.uid() AND bm2.user_id = profiles.id
        
        UNION
        
        -- Caso 2: Usuário atual é owner, perfil é membro
        SELECT b.id
        FROM public.bands b
        INNER JOIN public.band_members bm ON b.id = bm.band_id
        WHERE b.owner_id = auth.uid() AND bm.user_id = profiles.id
        
        UNION
        
        -- Caso 3: Usuário atual é membro, perfil é owner
        SELECT bm.band_id
        FROM public.band_members bm
        INNER JOIN public.bands b ON bm.band_id = b.id
        WHERE bm.user_id = auth.uid() AND b.owner_id = profiles.id
      ) shared_bands
    )
  );
