# 🔐 Credenciais Supabase - Guia Completo

## ✅ Use estas credenciais:

### Para o arquivo `.env.local` (desenvolvimento local):

```env
VITE_SUPABASE_URL=https://aphwcgywzcgeeykmrxua.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA
```

### Para o Netlify (produção):

**Variável 1:**
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://aphwcgywzcgeeykmrxua.supabase.co`

**Variável 2:**
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA`

## 📝 Nota sobre as novas API Keys

O Supabase agora tem novos formatos de API keys:
- **Publishable key**: `sb_publishable_...` (para uso público)
- **Secret key**: `sb_secret_...` (para backend)

Mas o código atual ainda usa o formato **legacy** (anon public JWT), que é o que você deve usar:
- **anon public**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ✅ USE ESTA

## ⚠️ IMPORTANTE

- **NUNCA** use a `service_role secret` no frontend (é muito perigosa!)
- Use apenas a **anon public** key no frontend
- A `service_role` só deve ser usada em backends seguros

## 🔧 Próximos Passos

1. Crie o arquivo `.env.local` com as credenciais acima
2. Reinicie o servidor (`npm run dev`)
3. Tente fazer login novamente
