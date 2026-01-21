# 🚀 Passo a Passo Completo - Configuração Final

## ✅ Status Atual

- ✅ Repositório no GitHub
- ✅ Deploy no Netlify (mas sem variáveis de ambiente)
- ✅ Projeto Supabase criado
- ⏳ Pendente: Configurar variáveis e OAuth

---

## 📋 PASSO 1: Executar Migração SQL no Supabase

**OBJETIVO**: Criar as tabelas no banco de dados

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral esquerdo, clique em **"SQL Editor"** (ícone de banco de dados)
4. Clique em **"New query"** (botão no topo)
5. Abra o arquivo `supabase/migrations/001_initial_schema.sql` deste projeto
6. **Copie TODO o conteúdo** do arquivo SQL
7. **Cole no editor SQL** do Supabase
8. Clique em **"Run"** (botão no canto inferior direito, ou pressione `Ctrl+Enter`)
9. ✅ Você deve ver uma mensagem de sucesso: "Success. No rows returned"

**Verificar se funcionou:**
- No menu lateral, clique em **"Table Editor"**
- Você deve ver duas tabelas: `profiles` e `gigs`

---

## 🔐 PASSO 2: Configurar Variáveis de Ambiente no Netlify

**OBJETIVO**: Fazer o app funcionar em produção

1. Acesse: https://app.netlify.com
2. Selecione seu site: `moonlit-begonia-7bb328`
3. Clique em **"Site settings"** (ou vá em Settings)
4. No menu lateral, clique em **"Environment variables"**
5. Adicione as variáveis uma por uma:

### Variável 1: VITE_SUPABASE_URL
- Clique em **"Add a variable"**
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://aphwcgywzcgeeykmrxua.supabase.co`
- **Scopes**: Marque apenas **"Production"** e **"Deploy previews"**
- Clique em **"Save"**

### Variável 2: VITE_SUPABASE_ANON_KEY
- Clique em **"Add a variable"**
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA`
- **Scopes**: Marque apenas **"Production"** e **"Deploy previews"**
- Clique em **"Save"**

### Variável 3: GEMINI_API_KEY (Opcional)
- Se você tiver uma chave da Gemini API, adicione:
- **Key**: `GEMINI_API_KEY`
- **Value**: Sua chave da Gemini
- **Scopes**: Marque apenas **"Production"** e **"Deploy previews"**
- Clique em **"Save"**

6. Após adicionar todas as variáveis, volte para a página inicial do site
7. Clique em **"Trigger deploy"** → **"Deploy site"**
8. Aguarde o deploy completar (alguns segundos)

---

## 🔑 PASSO 3: Configurar Google OAuth

### 3.1 Criar Credenciais no Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Clique em **"Select a project"** → **"New Project"**
3. Dê um nome: `GigTrack Pro`
4. Clique em **"Create"**

5. Vá em **"APIs & Services"** → **"OAuth consent screen"**
6. Escolha **"External"** → **"Create"**
7. Preencha:
   - **App name**: `GigTrack Pro`
   - **User support email**: Seu email
   - **Developer contact information**: Seu email
8. Clique em **"Save and Continue"**
9. Na tela de **Scopes**, clique em **"Save and Continue"** (sem adicionar escopos)
10. Na tela de **Test users**, adicione seu email → **"Save and Continue"**
11. Clique em **"Back to Dashboard"**

12. Vá em **"APIs & Services"** → **"Credentials"**
13. Clique em **"Create Credentials"** → **"OAuth client ID"**
14. Escolha **"Web application"**
15. Preencha:
    - **Name**: `GigTrack Pro Web Client`
    - **Authorized JavaScript origins**:
      ```
      http://localhost:3000
      https://moonlit-begonia-7bb328.netlify.app
      ```
    - **Authorized redirect URIs**:
      ```
      http://localhost:3000
      https://moonlit-begonia-7bb328.netlify.app
      https://aphwcgywzcgeeykmrxua.supabase.co/auth/v1/callback
      ```
16. Clique em **"Create"**
17. **COPIE o Client ID e Client Secret** (você vai precisar deles!)

### 3.2 Configurar no Supabase

1. No painel do Supabase, vá em **"Authentication"** → **"Providers"**
2. Encontre **"Google"** na lista de providers
3. Clique no toggle para **habilitar** o Google
4. Preencha:
   - **Client ID (for OAuth)**: Cole o Client ID do Google
   - **Client Secret (for OAuth)**: Cole o Client Secret do Google
5. Clique em **"Save"**

---

## 🧪 PASSO 4: Testar Localmente

1. Crie o arquivo `.env.local` na raiz do projeto com:
```env
VITE_SUPABASE_URL=https://aphwcgywzcgeeykmrxua.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA
GEMINI_API_KEY=sua_chave_aqui
```

2. Execute:
```bash
npm install
npm run dev
```

3. Acesse: http://localhost:3000
4. Teste o login com Google

---

## 🌐 PASSO 5: Testar em Produção

1. Acesse: https://moonlit-begonia-7bb328.netlify.app
2. Clique no ícone de usuário no header
3. Clique em **"Entrar com Google"**
4. Faça login com sua conta Google
5. Você deve ser redirecionado de volta e estar logado
6. Tente criar um show!

---

## 📝 Sobre o Render

**IMPORTANTE**: Este projeto **NÃO precisa do Render**!

- ✅ **Frontend**: Netlify (React/Vite)
- ✅ **Backend**: Supabase (banco de dados + autenticação)
- ✅ **Tudo funciona sem servidor separado!**

Você só precisaria do Render se:
- Tivesse APIs customizadas em Node.js/Python
- Precisasse de processamento server-side pesado
- Tivesse jobs agendados (cron jobs)

**Para este projeto, Netlify + Supabase é suficiente!** 🎉

---

## ✅ Checklist Final

- [ ] Migração SQL executada no Supabase
- [ ] Tabelas `profiles` e `gigs` criadas
- [ ] Variáveis de ambiente configuradas no Netlify
- [ ] Novo deploy feito no Netlify
- [ ] Google OAuth configurado no Google Cloud
- [ ] Google OAuth configurado no Supabase
- [ ] Login funcionando localmente
- [ ] Login funcionando em produção

---

## 🆘 Problemas Comuns

### Erro: "User not authenticated"
- Verifique se as variáveis de ambiente estão corretas
- Verifique se fez um novo deploy após adicionar as variáveis

### Erro ao fazer login com Google
- Verifique se as URLs de redirect estão corretas no Google Cloud
- Verifique se o Client ID e Secret estão corretos no Supabase
- Certifique-se de que o OAuth consent screen está em modo "Testing" ou "Production"

### Erro ao carregar shows
- Verifique se a migração SQL foi executada
- Abra o console do navegador (F12) e veja os erros
- Verifique os logs do Supabase (Dashboard → Logs)

---

**Pronto!** Siga os passos acima e seu app estará funcionando! 🚀
