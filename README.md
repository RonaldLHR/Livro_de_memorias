# Nosso Livro de Memórias

Site dinâmico para Suellen e Ronald, com linha do tempo eterna, cards com fotos, música contextual e painel privado de publicação.

## Stack

- React + TypeScript
- Tailwind CSS
- Framer Motion
- Firebase Auth
- Firestore
- Firebase Storage
- Firebase Functions para webhook

## Estrutura principal

- `src/App.tsx`: página principal com hero, painel e timeline.
- `src/components/TimelineCard.tsx`: card de memória com fotos, markdown e áudio.
- `src/components/AdminPanel.tsx`: formulário de publicação.
- `src/lib/firebase.ts`: conexão com Firebase.
- `src/lib/mockMemories.ts`: dados iniciais para protótipo.

## Como rodar

1. Instale as dependências.
2. Copie `.env.example` para `.env`.
3. Preencha as variáveis do Firebase.
4. Execute o projeto com Vite.

## Configuração do Firebase

Veja o guia completo em [docs/firebase-setup.md](docs/firebase-setup.md).

## Modelo de dados

Veja [docs/database-schema.md](docs/database-schema.md).

## Storage

Veja [docs/firebase-storage.md](docs/firebase-storage.md).

## Notificações automáticas

Veja [docs/notification-webhook.md](docs/notification-webhook.md).

## Próximos passos para produção

- Criar Firebase Functions para notificação automática.
- Configurar `WEBHOOK_URL` e `WEBHOOK_SECRET`.
- Substituir os emails de exemplo no `.env` pelos reais.
- Publicar as regras do Firestore e do Storage.
