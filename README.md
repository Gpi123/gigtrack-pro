<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GigTrack Pro - Agenda de Shows para Músicos

Aplicação web para gerenciar shows e eventos musicais com sincronização em nuvem via Supabase e autenticação Google.

## 🚀 Funcionalidades

- ✅ Gerenciamento completo de shows/eventos
- ✅ Controle financeiro (valores recebidos e pendentes)
- ✅ Visualização em calendário
- ✅ Filtros por período
- ✅ Autenticação via Google OAuth
- ✅ Sincronização em tempo real com Supabase
- ✅ Insights com IA (Gemini)
- ✅ Exportação de backup

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase
- Conta no Google Cloud Console (para OAuth)
- Chave da API Gemini (opcional, para insights)

## 🛠️ Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/gigtrack-pro.git
cd gigtrack-pro
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env`
   - Preencha com suas credenciais do Supabase e Gemini

4. Execute o projeto:
```bash
npm run dev
```

## 📚 Configuração Completa

Para configurar o projeto completo (Supabase, OAuth Google, Deploy), consulte o arquivo **[SETUP.md](./SETUP.md)** que contém um guia passo a passo detalhado.

## 🏗️ Estrutura do Projeto

```
├── components/          # Componentes React
│   ├── AuthModal.tsx   # Modal de autenticação
│   ├── CalendarView.tsx # Visualização em calendário
│   ├── GigList.tsx     # Lista de shows
│   ├── GigModal.tsx    # Modal de criação/edição
│   └── ...
├── services/           # Serviços e lógica de negócio
│   ├── supabase.ts     # Cliente Supabase
│   ├── authService.ts  # Autenticação
│   ├── gigService.ts   # CRUD de shows
│   └── ...
├── supabase/
│   └── migrations/     # Scripts SQL de migração
└── ...
```

## 🔐 Variáveis de Ambiente

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

## 📦 Deploy

### Netlify (Frontend)

1. Conecte seu repositório GitHub ao Netlify
2. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Adicione as variáveis de ambiente
3. Faça o deploy!

### Supabase (Banco de Dados)

Execute o script SQL em `supabase/migrations/001_initial_schema.sql` no SQL Editor do Supabase.

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção

## 🗄️ Banco de Dados

O projeto usa Supabase (PostgreSQL) com as seguintes tabelas:

- **profiles**: Perfis de usuários
- **gigs**: Shows/eventos dos usuários

Todas as tabelas têm Row Level Security (RLS) habilitado para garantir que cada usuário acesse apenas seus próprios dados.

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

## 📄 Licença

Este projeto está sob a licença MIT.

---

**Desenvolvido com ❤️ para músicos**
