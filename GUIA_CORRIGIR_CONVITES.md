# 🔧 Guia para Corrigir Erros 403 ao Convidar Usuários

## ⚠️ Problema
Erros 403 (Forbidden) ao tentar criar ou visualizar convites de banda.

## ✅ Solução

Execute esta migração SQL no Supabase SQL Editor:

```sql
-- ============================================
-- REMOVER TODAS AS POLÍTICAS ANTIGAS
-- ============================================
DROP POLICY IF EXISTS "Users can view invites for their bands" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can create invites" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can update invites" ON public.band_invites;
DROP POLICY IF EXISTS "Owners and admins can delete invites" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_select_policy" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_insert_policy" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_update_policy" ON public.band_invites;
DROP POLICY IF EXISTS "band_invites_delete_policy" ON public.band_invites;

-- ============================================
-- CRIAR POLÍTICAS SIMPLES E DIRETAS
-- ============================================

-- SELECT: Ver convites
CREATE POLICY "band_invites_select"
  ON public.band_invites FOR SELECT
  USING (
    -- É owner da banda
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE id = band_invites.band_id AND owner_id = auth.uid()
    )
    -- OU é admin/member da banda
    OR EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = band_invites.band_id 
      AND user_id = auth.uid()
    )
    -- OU criou o convite
    OR invited_by = auth.uid()
    -- OU o email corresponde ao usuário logado
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- INSERT: Criar convites
CREATE POLICY "band_invites_insert"
  ON public.band_invites FOR INSERT
  WITH CHECK (
    -- É owner da banda
    (
      EXISTS (
        SELECT 1 FROM public.bands
        WHERE id = band_invites.band_id AND owner_id = auth.uid()
      )
      -- OU é admin da banda
      OR EXISTS (
        SELECT 1 FROM public.band_members
        WHERE band_id = band_invites.band_id 
        AND user_id = auth.uid() 
        AND role IN ('owner', 'admin')
      )
    )
    -- E invited_by DEVE ser o usuário atual
    AND invited_by = auth.uid()
  );

-- UPDATE: Atualizar convites
CREATE POLICY "band_invites_update"
  ON public.band_invites FOR UPDATE
  USING (
    -- É owner da banda
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE id = band_invites.band_id AND owner_id = auth.uid()
    )
    -- OU é admin da banda
    OR EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = band_invites.band_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
    -- OU criou o convite
    OR invited_by = auth.uid()
  );

-- DELETE: Deletar convites
CREATE POLICY "band_invites_delete"
  ON public.band_invites FOR DELETE
  USING (
    -- É owner da banda
    EXISTS (
      SELECT 1 FROM public.bands
      WHERE id = band_invites.band_id AND owner_id = auth.uid()
    )
    -- OU é admin da banda
    OR EXISTS (
      SELECT 1 FROM public.band_members
      WHERE band_id = band_invites.band_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );
```

## 📋 Passo a Passo

1. Abra o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Clique em **New Query**
4. Cole o SQL acima
5. Clique em **Run** (ou pressione Ctrl+Enter)
6. Aguarde a confirmação de sucesso
7. **Recarregue a página** da aplicação
8. Tente convidar um usuário novamente

## ✅ Verificação

Após executar, você deve conseguir:
- ✅ Criar convites (POST não deve mais dar 403)
- ✅ Ver convites pendentes (GET não deve mais dar 403)
- ✅ Atualizar status de convites
- ✅ Deletar convites

## 🔍 Se ainda não funcionar

1. Verifique se você está logado
2. Verifique se você é owner ou admin da banda
3. Verifique o console do navegador para erros específicos
4. Tente fazer logout e login novamente
