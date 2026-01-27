-- Adicionar campo para rastrear se usuário completou onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_completed_onboarding BOOLEAN DEFAULT FALSE;

-- Criar índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding ON public.profiles(has_completed_onboarding);
