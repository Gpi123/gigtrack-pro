# 🎸 Sistema de Bandas - Documentação

## ✅ O que foi implementado

### 1. Banco de Dados
- ✅ Tabela `bands` - Armazena informações das bandas
- ✅ Tabela `band_members` - Relaciona usuários com bandas
- ✅ Tabela `band_invites` - Gerencia convites por email
- ✅ Campo `band_id` na tabela `gigs` (NULL = pessoal, UUID = banda)
- ✅ RLS policies para acesso compartilhado seguro
- ✅ Funções PostgreSQL para verificar permissões

### 2. Serviços
- ✅ `bandService.ts` - CRUD completo de bandas, membros e convites
- ✅ `gigService.ts` - Atualizado para suportar contexto de banda

### 3. Componentes
- ✅ `BandManager.tsx` - Interface completa para gerenciar bandas
- ✅ `SideMenu.tsx` - Atualizado com BandManager

### 4. Funcionalidades
- ✅ Criar bandas
- ✅ Convidar usuários por email Google
- ✅ Alternar entre "Minha Agenda Pessoal" e "Agenda da Banda"
- ✅ Membros podem visualizar e editar shows da banda
- ✅ Gerenciar membros (adicionar/remover)
- ✅ Ver convites pendentes

## 📋 Como usar

### Passo 1: Executar Migração SQL

Execute o arquivo `supabase/migrations/004_bands_collaboration.sql` no Supabase SQL Editor.

### Passo 2: Criar uma Banda

1. Abra o menu hambúrguer (☰)
2. Na seção "Minhas Bandas", clique no botão "+"
3. Preencha o nome da banda (obrigatório) e descrição (opcional)
4. Clique em "Criar"

### Passo 3: Convidar Membros

1. Selecione a banda no menu
2. Clique em "Convidar"
3. Digite o email Google do usuário
4. O convite será enviado

### Passo 4: Aceitar Convite

Quando um usuário recebe um convite:
1. Ele precisa fazer login com o email que recebeu o convite
2. O sistema verifica automaticamente convites pendentes
3. (Futuro: adicionar notificação/interface para aceitar)

### Passo 5: Alternar entre Pessoal e Banda

1. No menu lateral, você verá:
   - "Minha Agenda Pessoal" (sempre disponível)
   - Lista de bandas que você é membro
2. Clique em uma opção para alternar o contexto
3. Todos os shows criados/visualizados serão do contexto selecionado

## 🔒 Segurança

- ✅ RLS garante que usuários só veem bandas que são membros
- ✅ Membros só podem editar shows da banda (não deletar banda)
- ✅ Apenas owners podem deletar bandas
- ✅ Convites expiram em 7 dias
- ✅ Convites são válidos apenas para o email específico

## 🚀 Próximos Passos (Opcional)

- [ ] Notificações de convites pendentes
- [ ] Interface para aceitar/rejeitar convites
- [ ] Histórico de atividades da banda
- [ ] Permissões granulares (admin, member)
- [ ] Chat/comentários nos shows da banda
