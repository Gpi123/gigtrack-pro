# 💡 Solução Simples (Sem Configuração de Email)

Se você não quiser configurar Edge Functions agora, podemos implementar uma solução mais simples:

## Opção: Mostrar Link do Convite na Interface

Em vez de enviar email, podemos:
1. Criar o convite no banco
2. Mostrar um modal com o link do convite
3. O usuário copia e envia manualmente (WhatsApp, email, etc.)

## Implementação Rápida

Quer que eu implemente isso? É mais simples e funciona imediatamente, sem precisar configurar serviços externos.

## Ou: Usar Notificações In-App

Podemos também:
1. Criar uma tabela de notificações
2. Quando um convite é criado, criar uma notificação
3. O usuário convidado vê a notificação quando faz login
4. Pode aceitar diretamente na interface

Qual opção você prefere?
