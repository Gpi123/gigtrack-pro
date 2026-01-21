# 🚀 Guia Completo: Configurar Deploy no Netlify e Supabase

## ✅ O que você já tem

- ✅ Repositório no GitHub: `Gpi123/gigtrack-pro`
- ✅ Deploy no Netlify: `moonlit-begonia-7bb328.netlify.app`
- ✅ Projeto Supabase criado

## 📋 Passo 1: Executar Migração SQL no Supabase

Antes de tudo, precisamos criar as tabelas no banco de dados:

1. Acesse o painel do Supabase: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, clique em **"SQL Editor"** (ícone de banco de dados)
4. Clique em **"New query"**
5. Abra o arquivo `supabase/migrations/001_initial_schema.sql` deste projeto
6. **Copie TODO o conteúdo** do arquivo SQL
7. **Cole no editor SQL** do Supabase
8. Clique em **"Run"** (ou pressione Ctrl+Enter)
9. Você deve ver uma mensagem de sucesso ✅

## 🔐 Passo 2: Configurar Variáveis de Ambiente no Netlify

1. Acesse seu projeto no Netlify: https://app.netlify.com
2. Vá em **"Site settings"** (ou clique no nome do site → Settings)
3. No menu lateral, clique em **"Environment variables"**
4. Adicione as seguintes variáveis (clique em **"Add a variable"** para cada uma):

### Variável 1:
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://aphwcgywzcgeeykmrxua.supabase.co`
- **Scopes**: Deixe marcado apenas **"Production"** e **"Deploy previews"**

### Variável 2:
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NTc2ODgx.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA`
- **Scopes**: Deixe marcado apenas **"Production"** e **"Deploy previews"**

### Variável 3 (Opcional - para insights com IA):
- **Key**: `GEMINI_API_KEY`
- **Value**: Sua chave da Gemini API (se tiver)
- **Scopes**: Deixe marcado apenas **"Production"** e **"Deploy previews"**

5. Após adicionar todas as variáveis, volte para a página inicial do site
6. Clique em **"Trigger deploy"** → **"Deploy site"** para fazer um novo deploy com as variáveis

## 🔑 Passo 3: Configurar Google OAuth no Supabase

### 3.1 Criar Credenciais OAuth no Google Cloud

1. Acesse: https://console.cloud.google.com
2. Crie um novo projeto ou selecione um existente
3. Vá em **"APIs & Services"** → **"OAuth consent screen"**
4. Configure:
   - **User Type**: External
   - **App name**: GigTrack Pro
   - **User support email**: Seu email
   - **Developer contact**: Seu email
5. Clique em **"Save and Continue"** nas próximas telas (sem adicionar escopos extras)
6. Vá em **"APIs & Services"** → **"Credentials"**
7. Clique em **"Create Credentials"** → **"OAuth client ID"**
8. Escolha **"Web application"**
9. Preencha:
   - **Name**: GigTrack Pro Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (para desenvolvimento)
     - `https://moonlit-begonia-7bb328.netlify.app` (seu domínio Netlify)
   - **Authorized redirect URIs**:
     - `http://localhost:3000`
     - `https://moonlit-begonia-7bb328.netlify.app`
     - `https://aphwcgywzcgeeykmrxua.supabase.co/auth/v1/callback`
10. Clique em **"Create"**
11. **Copie o Client ID e Client Secret**

### 3.2 Configurar Google OAuth no Supabase

1. No painel do Supabase, vá em **"Authentication"** → **"Providers"**
2. Encontre **"Google"** na lista
3. Clique para **habilitar**
4. Preencha:
   - **Client ID (for OAuth)**: Cole o Client ID do Google
   - **Client Secret (for OAuth)**: Cole o Client Secret do Google
5. Clique em **"Save"**

## 🚀 Passo 4: Fazer Novo Deploy no Netlify

Após configurar tudo:

1. No Netlify, vá em **"Deploys"**
2. Clique em **"Trigger deploy"** → **"Deploy site"**
3. Aguarde o deploy completar
4. Acesse seu site: `https://moonlit-begonia-7bb328.netlify.app`

## ✅ Passo 5: Testar

1. Acesse seu site no Netlify
2. Clique no ícone de usuário no header
3. Tente fazer login com Google
4. Se funcionar, você será redirecionado e poderá criar shows!

## 📝 Sobre o Render (Backend)

**IMPORTANTE**: Este projeto **NÃO precisa de backend separado no Render**!

- O Supabase já funciona como backend (banco de dados + autenticação)
- O frontend (React) roda no Netlify
- Tudo se comunica diretamente com o Supabase

Você só precisaria do Render se:
- Tivesse APIs customizadas em Node.js/Python/etc
- Precisasse de processamento server-side
- Tivesse jobs agendados

Para este projeto, **Netlify + Supabase é suficiente**! 🎉

## 🔍 Verificar se Está Funcionando

### Checklist:

- [ ] Migração SQL executada no Supabase
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Google OAuth configurado no Google Cloud Console
- [ ] Google OAuth configurado no Supabase
- [ ] Novo deploy feito no Netlify
- [ ] Login com Google funcionando no site

## 🆘 Troubleshooting

### Erro: "User not authenticated"
- Verifique se as variáveis de ambiente estão corretas no Netlify
- Verifique se fez um novo deploy após adicionar as variáveis

### Erro ao fazer login com Google
- Verifique se as URLs de redirect estão corretas no Google Cloud Console
- Verifique se o Client ID e Secret estão corretos no Supabase
- Certifique-se de que o OAuth consent screen está configurado

### Erro ao carregar shows
- Verifique se a migração SQL foi executada
- Verifique os logs do navegador (F12 → Console)
- Verifique os logs do Supabase (Dashboard → Logs)

---

**Pronto!** Seu app está configurado e pronto para uso! 🎉
