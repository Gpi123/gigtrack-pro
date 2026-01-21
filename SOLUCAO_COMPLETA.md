# 🚀 Solução Completa - Passo a Passo

## ⚠️ Problema Atual

Você está vendo a tela de login do Google, mas há erros porque as variáveis de ambiente não estão configuradas localmente.

## ✅ Solução Passo a Passo

### PASSO 1: Criar arquivo `.env.local`

1. Na raiz do projeto (mesma pasta onde está o `package.json`), crie um arquivo chamado `.env.local`

2. Cole exatamente este conteúdo:

```env
VITE_SUPABASE_URL=https://aphwcgywzcgeeykmrxua.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaHdjZ3l3emNnZWV5a21yeHVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwMDA4ODEsImV4cCI6MjA4NDU3Njg4MX0.CBZZYtrI_tW_gL98wXYtad5I2EMSeA0ZpZTvgqyIzZA
```

3. **Salve o arquivo**

### PASSO 2: Reiniciar o servidor

1. No terminal onde está rodando `npm run dev`, pressione **Ctrl+C** para parar
2. Execute novamente:
   ```bash
   npm run dev
   ```

### PASSO 3: Verificar se funcionou

1. Abra o console do navegador (F12)
2. Você **NÃO** deve mais ver o erro "Supabase credentials not configured"
3. Se ainda aparecer, verifique:
   - O arquivo está na raiz do projeto?
   - O nome está exatamente `.env.local` (com o ponto no início)?
   - Você reiniciou o servidor após criar o arquivo?

### PASSO 4: Fazer login

1. Clique em "Entrar com Google"
2. Escolha sua conta Google
3. Autorize o acesso
4. Você será redirecionado de volta
5. ✅ Deve funcionar!

## 🔍 Se ainda não funcionar

### Verificar se o arquivo foi criado corretamente:

1. No terminal, execute:
   ```bash
   cat .env.local
   ```
   (ou no Windows PowerShell: `Get-Content .env.local`)

2. Você deve ver as duas linhas com as variáveis

### Verificar se o Vite está lendo:

1. No console do navegador, digite:
   ```javascript
   console.log(import.meta.env.VITE_SUPABASE_URL)
   ```
2. Deve mostrar: `https://aphwcgywzcgeeykmrxua.supabase.co`

## 📋 Checklist

- [ ] Arquivo `.env.local` criado na raiz do projeto
- [ ] Conteúdo copiado corretamente (2 linhas)
- [ ] Servidor reiniciado após criar o arquivo
- [ ] Console do navegador não mostra mais erros de credenciais
- [ ] Login com Google funciona

---

**Crie o arquivo `.env.local` agora e reinicie o servidor!** 🚀
