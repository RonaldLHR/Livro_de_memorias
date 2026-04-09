# Conexão do Firebase Storage

## 1) Criar o projeto

No Firebase Console:
1. Crie um projeto novo.
2. Ative Authentication.
3. Ative Firestore Database.
4. Ative Storage.

## 2) Configurar o app web

Copie as credenciais para o arquivo `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 3) Estrutura de pastas no Storage

Use uma convenção simples:

- `memories/{memoryId}/cover.jpg`
- `memories/{memoryId}/photo-1.jpg`
- `memories/{memoryId}/photo-2.jpg`
- `memories/{memoryId}/audio.mp3`

## 4) Upload com o SDK

Fluxo recomendado:

1. Selecionar arquivos no formulário.
2. Gerar um `memoryId` antes do upload.
3. Fazer upload das imagens para `memories/{memoryId}/...`.
4. Recuperar o download URL de cada arquivo.
5. Salvar o documento no Firestore com as URLs retornadas.

## 5) Regras de acesso

O arquivo [storage.rules](../storage.rules) já contém uma base restritiva para edição apenas por Ronald e Suellen usando o email autenticado.

## 6) Exemplo de envio de imagem

No frontend, o fluxo usa:

- `uploadBytesResumable`
- `getDownloadURL`
- gravação do documento no Firestore após o upload

## 7) Boas práticas

- Compressão de imagens antes do upload.
- Geração de thumbnails para a timeline.
- Limite de tamanho por arquivo.
- Validação de MIME type (`image/*`, `audio/mpeg`).

## 8) Configuração do painel

O formulário principal suporta:

- múltiplas fotos
- link do Spotify
- upload de MP3
- autenticação por email permitido
