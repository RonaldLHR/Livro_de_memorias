# Estrutura NoSQL no Firestore

## Coleção principal: `memories`

Cada documento representa uma memória da linha do tempo.

```json
{
  "title": "Nosso primeiro pôr do sol",
  "happenedAt": "2024-02-19",
  "createdAt": "2024-02-19T22:00:00.000Z",
  "relatoDoDia": "Texto em Markdown do que aconteceu.",
  "author": "Suellen",
  "photos": [
    {
      "id": "photo_1",
      "url": "https://firebasestorage.googleapis.com/...",
      "alt": "descrição da foto"
    }
  ],
  "audio": {
    "kind": "spotify",
    "url": "https://open.spotify.com/embed/track/..."
  }
}
```

## Campos recomendados

- `title`: string obrigatória.
- `happenedAt`: string no formato ISO `YYYY-MM-DD`.
- `createdAt`: timestamp ISO para ordenação interna.
- `relatoDoDia`: string com Markdown ou rich text serializado.
- `author`: `Ronald` ou `Suellen`.
- `photos`: array de imagens armazenadas no Firebase Storage.
- `audio.kind`: `spotify` ou `mp3`.
- `audio.url`: link embed do Spotify ou URL pública do MP3.

## Subcoleções opcionais

### `memories/{memoryId}/comments`
Pode ser usada futuramente para comentários privados do casal.

### `users`
Se preferir controle de acesso por metadados, mantenha uma coleção com perfis autenticados e claims.

## Ordenação da linha do tempo

Ordenar por:
1. `happenedAt` desc
2. `createdAt` desc como fallback

## Índices sugeridos

- `memories` com `happenedAt` desc
- `memories` com `createdAt` desc
