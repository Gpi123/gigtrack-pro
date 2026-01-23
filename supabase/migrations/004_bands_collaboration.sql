-- Migration para sistema de bandas e colaboração
-- Permite criar bandas e convidar outros usuários para colaborar

-- Adicionar campo band_id na tabela gigs (NULL = agenda pessoal, UUID = agenda da banda)
ALTER TABLE public.gigs 
ADD COLUMN IF NOT EXISTS band_id UUID;

-- Criar tabela de bandas
CREATE TABLE IF NOT EXISTS public.bands (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Criar tabela de membros da banda
CREATE TABLE IF NOT EXISTS public.band_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  band_id UUID REFERENCES public.bands(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(band_id, user_id)
);

-- Criar tabela de convites
CREATE TABLE IF NOT EXISTS public.band_invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  band_id UUID REFERENCES public.bands(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gigs_band_id ON public.gigs(band_id) WHERE band_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bands_owner_id ON public.bands(owner_id);
CREATE INDEX IF NOT EXISTS idx_band_members_band_id ON public.band_members(band_id);
CREATE INDEX IF NOT EXISTS idx_band_members_user_id ON public.band_members(user_id);
CREATE INDEX IF NOT EXISTS idx_band_invites_band_id ON public.band_invites(band_id);
CREATE INDEX IF NOT EXISTS idx_band_invites_email ON public.band_invites(email);
CREATE INDEX IF NOT EXISTS idx_band_invites_token ON public.band_invites(token);

-- Habilitar RLS
ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_invites ENABLE ROW LEVEL SECURITY;

-- Função para verificar se usuário é membro da banda
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

-- Função para verificar se usuário é owner ou admin da banda
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

-- Policies para bands
CREATE POLICY "Users can view bands they own or are members of"
  ON public.bands FOR SELECT
  USING (
    owner_id = auth.uid() 
    OR public.is_band_member(id, auth.uid())
  );

CREATE POLICY "Users can create bands"
  ON public.bands FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners and admins can update bands"
  ON public.bands FOR UPDATE
  USING (public.is_band_admin(id, auth.uid()));

CREATE POLICY "Owners can delete bands"
  ON public.bands FOR DELETE
  USING (owner_id = auth.uid());

-- Policies para band_members
CREATE POLICY "Users can view members of their bands"
  ON public.band_members FOR SELECT
  USING (
    public.is_band_member(band_id, auth.uid())
  );

CREATE POLICY "Owners and admins can add members"
  ON public.band_members FOR INSERT
  WITH CHECK (public.is_band_admin(band_id, auth.uid()));

CREATE POLICY "Owners and admins can update members"
  ON public.band_members FOR UPDATE
  USING (public.is_band_admin(band_id, auth.uid()));

CREATE POLICY "Owners and admins can remove members"
  ON public.band_members FOR DELETE
  USING (public.is_band_admin(band_id, auth.uid()));

-- Policies para band_invites
CREATE POLICY "Users can view invites for their bands"
  ON public.band_invites FOR SELECT
  USING (
    public.is_band_admin(band_id, auth.uid())
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Owners and admins can create invites"
  ON public.band_invites FOR INSERT
  WITH CHECK (public.is_band_admin(band_id, auth.uid()));

CREATE POLICY "Owners and admins can update invites"
  ON public.band_invites FOR UPDATE
  USING (public.is_band_admin(band_id, auth.uid()));

CREATE POLICY "Owners and admins can delete invites"
  ON public.band_invites FOR DELETE
  USING (public.is_band_admin(band_id, auth.uid()));

-- Atualizar policies de gigs para suportar bandas
-- Remover policies antigas
DROP POLICY IF EXISTS "Users can view their own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can insert their own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can update their own gigs" ON public.gigs;
DROP POLICY IF EXISTS "Users can delete their own gigs" ON public.gigs;

-- Novas policies que suportam bandas
CREATE POLICY "Users can view their own gigs or gigs from their bands"
  ON public.gigs FOR SELECT
  USING (
    user_id = auth.uid() 
    OR (band_id IS NOT NULL AND public.is_band_member(band_id, auth.uid()))
  );

CREATE POLICY "Users can create personal gigs or gigs for their bands"
  ON public.gigs FOR INSERT
  WITH CHECK (
    (band_id IS NULL AND user_id = auth.uid())
    OR (band_id IS NOT NULL AND public.is_band_member(band_id, auth.uid()))
  );

CREATE POLICY "Users can update their own gigs or gigs from their bands"
  ON public.gigs FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR (band_id IS NOT NULL AND public.is_band_member(band_id, auth.uid()))
  );

CREATE POLICY "Users can delete their own gigs or gigs from their bands"
  ON public.gigs FOR DELETE
  USING (
    user_id = auth.uid() 
    OR (band_id IS NOT NULL AND public.is_band_member(band_id, auth.uid()))
  );

-- Trigger para atualizar updated_at em bands
DROP TRIGGER IF EXISTS update_bands_updated_at ON public.bands;
CREATE TRIGGER update_bands_updated_at
  BEFORE UPDATE ON public.bands
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Função para gerar token de convite
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$ LANGUAGE plpgsql;
