# 🔧 Corrigir Deploy no Netlify

## ⚠️ Problemas Identificados

1. **Variáveis de ambiente não estão sendo lidas** - Erro: `supabaseUrl is required`
2. **Arquivo CSS não encontrado** - Erro: `index.css net::ERR_ABORTED 404`

## 🔧 Soluções

### 1. Verificar Variáveis de Ambiente no Netlify

1. Acesse: https://app.netlify.com
2. Selecione seu site: `moonlit-begonia-7bb328`
3. Vá em **"Site settings"** → **"Environment variables"**
4. Verifique se estas variáveis existem:

#### Variável 1: VITE_SUPABASE_URL
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://aphwcgywzcgeeykmrxua.supabase.co`
- **Scopes**: Production, Deploy previews

#### Variável 2: VITE_SUPABASE_ANON_KEY
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA`
- **Scopes**: Production, Deploy previews

### 2. Fazer Novo Deploy

**IMPORTANTE**: Após adicionar/verificar as variáveis, você DEVE fazer um novo deploy!

1. No Netlify, vá para a página inicial do seu site
2. Clique em **"Trigger deploy"** → **"Deploy site"**
3. Aguarde o deploy completar (alguns minutos)
4. Teste novamente

### 3. Verificar Build Settings

1. Vá em **"Site settings"** → **"Build & deploy"**
2. Verifique:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### 4. Verificar Logs do Deploy

1. Vá em **"Deploys"**
2. Clique no deploy mais recente
3. Veja os logs para verificar se há erros
4. Procure por mensagens sobre variáveis de ambiente

## 🧪 Testar Localmente Primeiro

Antes de fazer deploy, teste localmente:

1. Crie o arquivo `.env.local` na raiz do projeto:
```env
VITE_SUPABASE_URL=https://aphwcgywzcgeeykmrxua.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA
```

2. Execute:
```bash
npm install
npm run dev
```

3. Acesse: http://localhost:3000
4. Verifique se funciona localmente

## ✅ Checklist

- [ ] Variáveis de ambiente verificadas no Netlify
- [ ] Novo deploy feito após verificar variáveis
- [ ] Build settings corretos
- [ ] Testado localmente primeiro
- [ ] Logs do deploy verificados

---

**Depois de fazer o novo deploy, teste novamente!** 🚀
