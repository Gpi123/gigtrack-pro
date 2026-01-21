# 🚀 Guia: Enviar Projeto para GitHub

Este guia vai te ajudar a enviar seu projeto para o GitHub e configurar deploys automáticos.

## 📋 Pré-requisitos

- Conta no [GitHub](https://github.com)
- Git instalado (já está instalado se você conseguiu executar os comandos anteriores)

## 🔧 Passo a Passo

### 1. Criar Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito → **"New repository"**
3. Preencha os dados:
   - **Repository name**: `gigtrack-pro` (ou o nome que preferir)
   - **Description**: "Agenda de shows para músicos com Supabase e autenticação Google"
   - **Visibility**: Escolha **Public** ou **Private**
   - ⚠️ **NÃO** marque "Initialize this repository with a README" (já temos arquivos)
4. Clique em **"Create repository"**

### 2. Conectar Repositório Local ao GitHub

Após criar o repositório, o GitHub vai mostrar uma página com instruções. Você vai precisar do **URL do seu repositório** (algo como `https://github.com/seu-usuario/gigtrack-pro.git`).

Execute os seguintes comandos no terminal (substitua `seu-usuario` e `gigtrack-pro` pelos valores corretos):

```bash
# Adicionar o repositório remoto
git remote add origin https://github.com/seu-usuario/gigtrack-pro.git

# Renomear branch para main (padrão do GitHub)
git branch -M main

# Enviar código para o GitHub
git push -u origin main
```

### 3. Autenticação no GitHub

Se for a primeira vez que você usa Git no seu computador, pode ser necessário configurar suas credenciais:

```bash
# Configurar seu nome
git config --global user.name "Seu Nome"

# Configurar seu email (use o mesmo do GitHub)
git config --global user.email "seu-email@exemplo.com"
```

**Se o GitHub pedir autenticação ao fazer push:**

- **Opção 1**: Use um Personal Access Token (recomendado)
  1. Vá em GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
  2. Clique em "Generate new token"
  3. Dê um nome e selecione os escopos: `repo` (acesso completo aos repositórios)
  4. Copie o token gerado
  5. Quando o Git pedir senha, use o token ao invés da senha

- **Opção 2**: Use GitHub CLI (`gh auth login`)

### 4. Verificar se Funcionou

1. Recarregue a página do seu repositório no GitHub
2. Você deve ver todos os arquivos do projeto lá
3. O README.md deve aparecer formatado na página inicial

## 🔄 Comandos Git Úteis para o Futuro

```bash
# Ver status dos arquivos modificados
git status

# Adicionar todos os arquivos modificados
git add .

# Fazer commit das mudanças
git commit -m "Descrição das mudanças"

# Enviar para o GitHub
git push

# Ver histórico de commits
git log

# Criar uma nova branch
git checkout -b nome-da-branch

# Voltar para a branch main
git checkout main
```

## 🚀 Próximos Passos

Após enviar para o GitHub, você pode:

1. **Configurar Deploy Automático no Netlify**:
   - Conecte seu repositório GitHub ao Netlify
   - Configure as variáveis de ambiente
   - Cada push na branch `main` vai fazer deploy automático

2. **Configurar Deploy Automático no Render** (se precisar de backend):
   - Conecte seu repositório GitHub ao Render
   - Configure o serviço

3. **Proteger a Branch Main** (opcional):
   - No GitHub, vá em Settings → Branches
   - Adicione uma regra para proteger a branch `main`
   - Isso força uso de Pull Requests para mudanças

## ⚠️ Importante

- **Nunca** faça commit do arquivo `.env` (já está no .gitignore)
- **Sempre** faça commit antes de fazer push
- Use mensagens de commit descritivas

## 🆘 Problemas Comuns

### Erro: "remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/seu-usuario/gigtrack-pro.git
```

### Erro: "failed to push some refs"
```bash
git pull origin main --rebase
git push -u origin main
```

### Esqueceu de adicionar arquivo ao commit
```bash
git add arquivo-esquecido.ts
git commit --amend --no-edit
git push --force-with-lease
```

---

**Pronto!** Seu código está no GitHub e pronto para deploys automáticos! 🎉
