-- Permissões: apenas owner da banda pode criar/editar/excluir shows da banda.
-- Overrides pessoais: membros podem ter sua própria versão do show na agenda pessoal.

-- Função: usuário é owner da banda (apenas owner_id da tabela bands)
CREATE OR REPLACE FUNCTION public.is_band_owner(band_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.bands
    WHERE id = band_uuid AND owner_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restringir INSERT/UPDATE/DELETE de gigs da banda apenas ao owner
DROP POLICY IF EXISTS "Users can create personal gigs or gigs for their bands" ON public.gigs;
CREATE POLICY "Users can create personal gigs; only band owner can create band gigs"
  ON public.gigs FOR INSERT
  WITH CHECK (
    (band_id IS NULL AND user_id = auth.uid())
    OR (band_id IS NOT NULL AND public.is_band_owner(band_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Users can update their own gigs or gigs from their bands" ON public.gigs;
CREATE POLICY "Users can update own personal gigs; only band owner can update band gigs"
  ON public.gigs FOR UPDATE
  USING (
    (band_id IS NULL AND user_id = auth.uid())
    OR (band_id IS NOT NULL AND public.is_band_owner(band_id, auth.uid()))
  );

DROP POLICY IF EXISTS "Users can delete their own gigs or gigs from their bands" ON public.gigs;
CREATE POLICY "Users can delete own personal gigs; only band owner can delete band gigs"
  ON public.gigs FOR DELETE
  USING (
    (band_id IS NULL AND user_id = auth.uid())
    OR (band_id IS NOT NULL AND public.is_band_owner(band_id, auth.uid()))
  );

-- Tabela: overrides pessoais para shows da banda (agenda pessoal do membro)
CREATE TABLE IF NOT EXISTS public.gig_personal_overrides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES public.gigs(id) ON DELETE CASCADE,
  title TEXT,
  value DECIMAL(10, 2),
  status TEXT CHECK (status IS NULL OR status IN ('PENDING', 'PAID')),
  notes TEXT,
  hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, gig_id)
);

CREATE INDEX IF NOT EXISTS idx_gig_personal_overrides_user_id ON public.gig_personal_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_gig_personal_overrides_gig_id ON public.gig_personal_overrides(gig_id);

ALTER TABLE public.gig_personal_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own gig personal overrides"
  ON public.gig_personal_overrides FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own gig personal overrides"
  ON public.gig_personal_overrides FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own gig personal overrides"
  ON public.gig_personal_overrides FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own gig personal overrides"
  ON public.gig_personal_overrides FOR DELETE
  USING (user_id = auth.uid());

-- Trigger updated_at para gig_personal_overrides
CREATE TRIGGER update_gig_personal_overrides_updated_at
  BEFORE UPDATE ON public.gig_personal_overrides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
