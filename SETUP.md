# Guia de Configuração - GigTrack Pro

Este guia irá te ajudar a configurar o projeto completo com Supabase, autenticação Google e deploy.

## 📋 Pré-requisitos

- Conta no [Supabase](https://supabase.com)
- Conta no [Google Cloud Console](https://console.cloud.google.com) (para OAuth)
- Conta no [GitHub](https://github.com)
- Conta no [Netlify](https://netlify.com) (para deploy do frontend)
- Conta no [Render](https://render.com) (opcional, se precisar de backend)
- Node.js instalado (versão 18 ou superior)

---

## 🔧 Passo 1: Configurar Supabase

### 1.1 Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em "New Project"
3. Preencha:
   - **Name**: Nome do seu projeto (ex: `gigtrack-pro`)
   - **Database Password**: Escolha uma senha forte e salve em local seguro
   - **Region**: Escolha a região mais próxima
4. Aguarde alguns minutos enquanto o projeto é criado

### 1.2 Executar migração SQL

1. No painel do Supabase, vá em **SQL Editor** (ícone de banco de dados no menu lateral)
2. Clique em **New Query**
3. Abra o arquivo `supabase/migrations/001_initial_schema.sql` deste projeto
4. Copie todo o conteúdo e cole no editor SQL do Supabase
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Verifique se a mensagem de sucesso apareceu

### 1.3 Obter credenciais do Supabase

1. No painel do Supabase, vá em **Settings** (ícone de engrenagem)
2. Clique em **API** no menu lateral
3. Copie os seguintes valores:
   - **Project URL** (será usado como `VITE_SUPABASE_URL`)
   - **anon public** key (será usado como `VITE_SUPABASE_ANON_KEY`)

---

## 🔐 Passo 2: Configurar Autenticação Google OAuth

### 2.1 Criar projeto no Google Cloud Console

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Clique em **Select a project** → **New Project**
3. Dê um nome ao projeto (ex: `GigTrack Pro`)
4. Clique em **Create**

### 2.2 Configurar OAuth Consent Screen

1. No menu lateral, vá em **APIs & Services** → **OAuth consent screen**
2. Escolha **External** e clique em **Create**
3. Preencha:
   - **App name**: GigTrack Pro
   - **User support email**: Seu email
   - **Developer contact information**: Seu email
4. Clique em **Save and Continue**
5. Na tela de **Scopes**, clique em **Save and Continue** (sem adicionar escopos extras)
6. Na tela de **Test users**, adicione seu email e clique em **Save and Continue**
7. Se estiver em modo de teste, você verá um aviso. Clique em **Back to Dashboard**

### 2.3 Criar credenciais OAuth

1. No menu lateral, vá em **APIs & Services** → **Credentials**
2. Clique em **Create Credentials** → **OAuth client ID**
3. Se solicitado, configure o OAuth consent screen primeiro
4. Escolha **Web application**
5. Preencha:
   - **Name**: GigTrack Pro Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:3000` (para desenvolvimento)
     - `https://seu-dominio.netlify.app` (para produção - você atualizará depois)
   - **Authorized redirect URIs**:
     - `http://localhost:3000` (para desenvolvimento)
     - `https://seu-projeto.supabase.co/auth/v1/callback` (URL do seu projeto Supabase)
     - `https://seu-dominio.netlify.app` (para produção)
6. Clique em **Create**
7. **IMPORTANTE**: Copie o **Client ID** e **Client Secret** (você precisará deles)

### 2.4 Configurar Google OAuth no Supabase

1. No painel do Supabase, vá em **Authentication** → **Providers**
2. Encontre **Google** na lista e clique para habilitar
3. Preencha:
   - **Client ID (for OAuth)**: Cole o Client ID do Google
   - **Client Secret (for OAuth)**: Cole o Client Secret do Google
4. Clique em **Save**

---

## 💻 Passo 3: Configurar projeto localmente

### 3.1 Instalar dependências

```bash
npm install
```

### 3.2 Configurar variáveis de ambiente

1. Crie um arquivo `.env` na raiz do projeto (copie do `.env.example`):

```bash
cp .env.example .env
```

2. Edite o arquivo `.env` e preencha com suas credenciais:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
GEMINI_API_KEY=sua_gemini_api_key_aqui
```

### 3.3 Executar localmente

```bash
npm run dev
```

O app estará disponível em `http://localhost:3000`

---

## 🚀 Passo 4: Deploy no Netlify

### 4.1 Preparar repositório Git

1. Inicialize o Git (se ainda não fez):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Crie um repositório no GitHub:
   - Acesse [github.com](https://github.com)
   - Clique em **New repository**
   - Dê um nome ao repositório
   - **NÃO** marque "Initialize with README"
   - Clique em **Create repository**

3. Conecte seu projeto local ao GitHub:
```bash
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git branch -M main
git push -u origin main
```

### 4.2 Configurar Netlify

1. Acesse [netlify.com](https://netlify.com) e faça login com GitHub
2. Clique em **Add new site** → **Import an existing project**
3. Escolha seu repositório do GitHub
4. Configure o build:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Clique em **Show advanced** e adicione as variáveis de ambiente:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua anon key do Supabase
   - `GEMINI_API_KEY` = sua chave da Gemini API
6. Clique em **Deploy site**

### 4.3 Atualizar URLs do Google OAuth

Após o deploy, você receberá uma URL do Netlify (ex: `https://seu-app.netlify.app`):

1. No Google Cloud Console, vá em **Credentials** → seu OAuth client
2. Adicione nas **Authorized JavaScript origins**:
   - `https://seu-app.netlify.app`
3. Adicione nas **Authorized redirect URIs**:
   - `https://seu-app.netlify.app`
4. Salve as alterações

---

## 📝 Passo 5: Verificações finais

### ✅ Checklist

- [ ] Projeto Supabase criado e migração SQL executada
- [ ] Autenticação Google configurada no Supabase
- [ ] Variáveis de ambiente configuradas localmente
- [ ] App funcionando localmente
- [ ] Repositório Git criado e código enviado
- [ ] Deploy no Netlify concluído
- [ ] URLs do Google OAuth atualizadas com domínio do Netlify
- [ ] Login com Google funcionando em produção

---

## 🔍 Troubleshooting

### Erro: "User not authenticated"
- Verifique se as variáveis de ambiente estão configuradas corretamente
- Verifique se o usuário está logado (clique no ícone de usuário no header)

### Erro ao fazer login com Google
- Verifique se as URLs de redirect estão corretas no Google Cloud Console
- Verifique se o Client ID e Secret estão corretos no Supabase
- Certifique-se de que o OAuth consent screen está configurado

### Erro ao carregar shows
- Verifique se a migração SQL foi executada corretamente
- Verifique se as políticas RLS estão ativas no Supabase
- Verifique os logs do navegador (F12) para mais detalhes

### Erro no deploy do Netlify
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se o build command está correto
- Verifique os logs de build no Netlify

---

## 📚 Recursos adicionais

- [Documentação Supabase](https://supabase.com/docs)
- [Documentação Netlify](https://docs.netlify.com)
- [Documentação Google OAuth](https://developers.google.com/identity/protocols/oauth2)

---

## 🆘 Suporte

Se encontrar problemas, verifique:
1. Os logs do console do navegador (F12)
2. Os logs do Supabase (Dashboard → Logs)
3. Os logs do Netlify (Site → Deploys → selecione o deploy → View logs)

---

**Pronto!** Seu app está configurado e pronto para uso! 🎉
