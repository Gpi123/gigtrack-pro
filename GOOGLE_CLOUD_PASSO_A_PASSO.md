# 🔑 Google Cloud Console - Passo a Passo Detalhado

## 📍 Onde você está agora

Você está na página **"Google Auth Platform / Visão geral"** do Google Cloud Console.

---

## 🎯 PASSO 1: Começar a Configuração

1. **Clique no botão azul "Vamos começar"** (Let's get started)
2. Isso vai te levar para a configuração inicial

---

## 📋 PASSO 2: Configurar OAuth Consent Screen

Após clicar em "Vamos começar", você vai configurar o OAuth Consent Screen:

### 2.1 Tipo de Usuário
- Escolha **"External"** (para usuários externos)
- Clique em **"Create"**

### 2.2 Informações do App
Preencha:
- **App name**: `GigTrack Pro`
- **User support email**: Seu email
- **App logo**: (opcional, pode pular)
- **Application home page**: `https://moonlit-begonia-7bb328.netlify.app`
- **Application privacy policy link**: (opcional, pode pular)
- **Application terms of service link**: (opcional, pode pular)
- **Authorized domains**: (deixe vazio por enquanto)
- **Developer contact information**: Seu email

Clique em **"Save and Continue"**

### 2.3 Scopes (Escopos)
- Não precisa adicionar escopos extras
- Clique em **"Save and Continue"**

### 2.4 Test Users (Usuários de Teste)
- Clique em **"+ Add Users"**
- Adicione seu email
- Clique em **"Add"**
- Clique em **"Save and Continue"**

### 2.5 Summary (Resumo)
- Revise as informações
- Clique em **"Back to Dashboard"**

---

## 📋 PASSO 3: Criar Credenciais OAuth

Agora você precisa criar as credenciais OAuth:

### 3.1 Acessar Credentials
1. No menu lateral esquerdo, procure por **"APIs & Services"**
2. Clique em **"Credentials"** (ou "Credenciais")
3. Se não encontrar, use a busca no topo: digite "Credentials"

### 3.2 Criar OAuth Client ID
1. Clique em **"+ Create Credentials"** (ou "+ Criar credenciais")
2. Escolha **"OAuth client ID"**
3. Se aparecer um aviso sobre OAuth consent screen, significa que você precisa completar o Passo 2 primeiro

### 3.3 Configurar OAuth Client
1. **Application type**: Escolha **"Web application"**
2. **Name**: `GigTrack Pro Web Client`
3. **Authorized JavaScript origins**: Clique em **"+ Add URI"** e adicione:
   ```
   http://localhost:3000
   https://moonlit-begonia-7bb328.netlify.app
   ```
4. **Authorized redirect URIs**: Clique em **"+ Add URI"** e adicione **TODAS** estas URLs:
   ```
   http://localhost:3000
   https://moonlit-begonia-7bb328.netlify.app
   https://aphwcgywzcgeeykmrxua.supabase.co/auth/v1/callback
   ```
5. Clique em **"Create"** (ou "Criar")

### 3.4 Copiar Credenciais
Uma janela vai aparecer com:
- **Your Client ID**: Copie esse valor (algo como `123456789-abc...`)
- **Your Client Secret**: Copie esse valor (algo como `GOCSPX-abc...`)

⚠️ **IMPORTANTE**: Salve esses valores! Você não vai conseguir ver o Client Secret novamente.

---

## 📋 PASSO 4: Configurar no Supabase

Agora que você tem o Client ID e Client Secret:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. No menu lateral, vá em **"Authentication"** → **"Providers"**
4. Encontre **"Google"** na lista
5. Clique no toggle para **habilitar**
6. Preencha:
   - **Client ID (for OAuth)**: Cole o Client ID
   - **Client Secret (for OAuth)**: Cole o Client Secret
7. Clique em **"Save"**

---

## ✅ PASSO 5: Testar

1. Acesse: https://moonlit-begonia-7bb328.netlify.app
2. Clique no ícone de usuário
3. Clique em "Entrar com Google"
4. Faça login
5. ✅ Pronto!

---

## 🆘 Se Não Encontrar "APIs & Services"

Se você não encontrar "APIs & Services" no menu:

1. Use a **barra de busca** no topo
2. Digite: `OAuth consent screen`
3. Ou digite: `Credentials`
4. Isso vai te levar para as páginas corretas

---

## 📝 Checklist

- [ ] Clicou em "Vamos começar"
- [ ] Configurou OAuth consent screen
- [ ] Adicionou seu email como test user
- [ ] Criou credenciais OAuth (Client ID e Secret)
- [ ] Adicionou todas as URLs de redirect
- [ ] Copiou Client ID e Secret
- [ ] Configurou no Supabase
- [ ] Testou o login

---

**Continue a partir do Passo 1 acima!** 🚀
