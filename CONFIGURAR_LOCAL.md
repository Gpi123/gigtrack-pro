# 🔧 Configurar Ambiente Local

## ⚠️ Erro: "Supabase credentials not configured"

Você está vendo este erro porque as variáveis de ambiente não estão configuradas localmente.

## ✅ Solução: Criar arquivo .env.local

1. Na raiz do projeto, crie um arquivo chamado `.env.local`

2. Adicione o seguinte conteúdo:

```env
VITE_SUPABASE_URL=https://aphwcgywzcgeeykmrxua.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA
```

3. **IMPORTANTE**: Reinicie o servidor de desenvolvimento após criar o arquivo:

```bash
# Pare o servidor (Ctrl+C)
# Depois inicie novamente:
npm run dev
```

## ✅ Verificar se funcionou

1. Após reiniciar, abra o console do navegador (F12)
2. Você NÃO deve mais ver o erro "Supabase credentials not configured"
3. Tente fazer login com Google novamente

## 📝 Nota

- O arquivo `.env.local` está no `.gitignore` e não será commitado
- Essas são as mesmas credenciais que você configurou no Netlify
- Em produção (Netlify), as variáveis são configuradas nas configurações do site

---

**Depois de criar o arquivo e reiniciar, tente fazer login novamente!** 🚀
