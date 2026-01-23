# 🔐 Segurança Avançada - Proteção contra Acesso Não Autorizado

## ❓ Perguntas Frequentes sobre Segurança

### 1. "Um usuário pode copiar o CURL de uma requisição e acessar o banco?"

**Resposta: NÃO (com RLS configurado corretamente)**

**Por quê?**
- Cada requisição contém um **JWT token** único do usuário autenticado
- O token expira após um tempo (padrão: 1 hora)
- O RLS usa `auth.uid()` que verifica o token JWT
- Mesmo copiando o CURL, o token expira e só funciona para os dados daquele usuário específico

**Exemplo:**
```bash
# Requisição que um usuário vê no DevTools:
curl 'https://seu-projeto.supabase.co/rest/v1/gigs?select=*&user_id=eq.USER_ID&order=date.asc' \
  -H 'apikey: ANON_KEY' \
  -H 'Authorization: Bearer JWT_TOKEN_DO_USUARIO'
```

**O que acontece se alguém copiar isso?**
- ✅ Só funciona enquanto o token estiver válido (1 hora)
- ✅ Só acessa dados do usuário que gerou o token
- ✅ Não consegue acessar dados de outros usuários (RLS bloqueia)
- ✅ Token expira automaticamente

### 2. "Se eu adicionar login pago via Stripe, hackers podem conseguir acesso gratuito?"

**Resposta: Depende da implementação, mas pode ser protegido**

**Riscos:**
- ⚠️ Se você só verificar no frontend → **VULNERÁVEL**
- ✅ Se verificar no backend/banco → **SEGURO**

**Solução Recomendada:**
1. Adicionar campo `subscription_status` na tabela `profiles`
2. Criar função no PostgreSQL que verifica status premium
3. Usar RLS policies que verificam subscription antes de permitir acesso

### 3. "Como proteger funcionalidades premium?"

**Estratégia em 3 camadas:**

#### Camada 1: Frontend (UX apenas)
- Mostrar/ocultar features baseado em subscription
- **NÃO confie apenas nisso** (fácil de burlar)

#### Camada 2: Backend/Database (Segurança Real)
- Verificar subscription no banco de dados
- RLS policies que bloqueiam acesso sem subscription
- Funções PostgreSQL que validam status

#### Camada 3: Validação de Negócio
- Webhooks do Stripe atualizam status no banco
- Verificação periódica de assinaturas ativas
- Logs de tentativas de acesso não autorizado

## 🛡️ Implementação de Proteção Premium

### Passo 1: Adicionar campo de subscription na tabela profiles

```sql
-- Adicionar campos de subscription
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'premium', 'trial', 'expired')),
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Índice para queries rápidas
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription_status);
```

### Passo 2: Criar função para verificar acesso premium

```sql
-- Função que verifica se usuário tem acesso premium
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
```

### Passo 3: Atualizar RLS policies para verificar premium

```sql
-- Exemplo: Permitir acesso a features premium apenas para assinantes
-- (você pode criar tabelas específicas para features premium)

-- Policy que permite acesso apenas se for premium
CREATE POLICY "Premium users can access premium features"
  ON public.premium_features
  FOR SELECT
  USING (
    auth.uid() = user_id 
    AND public.has_premium_access(auth.uid())
  );
```

### Passo 4: Webhook do Stripe para atualizar status

```javascript
// Exemplo de webhook (Edge Function ou backend)
// Quando Stripe confirma pagamento, atualiza o status no banco
```

## 🔒 Melhorias de Segurança Adicionais

### 1. Rate Limiting
- Limitar número de requisições por usuário
- Prevenir abuso de API

### 2. Validação de Dados
- Validar todos os inputs no banco
- Usar CHECK constraints
- Sanitizar dados antes de salvar

### 3. Logs e Monitoramento
- Registrar tentativas de acesso não autorizado
- Alertas para comportamentos suspeitos

### 4. Tokens com Expiração Curta
- Reduzir tempo de expiração do JWT
- Refresh tokens para renovação

## ✅ Checklist de Segurança

- [x] RLS habilitado em todas as tabelas
- [x] Políticas de segurança por usuário
- [x] Service role key NUNCA no frontend
- [x] Autenticação obrigatória
- [ ] Rate limiting (opcional)
- [ ] Validação de subscription no banco (quando implementar premium)
- [ ] Webhooks do Stripe (quando implementar premium)
- [ ] Logs de segurança (opcional)

## 🎯 Conclusão

**Estado Atual:**
- ✅ **SEGURO** para uso básico
- ✅ RLS protege contra acesso não autorizado
- ✅ Tokens JWT expiram automaticamente
- ✅ Mesmo copiando CURL, só acessa dados próprios

**Para Funcionalidades Premium:**
- ⚠️ Precisa adicionar verificação no banco
- ⚠️ Não confie apenas no frontend
- ✅ Use RLS policies + funções PostgreSQL
- ✅ Webhooks do Stripe para atualizar status

**Recomendação:**
1. **Agora:** Manter como está (já está seguro)
2. **Quando adicionar premium:** Implementar verificação no banco (não apenas frontend)
3. **Opcional:** Adicionar rate limiting e logs
