# 💳 Como Implementar Sistema Premium com Stripe

## 🔐 Segurança: Respostas Diretas

### ❓ "Um usuário pode copiar o CURL e acessar o banco?"

**NÃO** - Mesmo copiando o CURL:
- ✅ O token JWT expira (padrão: 1 hora)
- ✅ Só acessa dados do próprio usuário (RLS bloqueia outros)
- ✅ Não consegue acessar dados de outros usuários
- ✅ Não consegue burlar RLS policies

**Exemplo de CURL que um usuário veria:**
```bash
curl 'https://seu-projeto.supabase.co/rest/v1/gigs?select=*&user_id=eq.USER_ID' \
  -H 'apikey: ANON_KEY' \
  -H 'Authorization: Bearer JWT_TOKEN_DO_USUARIO'
```

**O que acontece se copiar?**
- Funciona apenas enquanto o token estiver válido
- Só acessa dados do usuário que gerou o token
- RLS garante que não acessa dados de outros

### ❓ "Hackers podem conseguir acesso gratuito a features premium?"

**Depende da implementação:**

#### ❌ VULNERÁVEL (NÃO FAÇA):
```javascript
// Frontend apenas - FÁCIL DE BURLAR
if (user.subscription_status === 'premium') {
  // Mostrar feature premium
}
```

#### ✅ SEGURO (FAÇA ASSIM):
```sql
-- No banco de dados - RLS policy
CREATE POLICY "Premium users only"
  ON public.premium_features
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND public.has_premium_access(auth.uid())  -- Verifica no banco!
  );
```

## 🛡️ Implementação Segura de Premium

### Passo 1: Executar Migração

Execute o arquivo `supabase/migrations/003_premium_subscription.sql` no Supabase SQL Editor.

Isso adiciona:
- Campo `subscription_status` na tabela `profiles`
- Campos do Stripe (`stripe_customer_id`, `stripe_subscription_id`)
- Funções para verificar acesso premium
- Índices para performance

### Passo 2: Criar Webhook do Stripe

Quando implementar Stripe, crie um webhook que atualiza o status no banco:

```javascript
// Exemplo de webhook (Edge Function ou backend)
// Endpoint: /api/stripe-webhook

// Quando pagamento é confirmado:
await supabase
  .from('profiles')
  .update({
    subscription_status: 'premium',
    stripe_customer_id: customer.id,
    stripe_subscription_id: subscription.id,
    subscription_expires_at: new Date(subscription.current_period_end * 1000)
  })
  .eq('id', user_id);
```

### Passo 3: Proteger Features Premium no Banco

**Exemplo:** Se criar uma tabela para features premium:

```sql
-- Criar tabela de features premium
CREATE TABLE IF NOT EXISTS public.premium_features (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

ALTER TABLE public.premium_features ENABLE ROW LEVEL SECURITY;

-- Policy que SÓ permite acesso se for premium
CREATE POLICY "Premium users only"
  ON public.premium_features
  FOR ALL
  USING (
    auth.uid() = user_id 
    AND public.has_premium_access(auth.uid())  -- Verifica no banco!
  );
```

### Passo 4: Verificar no Frontend (Apenas UX)

```typescript
// services/subscriptionService.ts
export const subscriptionService = {
  async checkPremiumAccess(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    
    const { data } = await supabase
      .rpc('has_premium_access', { user_uuid: user.id });
    
    return data || false;
  }
};
```

## 🔒 Boas Práticas de Segurança

### ✅ FAÇA:
1. **Sempre verificar no banco** (RLS policies)
2. **Usar funções PostgreSQL** para validação
3. **Webhooks do Stripe** para atualizar status
4. **Verificar expiração** de assinaturas
5. **Logs** de tentativas de acesso

### ❌ NÃO FAÇA:
1. **Confiar apenas no frontend** para verificar premium
2. **Expor service_role key** no frontend
3. **Permitir acesso sem verificar** no banco
4. **Ignorar expiração** de assinaturas

## 📊 Fluxo Seguro de Verificação Premium

```
1. Usuário tenta acessar feature premium
   ↓
2. Frontend verifica (apenas UX - pode ser burlado)
   ↓
3. Requisição vai para Supabase
   ↓
4. RLS Policy verifica subscription_status no banco ✅
   ↓
5. Função PostgreSQL verifica se é premium ✅
   ↓
6. Se não for premium → BLOQUEADO ❌
   ↓
7. Se for premium → PERMITIDO ✅
```

## 🎯 Conclusão

**Estado Atual:**
- ✅ **SEGURO** - RLS protege contra acesso não autorizado
- ✅ Mesmo copiando CURL, só acessa dados próprios
- ✅ Tokens expiram automaticamente

**Para Implementar Premium:**
1. Execute `003_premium_subscription.sql`
2. Configure webhooks do Stripe
3. Use RLS policies com `has_premium_access()`
4. **NUNCA** confie apenas no frontend

**Resumo:**
- Copiar CURL = ✅ Seguro (só acessa dados próprios)
- Acesso premium = ⚠️ Precisa verificar no banco (não apenas frontend)
- Sistema atual = ✅ Seguro para uso básico
