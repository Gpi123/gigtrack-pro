# 🔐 Configurar Autenticação GitHub

O Git está tentando usar credenciais de outro usuário. Vamos corrigir isso!

## Opção 1: Usar Personal Access Token (Recomendado)

### 1. Criar Personal Access Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note**: "GigTrack Pro - Local Development"
   - **Expiration**: Escolha uma data (ex: 90 dias)
   - **Scopes**: Marque apenas **`repo`** (isso dá acesso completo aos repositórios)
4. Clique em **"Generate token"**
5. **IMPORTANTE**: Copie o token imediatamente (você não verá ele novamente!)

### 2. Usar o Token ao fazer Push

Quando executar `git push`, o Git vai pedir:
- **Username**: `Gpi123`
- **Password**: Cole o token que você copiou (não use sua senha do GitHub)

### 3. Salvar Credenciais (Opcional)

Para não precisar digitar sempre:

**Windows (Git Credential Manager):**
```bash
git config --global credential.helper manager-core
```

Depois, na primeira vez que fizer push, digite o token. Ele será salvo.

## Opção 2: Usar GitHub CLI

1. Instale GitHub CLI: https://cli.github.com/
2. Execute:
```bash
gh auth login
```
3. Escolha GitHub.com → HTTPS → Login via browser
4. Depois faça o push normalmente

## Opção 3: Limpar Credenciais Antigas

Se quiser remover as credenciais antigas do Windows:

1. Abra **Painel de Controle** → **Credenciais do Windows**
2. Procure por entradas relacionadas a `github.com`
3. Remova as credenciais antigas
4. Tente fazer push novamente

## Depois de Configurar

Execute novamente:
```bash
git push -u origin main
```

Quando pedir autenticação, use:
- **Username**: `Gpi123`
- **Password**: Seu Personal Access Token (não sua senha)

---

**Dica**: Se você já tem um token configurado, pode tentar fazer push diretamente. O Git vai pedir as credenciais.
