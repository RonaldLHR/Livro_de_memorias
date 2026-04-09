# Notificação automática via Webhook

## Objetivo

Enviar uma notificação sempre que uma nova memória for publicada.

## Opção recomendada

Use uma Cloud Function do Firebase `onCreate` na coleção `memories` para disparar um webhook para:

- Email: SendGrid, Resend ou Mailgun
- WhatsApp: Twilio, Z-API ou 360dialog

## Fluxo sugerido

1. Ronald ou Suellen publica uma memória.
2. Firestore grava o documento em `memories`.
3. Uma função server-side detecta o evento.
4. A função envia uma mensagem com o título, data e link da memória.

## Exemplo de payload

```json
{
  "title": "Nosso primeiro pôr do sol",
  "happenedAt": "2024-02-19",
  "author": "Suellen",
  "message": "Uma nova memória foi adicionada ao livro."
}
```

## Recomendação prática

Se quiser simplicidade, comece com email. Se quiser experiência mais íntima, use WhatsApp.

## Estrutura da função

- Trigger: Firestore `onDocumentCreated`
- Validação do documento
- Montagem do texto da notificação
- Requisição `POST` para o webhook externo

## Implementação base

Veja o exemplo em [functions/src/index.ts](../functions/src/index.ts).

## Variáveis de ambiente da função

Configure no Firebase Functions:

- `WEBHOOK_URL`
- `WEBHOOK_SECRET`

## Payload sugerido

```json
{
  "title": "Nosso primeiro pôr do sol",
  "happenedAt": "2024-02-19",
  "author": "Suellen",
  "memoryId": "abc123",
  "message": "Uma nova memória foi publicada no Nosso Livro de Memórias."
}
```

## Segurança

- Guarde o segredo do webhook em variáveis de ambiente.
- Nunca envie dados sensíveis para o cliente.
- Execute a integração apenas no backend.
