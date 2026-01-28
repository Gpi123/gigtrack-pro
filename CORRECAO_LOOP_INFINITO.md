# 🔧 Correção do Loop Infinito de fetchUserBands

## 🐛 Problema Identificado

Quando alternava para a agenda da banda, o sistema entrava em um **loop infinito** de chamadas de `fetchUserBands`:

```
🔍 [PERF] fetchUserBands INICIADO
🔍 [PERF] fetchUserBands INICIADO  ← Duplicado!
🔍 [PERF] fetchUserBands INICIADO  ← Triplicado!
... (repetindo infinitamente)
```

**Causa Raiz**: 
1. O cache de bandas estava sendo invalidado desnecessariamente
2. Múltiplas chamadas simultâneas não estavam sendo bloqueadas corretamente
3. O `useEffect` de verificação de banda estava disparando loops

## ✅ Correções Aplicadas

### 1. **Melhorias no Cache de Bandas** (`services/bandsCache.ts`)

**Mudanças**:
- ✅ Aumentado cache de 10s para **30s** (reduz chamadas)
- ✅ Adicionado flag `isRefreshing` para evitar múltiplas requisições
- ✅ Melhor proteção contra chamadas simultâneas
- ✅ Logs adicionais para debug
- ✅ Fallback para retornar cache expirado se necessário

**Código**:
```typescript
// Agora verifica se está em refresh antes de criar nova requisição
if (!bandsCache.isRefreshing || forceRefresh) {
  bandsCache.isRefreshing = true;
  // ... criar requisição
}
```

### 2. **Correção no refreshBandsCache** (`App.tsx`)

**Problema**: `refreshBandsCache` estava invalidando o cache sempre, causando loops.

**Solução**:
- ✅ Adicionado parâmetro `forceRefresh` (padrão: `false`)
- ✅ Cache não é mais invalidado automaticamente
- ✅ `useEffect` carrega bandas apenas uma vez (com `hasLoadedBands` ref)

**Código**:
```typescript
const refreshBandsCache = useCallback(async (forceRefresh = false) => {
  // Não invalidar automaticamente - deixar o cache funcionar
  const userBands = await getCachedUserBands(user.id, forceRefresh);
  setBandsCache(userBands);
}, [user]);
```

### 3. **Proteção no useEffect de Verificação de Banda**

**Mudanças**:
- ✅ Delay inicial de 2s antes de verificar (evita conflito com loadGigs)
- ✅ Intervalo aumentado de 15s para **30s** (reduz carga)
- ✅ Melhor proteção contra múltiplas verificações
- ✅ Limpa intervalo quando banda não existe mais

### 4. **Atualização de Callbacks**

**Mudanças**:
- ✅ `onBandsCacheUpdate` agora aceita `forceRefresh` como parâmetro
- ✅ Apenas operações que modificam bandas forçam refresh:
  - Criar banda → `forceRefresh = true`
  - Editar banda → `forceRefresh = true`
  - Deletar banda → `forceRefresh = true`
- ✅ Verificações periódicas → `forceRefresh = false` (usa cache)

## 📊 Resultado Esperado

### Antes (Loop Infinito):
```
🔍 fetchUserBands INICIADO
🔍 fetchUserBands INICIADO  ← Loop!
🔍 fetchUserBands INICIADO  ← Loop!
... (infinito)
```

### Depois (Com Cache):
```
🔍 fetchUserBands INICIADO (primeira vez)
✅ fetchUserBands CONCLUÍDO - 800ms
💾 getCachedUserBands - Retornando do cache (0ms) ← Próximas chamadas
💾 getCachedUserBands - Retornando do cache (0ms) ← Próximas chamadas
```

## 🎯 Como Testar

1. **Recarregue a página** (F5)
2. **Abra o console** (F12) e filtre por `[PERF]`
3. **Alternar para banda** (pessoal → banda)
4. **Verificar logs**:
   - ✅ Deve ver apenas **1 chamada** de `fetchUserBands`
   - ✅ Próximas chamadas devem mostrar "Retornando do cache"
   - ✅ Não deve haver loops infinitos

## ⚠️ Se Ainda Houver Problemas

Se ainda houver loops, verifique:

1. **Console logs**: Procure por múltiplas chamadas de `fetchUserBands INICIADO` com timestamps muito próximos
2. **useEffect**: Verifique se algum `useEffect` está disparando múltiplas vezes
3. **Cache**: Verifique se o cache está sendo invalidado desnecessariamente

### Debug Adicional:

Adicione este log temporário no `bandsCache.ts`:
```typescript
console.log('🔍 [DEBUG] getCachedUserBands chamado', {
  hasCache: bandsCache.bands.length > 0,
  cacheAge: Date.now() - bandsCache.timestamp,
  isRefreshing: bandsCache.isRefreshing,
  hasPromise: !!bandsCache.promise,
  forceRefresh
});
```

---

**💡 Nota**: O cache agora é mais "agressivo" (30s) para evitar loops, mas ainda invalida quando necessário (após criar/editar/deletar bandas).
