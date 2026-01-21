# 🔑 Configurar Google OAuth - Passo a Passo

## ✅ O que já está pronto

- ✅ Variáveis de ambiente no Netlify
- ✅ Tabelas criadas no Supabase
- ✅ Deploy no Netlify funcionando
- ⏳ **Falta**: Configurar Google OAuth

---

## 📋 PASSO 1: Criar Credenciais OAuth no Google Cloud Console

### 1.1 Acessar Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Faça login com sua conta Google

### 1.2 Criar ou Selecionar Projeto

1. No topo da página, clique em **"Select a project"**
2. Clique em **"New Project"**
3. Preencha:
   - **Project name**: `GigTrack Pro`
4. Clique em **"Create"**
5. Aguarde alguns segundos e selecione o projeto criado

### 1.3 Configurar OAuth Consent Screen

1. No menu lateral, vá em **"APIs & Services"** → **"OAuth consent screen"**
2. Escolha **"External"** → Clique em **"Create"**
3. Preencha o formulário:
   - **App name**: `GigTrack Pro`
   - **User support email**: Seu email
   - **App logo**: (opcional, pode pular)
   - **Application home page**: `https://moonlit-begonia-7bb328.netlify.app`
   - **Authorized domains**: (deixe vazio por enquanto)
   - **Developer contact information**: Seu email
4. Clique em **"Save and Continue"**

5. Na tela **"Scopes"**:
   - Não precisa adicionar escopos extras
   - Clique em **"Save and Continue"**

6. Na tela **"Test users"**:
   - Clique em **"+ Add Users"**
   - Adicione seu email
   - Clique em **"Add"**
   - Clique em **"Save and Continue"**

7. Na tela **"Summary"**:
   - Revise as informações
   - Clique em **"Back to Dashboard"**

### 1.4 Criar Credenciais OAuth

1. No menu lateral, vá em **"APIs & Services"** → **"Credentials"**
2. Clique em **"+ Create Credentials"** → **"OAuth client ID"**
3. Se aparecer um aviso sobre OAuth consent screen, clique em **"Configure Consent Screen"** e volte depois
4. Escolha **"Web application"**
5. Preencha:
   - **Name**: `GigTrack Pro Web Client`
   - **Authorized JavaScript origins**: Clique em **"+ Add URI"** e adicione:
     ```
     http://localhost:3000
     https://moonlit-begonia-7bb328.netlify.app
     ```
   - **Authorized redirect URIs**: Clique em **"+ Add URI"** e adicione:
     ```
     http://localhost:3000
     https://moonlit-begonia-7bb328.netlify.app
     https://aphwcgywzcgeeykmrxua.supabase.co/auth/v1/callback
     ```
6. Clique em **"Create"**
7. **IMPORTANTE**: Uma janela vai aparecer com:
   - **Your Client ID**: Copie esse valor
   - **Your Client Secret**: Copie esse valor
8. **Salve esses valores em um lugar seguro!** Você vai precisar deles no próximo passo.

---

## 📋 PASSO 2: Configurar Google OAuth no Supabase

### 2.1 Acessar Configurações do Supabase

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, vá em **"Authentication"** → **"Providers"**

### 2.2 Habilitar Google Provider

1. Na lista de providers, encontre **"Google"**
2. Clique no toggle para **habilitar** o Google (deve ficar verde/azul)
3. Preencha os campos:
   - **Client ID (for OAuth)**: Cole o **Client ID** que você copiou do Google Cloud
   - **Client Secret (for OAuth)**: Cole o **Client Secret** que você copiou do Google Cloud
4. Clique em **"Save"**

---

## 🧪 PASSO 3: Testar o Login

### 3.1 Testar no Site em Produção

1. Acesse: https://moonlit-begonia-7bb328.netlify.app
2. Clique no **ícone de usuário** no header (canto superior direito)
3. Clique em **"Entrar com Google"**
4. Você será redirecionado para o Google
5. Escolha sua conta Google
6. Autorize o acesso
7. Você será redirecionado de volta para o site
8. ✅ Você deve estar logado!

### 3.2 Testar Criando um Show

1. Com você logado, clique em **"Novo Show"**
2. Preencha os dados:
   - Título: `Show de Teste`
   - Data: Escolha uma data
   - Valor: `500`
   - Local: `Local de Teste`
3. Clique em **"Confirmar Evento"**
4. ✅ O show deve aparecer na lista!

---

## ✅ Checklist Final

- [ ] Projeto criado no Google Cloud Console
- [ ] OAuth consent screen configurado
- [ ] Credenciais OAuth criadas (Client ID e Secret)
- [ ] URLs de redirect configuradas no Google Cloud
- [ ] Google OAuth habilitado no Supabase
- [ ] Client ID e Secret configurados no Supabase
- [ ] Login testado no site
- [ ] Show criado com sucesso

---

## 🆘 Problemas Comuns

### Erro: "redirect_uri_mismatch"
- Verifique se todas as URLs de redirect estão corretas no Google Cloud Console
- Certifique-se de incluir: `https://aphwcgywzcgeeykmrxua.supabase.co/auth/v1/callback`

### Erro: "Access blocked: This app's request is invalid"
- Verifique se o OAuth consent screen está configurado
- Certifique-se de adicionar seu email como "Test user"

### Erro: "User not authenticated" após login
- Verifique se as variáveis de ambiente estão corretas no Netlify
- Faça um novo deploy após adicionar as variáveis

### Login funciona mas não carrega shows
- Verifique se a migração SQL foi executada
- Abra o console do navegador (F12) e veja se há erros
- Verifique os logs do Supabase (Dashboard → Logs)

---

## 🎉 Pronto!

Depois de seguir esses passos, seu app estará 100% funcional! 🚀
