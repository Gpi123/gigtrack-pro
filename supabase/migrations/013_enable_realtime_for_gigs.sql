-- Habilitar Realtime para a tabela gigs
-- Isso permite que as subscriptions em tempo real funcionem corretamente

-- Verificar se a publicação existe e criar se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
  END IF;
END $$;

-- Adicionar a tabela gigs à publicação (se ainda não estiver)
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.gigs;
