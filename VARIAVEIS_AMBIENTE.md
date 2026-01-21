# 🔐 Variáveis de Ambiente - Configuração Completa

## 📝 Arquivo .env.local (Para desenvolvimento local)

Crie ou edite o arquivo `.env.local` na raiz do projeto com o seguinte conteúdo:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://aphwcgywzcgeeykmrxua.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA

# Gemini API (for AI insights) - Opcional
GEMINI_API_KEY=sua_chave_gemini_aqui
```

## 🌐 Variáveis para o Netlify

No Netlify, adicione as seguintes variáveis de ambiente:

### 1. VITE_SUPABASE_URL
- **Valor**: `https://aphwcgywzcgeeykmrxua.supabase.co`

### 2. VITE_SUPABASE_ANON_KEY
- **Valor**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA`

### 3. GEMINI_API_KEY (Opcional)
- **Valor**: Sua chave da Gemini API (se tiver)

## 📋 Como Adicionar no Netlify

1. Acesse: https://app.netlify.com
2. Selecione seu site: `moonlit-begonia-7bb328`
3. Vá em **"Site settings"** (ou Settings)
4. Clique em **"Environment variables"** no menu lateral
5. Para cada variável:
   - Clique em **"Add a variable"**
   - Preencha **Key** e **Value**
   - Marque os **Scopes**: Production e Deploy previews
   - Clique em **"Save"**
6. Após adicionar todas, faça um novo deploy

## ⚠️ Importante

- **NUNCA** commite o arquivo `.env.local` no Git (já está no .gitignore)
- Use apenas a **ANON KEY** no frontend (nunca a SERVICE_ROLE_KEY)
- A SERVICE_ROLE_KEY só deve ser usada em backends seguros (não no frontend)
