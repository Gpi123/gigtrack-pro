# 🔍 Guia de Debug de Performance

## 📊 Logs Adicionados

Adicionei logs detalhados de performance em todas as operações críticas. Todos os logs começam com `[PERF]` para facilitar a filtragem.

## 🎯 Como Usar os Logs

### 1. Abrir o Console do Navegador

1. Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux) ou `Cmd+Option+I` (Mac)
2. Vá na aba **Console**
3. Filtre por `[PERF]` para ver apenas os logs de performance

### 2. Reproduzir o Problema

1. **Limpe o console** (botão de limpar ou `Ctrl+L`)
2. **Alternar entre agendas** (pessoal → banda ou vice-versa)
3. **Copie todos os logs** que aparecerem (selecione tudo e copie)

### 3. O que Procurar nos Logs

#### ✅ Logs Normais (Boa Performance)

```
🚀 [PERF] loadGigs INICIADO
🔄 [PERF] useEffect [selectedBandId, user] DISPARADO
🔍 [PERF] fetchGigs INICIADO
📊 [PERF] Query gigs por banda - 15.23ms
✅ [PERF] fetchGigs CONCLUÍDO - Total: 25.45ms
✅ [PERF] loadGigs CONCLUÍDO - Total: 30.12ms
```

#### ⚠️ Logs de Problema (Performance Ruim)

```
📊 [PERF] Query gigs por banda - 500.23ms  ← MUITO LENTO!
👥 [PERF] Step 2 - fetchUserBands - 1200.45ms  ← MUITO LENTO!
```

## 📋 Estrutura dos Logs

### 1. **loadGigs** (App.tsx)
- Mede o tempo total de carregamento de shows
- Breakdown: fetch, setGigs, total

### 2. **fetchGigs** (gigService.ts)
- Mede o tempo de cada query ao banco
- Breakdown por etapa:
  - Auth.getUser()
  - Query de gigs pessoais
  - fetchUserBands()
  - Query de gigs de bandas
  - Ordenação

### 3. **fetchUserBands** (bandService.ts)
- Mede o tempo de buscar bandas do usuário
- Breakdown:
  - Auth.getUser()
  - Query bandas próprias
  - Query bandas como membro
  - Combinação e ordenação

### 4. **useEffect** (App.tsx)
- Mede quando o efeito é disparado
- Detecta mudanças de agenda

### 5. **AgendaSelector.loadBands**
- Mede o carregamento de bandas no seletor

## 🔍 Análise de Problemas Comuns

### Problema 1: Query ao Banco Lenta (>200ms)

**Sintoma:**
```
📊 [PERF] Query gigs por banda - 500.23ms
```

**Possíveis Causas:**
- ❌ Índices não foram aplicados no Supabase
- ❌ Muitos dados na tabela sem índices
- ❌ Problema de rede/latência

**Solução:**
1. Verificar se a migration `015_optimize_performance_indexes.sql` foi executada
2. Verificar índices no Supabase: SQL Editor → `SELECT * FROM pg_indexes WHERE tablename = 'gigs';`

### Problema 2: fetchUserBands Lento (>300ms)

**Sintoma:**
```
👥 [PERF] Step 2 - fetchUserBands - 800.45ms
```

**Possíveis Causas:**
- ❌ Muitas bandas do usuário
- ❌ Query de band_members lenta
- ❌ Join com bands lento

**Solução:**
- Verificar se há índices em `band_members` e `bands`
- Verificar quantas bandas o usuário tem

### Problema 3: Múltiplas Chamadas

**Sintoma:**
```
🚀 [PERF] loadGigs INICIADO
🚀 [PERF] loadGigs INICIADO  ← Duplicado!
🚀 [PERF] loadGigs INICIADO  ← Triplicado!
```

**Possíveis Causas:**
- ❌ useEffect disparando múltiplas vezes
- ❌ Componente re-renderizando

**Solução:**
- Verificar dependências do useEffect
- Verificar se há chamadas manuais de loadGigs

### Problema 4: setGigs() Lento (>50ms)

**Sintoma:**
```
💾 [PERF] setGigs() - 150.23ms
```

**Possíveis Causas:**
- ❌ Muitos componentes re-renderizando
- ❌ Cálculos pesados em useMemo/useEffect
- ❌ Lista muito grande

**Solução:**
- Verificar componentes que dependem de `gigs`
- Verificar se há cálculos pesados (filtros, ordenação)

## 📊 Tempos Esperados

| Operação | Tempo Esperado | Tempo Aceitável | Tempo Ruim |
|----------|----------------|-----------------|------------|
| **Query simples** (1 banda) | 10-30ms | 30-100ms | >100ms |
| **Query pessoal** | 15-40ms | 40-150ms | >150ms |
| **fetchUserBands** | 20-50ms | 50-200ms | >200ms |
| **loadGigs total** | 30-80ms | 80-300ms | >300ms |
| **setGigs()** | 1-5ms | 5-20ms | >20ms |

## 🚀 Como Enviar os Logs

1. **Abra o console** (F12)
2. **Limpe o console** (Ctrl+L)
3. **Reproduza o problema** (alternar entre agendas)
4. **Selecione todos os logs** (Ctrl+A no console)
5. **Copie** (Ctrl+C)
6. **Cole aqui** ou envie para análise

### Formato Esperado:

```
🚀 [PERF] loadGigs INICIADO {silent: false, selectedBandId: "...", ...}
🔄 [PERF] useEffect [selectedBandId, user] DISPARADO {...}
🔍 [PERF] fetchGigs INICIADO - bandId: "..."
📊 [PERF] Query gigs por banda - 15.23ms
✅ [PERF] fetchGigs CONCLUÍDO - Total: 25.45ms
...
```

## 🔧 Comandos Úteis no Console

### Filtrar apenas logs de performance:
```javascript
// No console, digite:
console.log = (function(originalLog) {
  return function(...args) {
    if (args[0] && args[0].includes && args[0].includes('[PERF]')) {
      originalLog.apply(console, args);
    }
  };
})(console.log);
```

### Ver apenas tempos:
```javascript
// Copie e cole no console para ver apenas os tempos
const logs = [];
const originalLog = console.log;
console.log = function(...args) {
  if (args[0] && args[0].includes && args[0].includes('[PERF]')) {
    logs.push(args);
    originalLog.apply(console, args);
  }
};
// Depois de reproduzir o problema:
console.table(logs.filter(l => l[0].includes('Total:') || l[0].includes('ms')));
```

## 📝 Checklist de Debug

- [ ] Console aberto e limpo
- [ ] Logs filtrados por `[PERF]`
- [ ] Problema reproduzido (alternar agendas)
- [ ] Todos os logs copiados
- [ ] Tempos anotados (especialmente os >100ms)
- [ ] Verificado se índices foram aplicados no Supabase

---

**💡 Dica**: Se os tempos estiverem bons (<100ms) mas ainda parecer lento, o problema pode ser na UI (re-renders, animações, etc.). Nesse caso, verifique os logs de React DevTools.
