# 🔑 Como Criar Personal Access Token no GitHub

## Passo a Passo Detalhado

### 1. Acessar Developer Settings

Na página de **Settings** que você está vendo:

1. **Role a página até o final** da barra lateral esquerda
2. Procure por **"Developer settings"** (é a última opção na lista)
3. Clique em **"Developer settings"**

### 2. Criar o Token

Depois de clicar em "Developer settings":

1. No menu lateral esquerdo, clique em **"Personal access tokens"**
2. Clique em **"Tokens (classic)"** (ou "Fine-grained tokens" se preferir, mas classic é mais simples)
3. Clique no botão **"Generate new token"** → **"Generate new token (classic)"**

### 3. Configurar o Token

Preencha o formulário:

- **Note**: Digite algo como `GigTrack Pro` ou `Meu Computador`
- **Expiration**: Escolha uma data (ex: 90 dias ou "No expiration" se quiser que não expire)
- **Scopes**: Marque apenas a opção **`repo`** (isso dá acesso completo aos repositórios)
  - Isso vai marcar automaticamente: repo:status, repo_deployment, public_repo, repo:invite, security_events

4. Role até o final e clique em **"Generate token"** (botão verde)

### 5. Copiar o Token

⚠️ **IMPORTANTE**: O token será mostrado apenas UMA VEZ!
- Copie o token imediatamente
- Salve em um local seguro (você não conseguirá vê-lo novamente)

O token vai parecer algo assim: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Alternativa: Link Direto

Se preferir, acesse diretamente:
**https://github.com/settings/tokens**

Depois clique em **"Generate new token"** → **"Generate new token (classic)"**

---

## Depois de Criar o Token

Execute no terminal:

```bash
git push -u origin main
```

Quando pedir credenciais:
- **Username**: `Gpi123`
- **Password**: Cole o token que você copiou (não use sua senha do GitHub)

---

## Dica

Se você não encontrar "Developer settings", tente este caminho alternativo:

1. Clique no seu avatar (canto superior direito)
2. Clique em **"Settings"**
3. Role até o final da barra lateral esquerda
4. Clique em **"Developer settings"**
