# 📧 Como Configurar Envio de Emails de Convite

## 📋 Opções Disponíveis

### Opção 1: Resend (Recomendado - Gratuito até 3.000 emails/mês)

#### Passo 1: Criar conta no Resend
1. Acesse [resend.com](https://resend.com)
2. Crie uma conta gratuita
3. Vá em **API Keys** e crie uma nova chave
4. Copie a chave (começa com `re_`)

#### Passo 2: Configurar no Supabase
1. No Supabase Dashboard, vá em **Edge Functions**
2. Clique em **Create a new function**
3. Nome: `send-invite-email`
4. Cole o código de `supabase/functions/send-invite-email/index.ts`
5. Vá em **Settings** → **Edge Functions** → **Secrets**
6. Adicione:
   - `RESEND_API_KEY` = sua chave do Resend
   - `SITE_URL` = `https://moonlit-begonia-7bb328.netlify.app` (ou sua URL)

#### Passo 3: Verificar domínio (Opcional)
- Para usar `noreply@gigtrackpro.com`, você precisa verificar o domínio no Resend
- Ou use o domínio padrão do Resend: `onboarding@resend.dev`

### Opção 2: SendGrid (Alternativa)

Similar ao Resend, mas requer configuração diferente na Edge Function.

### Opção 3: Email Simples (Sem Edge Function)

Se não quiser configurar Edge Functions, podemos criar uma solução mais simples que apenas mostra o link do convite na interface.

## 🚀 Deploy da Edge Function

Após configurar:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar ao projeto
supabase link --project-ref seu-project-ref

# Deploy da função
supabase functions deploy send-invite-email
```

## ✅ Testar

Após configurar, ao criar um convite:
1. O convite será criado no banco
2. Um email será enviado automaticamente
3. O email conterá um link para aceitar o convite

## 🔗 Criar Página de Aceitação

Você precisará criar uma página `/accept-invite` que:
1. Recebe o token via query string
2. Chama `bandService.acceptInvite(token)`
3. Redireciona para a aplicação

Quer que eu crie essa página também?
