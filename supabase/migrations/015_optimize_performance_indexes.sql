-- Migration 015: Otimização de índices para melhor performance
-- Esta migration adiciona índices compostos e específicos para as queries mais comuns

-- ============================================
-- ÍNDICES PARA GIGS (Queries mais frequentes)
-- ============================================

-- Índice composto para buscar gigs de uma banda ordenados por data
-- Query: SELECT * FROM gigs WHERE band_id = X ORDER BY date
CREATE INDEX IF NOT EXISTS idx_gigs_band_id_date 
ON public.gigs(band_id, date) 
WHERE band_id IS NOT NULL;

-- Índice composto para buscar gigs pessoais do usuário ordenados por data
-- Query: SELECT * FROM gigs WHERE user_id = X AND band_id IS NULL ORDER BY date
CREATE INDEX IF NOT EXISTS idx_gigs_user_personal_date 
ON public.gigs(user_id, date) 
WHERE band_id IS NULL;

-- Índice composto para buscar gigs por banda e status (para filtros)
-- Query: SELECT * FROM gigs WHERE band_id = X AND status = 'PENDING'
CREATE INDEX IF NOT EXISTS idx_gigs_band_id_status 
ON public.gigs(band_id, status) 
WHERE band_id IS NOT NULL;

-- Índice composto para buscar gigs pessoais por status
-- Query: SELECT * FROM gigs WHERE user_id = X AND band_id IS NULL AND status = 'PENDING'
CREATE INDEX IF NOT EXISTS idx_gigs_user_personal_status 
ON public.gigs(user_id, status) 
WHERE band_id IS NULL;

-- ============================================
-- ÍNDICES PARA BAND_INVITES
-- ============================================

-- Índice composto para buscar convites por email e status (query mais comum)
-- Query: SELECT * FROM band_invites WHERE email = X AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_band_invites_email_status 
ON public.band_invites(email, status);

-- Índice composto para buscar convites de uma banda por status
-- Query: SELECT * FROM band_invites WHERE band_id = X AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_band_invites_band_status 
ON public.band_invites(band_id, status);

-- Índice para filtrar convites expirados (usado em queries de limpeza)
-- Query: SELECT * FROM band_invites WHERE expires_at > NOW() AND status = 'pending'
CREATE INDEX IF NOT EXISTS idx_band_invites_expires_status 
ON public.band_invites(expires_at, status) 
WHERE status = 'pending';

-- ============================================
-- ÍNDICES PARA BANDS
-- ============================================

-- Índice composto para buscar bandas do owner ordenadas por data de criação
-- Query: SELECT * FROM bands WHERE owner_id = X ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_bands_owner_created 
ON public.bands(owner_id, created_at DESC);

-- ============================================
-- ÍNDICES PARA BAND_MEMBERS
-- ============================================

-- Índice composto para buscar membros de uma banda ordenados por data de entrada
-- Query: SELECT * FROM band_members WHERE band_id = X ORDER BY joined_at
CREATE INDEX IF NOT EXISTS idx_band_members_band_joined 
ON public.band_members(band_id, joined_at);

-- Índice composto para verificar se usuário é membro de uma banda específica
-- Query: SELECT * FROM band_members WHERE band_id = X AND user_id = Y
-- Nota: O UNIQUE constraint já cria um índice, mas este é mais específico para a query
CREATE INDEX IF NOT EXISTS idx_band_members_band_user 
ON public.band_members(band_id, user_id);

-- ============================================
-- ANÁLISE DE PERFORMANCE
-- ============================================

-- Para verificar se os índices estão sendo usados, execute no SQL Editor:
-- EXPLAIN ANALYZE SELECT * FROM gigs WHERE band_id = 'uuid' ORDER BY date;

-- Para ver todos os índices da tabela gigs:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'gigs';

-- Para verificar o tamanho dos índices:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public' AND tablename IN ('gigs', 'bands', 'band_members', 'band_invites')
-- ORDER BY pg_relation_size(indexrelid) DESC;
