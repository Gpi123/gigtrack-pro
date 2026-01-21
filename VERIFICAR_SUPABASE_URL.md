# 🔧 Verificar Configuração do Supabase - Site URL

## ⚠️ Problema

O Supabase está redirecionando para `localhost:3000` mesmo em produção. Isso acontece porque a **Site URL** no Supabase não está configurada corretamente.

## ✅ Solução: Configurar Site URL no Supabase

### Passo a Passo:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `gigtrack-pro` (ou o nome do seu projeto)
3. No menu lateral, vá em **"Authentication"** → **"URL Configuration"**
4. Na seção **"Site URL"**, configure:
   ```
   https://moonlit-begonia-7bb328.netlify.app
   ```
5. Na seção **"Redirect URLs"**, adicione (se não tiver):
   ```
   https://moonlit-begonia-7bb328.netlify.app/**
   http://localhost:3000/**
   ```
6. Clique em **"Save"**

## 🔍 Verificar Google Cloud Console

Também verifique se o Google Cloud Console tem as URLs corretas:

1. Acesse: https://console.cloud.google.com
2. Vá em **"APIs & Services"** → **"Credentials"**
3. Clique no seu OAuth Client ID
4. Verifique se nas **"Authorized redirect URIs"** você tem:
   ```
   https://moonlit-begonia-7bb328.netlify.app
   https://aphwcgywzcgeeykmrxua.supabase.co/auth/v1/callback
   ```
5. Se não tiver, adicione e salve

## 🚀 Depois de Configurar

1. Aguarde alguns minutos para as configurações propagarem
2. Faça um novo deploy no Netlify (ou aguarde o automático)
3. Teste o login novamente

---

**O código já foi corrigido. Agora você precisa configurar a Site URL no Supabase!** 🎯
