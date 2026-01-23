# 🧪 Teste de Convites - Diagnóstico

## ⚠️ Problema Persistente
Erros 403 mesmo após aplicar as migrações.

## 🔍 Diagnóstico

Execute estes comandos no Supabase SQL Editor para verificar:

### 1. Verificar se as políticas existem:
```sql
SELECT * FROM pg_policies WHERE tablename = 'band_invites';
```

### 2. Verificar se você é owner da banda:
```sql
-- Substitua 'SEU_USER_ID' pelo seu ID de usuário
SELECT id, name, owner_id 
FROM bands 
WHERE owner_id = auth.uid();
```

### 3. Verificar se você está na tabela band_members:
```sql
SELECT * FROM band_members WHERE user_id = auth.uid();
```

### 4. Testar INSERT manualmente:
```sql
-- Substitua 'BAND_ID' pelo ID da sua banda
-- Substitua 'email@teste.com' por um email de teste
INSERT INTO band_invites (band_id, email, invited_by, token, expires_at)
VALUES (
  'BAND_ID',
  'email@teste.com',
  auth.uid(),
  'test-token-' || gen_random_uuid()::text,
  NOW() + INTERVAL '7 days'
);
```

Se o INSERT manual funcionar, o problema está no código JavaScript.
Se o INSERT manual também der erro, o problema está nas políticas RLS.

## ✅ Solução Alternativa (Temporária)

Se nada funcionar, podemos temporariamente desabilitar RLS para testar:

```sql
-- ⚠️ ATENÇÃO: Isso remove a segurança! Use apenas para teste!
ALTER TABLE public.band_invites DISABLE ROW LEVEL SECURITY;
```

Depois de testar, reabilite:
```sql
ALTER TABLE public.band_invites ENABLE ROW LEVEL SECURITY;
```

## 📋 Próximos Passos

1. Execute a migração `008_simple_band_invites_fix.sql`
2. Execute os comandos de diagnóstico acima
3. Me informe os resultados para eu ajustar a solução
