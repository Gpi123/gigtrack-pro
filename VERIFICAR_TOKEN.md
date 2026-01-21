# ⚠️ Verificar Permissões do Token

O erro 403 geralmente significa que o token não tem as permissões corretas.

## Verificar o Token

1. Acesse: https://github.com/settings/tokens
2. Encontre o token que você criou (`GigTrack Pro` ou o nome que você deu)
3. Clique nele para ver os detalhes

## Permissões Necessárias

O token **DEVE** ter marcado:
- ✅ **`repo`** (acesso completo aos repositórios)
  - Isso inclui automaticamente: repo:status, repo_deployment, public_repo, repo:invite, security_events

## Se o Token Não Tem a Permissão `repo`

1. **Delete o token atual** (clique em "Delete")
2. **Crie um novo token**:
   - Acesse: https://github.com/settings/tokens/new
   - **Note**: `GigTrack Pro`
   - **Expiration**: Escolha uma data
   - **Scopes**: Marque **`repo`** (é a primeira opção na lista)
   - Clique em **"Generate token"**
   - Copie o novo token

## Depois de Criar o Novo Token

Execute no terminal:

```bash
# Atualizar o remote com o novo token
git remote set-url origin https://SEU_NOVO_TOKEN@github.com/Gpi123/gigtrack-pro.git

# Fazer push
git push -u origin main
```

Substitua `SEU_NOVO_TOKEN` pelo token que você acabou de criar.

---

## Alternativa: Usar SSH (Mais Seguro)

Se preferir não usar token na URL, você pode configurar SSH:

1. Gerar chave SSH: `ssh-keygen -t ed25519 -C "seu-email@exemplo.com"`
2. Adicionar a chave pública no GitHub: https://github.com/settings/keys
3. Mudar o remote para SSH: `git remote set-url origin git@github.com:Gpi123/gigtrack-pro.git`
4. Fazer push: `git push -u origin main`
