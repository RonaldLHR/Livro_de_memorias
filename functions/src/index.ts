import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineString } from 'firebase-functions/params'

initializeApp()

const webhookUrl = defineString('WEBHOOK_URL')
const webhookSecret = defineString('WEBHOOK_SECRET')

export const notifyOnNewMemory = onDocumentCreated('memories/{memoryId}', async (event) => {
  const data = event.data?.data()

  if (!data) {
    return
  }

  const payload = {
    title: data.title ?? 'Nova memória',
    happenedAt: data.happenedAt ?? null,
    author: data.author ?? 'desconhecido',
    memoryId: event.params.memoryId,
    message: 'Uma nova memória foi publicada no Nosso Livro de Memórias.',
  }

  const response = await fetch(webhookUrl.value(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-secret': webhookSecret.value(),
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Webhook failed with status ${response.status}`)
  }
})

export const syncRecentMemories = onDocumentCreated('memories/{memoryId}', async (event) => {
  const data = event.data?.data()

  if (!data) {
    return
  }

  const db = getFirestore()
  await db.collection('notifications').add({
    type: 'memory-created',
    memoryId: event.params.memoryId,
    createdAt: new Date().toISOString(),
    title: data.title ?? '',
    author: data.author ?? '',
  })
})
