# Como configurar o Firebase

## 1) Criar o projeto

1. Acesse o [Firebase Console](https://console.firebase.google.com/).
2. Clique em **Add project**.
3. Dê um nome ao projeto.
4. Finalize a criação.

## 2) Registrar o app web

1. Dentro do projeto, clique em **Web**.
2. Registre o app com um nome qualquer.
3. Copie as credenciais geradas.

## 3) Configurar o arquivo `.env`

Copie o arquivo [ .env.example ](../.env.example) para `.env` e preencha:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_EDITOR_EMAIL_1=
VITE_EDITOR_EMAIL_2=
```

## 4) Ativar Authentication

1. No console do Firebase, abra **Authentication**.
2. Clique em **Get started**.
3. Habilite o método **Email/Password**.
4. Crie as contas de Ronald e Suellen com os emails reais.

## 5) Criar o Firestore

1. Abra **Firestore Database**.
2. Clique em **Create database**.
3. Escolha o modo inicial.
4. Use as regras do arquivo [firestore.rules](../firestore.rules).

Coleção principal esperada:

- `memories`

## 6) Criar o Storage

1. Abra **Storage**.
2. Clique em **Get started**.
3. Use as regras do arquivo [storage.rules](../storage.rules).

Estrutura sugerida:

- `memories/{memoryId}/photo-1.jpg`
- `memories/{memoryId}/photo-2.jpg`
- `memories/{memoryId}/audio.mp3`

## 7) Publicar as regras

Se você usa Firebase CLI:

```bash
firebase login
firebase init firestore
firebase init storage
firebase deploy --only firestore:rules,storage
```

## 8) Configurar Functions para webhook

Se for usar notificações automáticas:

1. Habilite **Functions** no projeto.
2. Defina as variáveis:
   - `WEBHOOK_URL`
   - `WEBHOOK_SECRET`
3. Veja a base em [functions/src/index.ts](../functions/src/index.ts).

## 9) Rodar localmente

Depois de preencher o `.env`:

1. Instale as dependências.
2. Execute o app com Vite.
3. Faça login com o email permitido.

## 10) Resumo rápido

Você precisa de:

- Firebase Auth ativado
- Firestore criado
- Storage criado
- emails autorizados no `.env`
- regras publicadas
- opcionalmente, Functions para webhook
