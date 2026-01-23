-- Migration para suportar funcionalidades premium via Stripe
-- Execute esta migração quando for implementar sistema de assinaturas

-- Adicionar campos de subscription na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'trial', 'expired')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP WITH TIME ZONE;

-- Índices para queries rápidas de subscription
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON public.profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires ON public.profiles(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;

-- Função para verificar se usuário tem acesso premium
CREATE OR REPLACE FUNCTION public.has_premium_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid
    AND subscription_status = 'premium'
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário está em trial
CREATE OR REPLACE FUNCTION public.is_trial_user(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_uuid
    AND subscription_status = 'trial'
    AND (subscription_expires_at IS NULL OR subscription_expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário tem acesso (premium ou trial)
CREATE OR REPLACE FUNCTION public.has_paid_access(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.has_premium_access(user_uuid) OR public.is_trial_user(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Exemplo: Se você criar uma tabela para features premium no futuro
-- CREATE TABLE IF NOT EXISTS public.premium_features (
--   id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
--   feature_name TEXT NOT NULL,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
-- );

-- ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Premium users can access premium features"
--   ON public.premium_features
--   FOR SELECT
--   USING (
--     auth.uid() = user_id 
--     AND public.has_premium_access(auth.uid())
--   );

-- CREATE POLICY "Premium users can create premium features"
--   ON public.premium_features
--   FOR INSERT
--   WITH CHECK (
--     auth.uid() = user_id 
--     AND public.has_premium_access(auth.uid())
--   );
