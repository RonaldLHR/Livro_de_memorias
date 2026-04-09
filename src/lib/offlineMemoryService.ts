import type { MemoryAudio, MemoryEntry, MemoryPhoto } from '../types'
import { normalizeImageFiles } from './imageNormalization'

export type MemoryFormInput = {
  title: string
  happenedAt: string
  relatoDoDia: string
  author: 'Ronald' | 'Suellen'
  photos: File[]
  audio?: MemoryAudio
  audioFile?: File | null
}

export type UploadProgressCallback = (progress: number) => void

const STORAGE_KEY = 'nosso-livro-memorias-offline'

interface OfflineMemory {
  id: string
  title: string
  author: 'Ronald' | 'Suellen'
  happenedAt: string
  createdAt: string
  relatoDoDia: string
  photos: MemoryPhoto[]
  audio?: MemoryAudio
  timestamp: number
}

function getStoredMemories(): OfflineMemory[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveMemories(memories: OfflineMemory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories))
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function publishMemory(
  input: MemoryFormInput,
  onProgress?: UploadProgressCallback
): Promise<MemoryEntry> {
  const memoryId = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  onProgress?.(10)

  // Process and convert images to base64
  const normalizedFiles = await normalizeImageFiles(input.photos)
  const photos: MemoryPhoto[] = []

  for (let i = 0; i < normalizedFiles.length; i++) {
    const base64 = await blobToBase64(normalizedFiles[i])
    photos.push({
      id: `${memoryId}-${i}`,
      url: base64,
      alt: input.photos[i].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    })
    onProgress?.(Math.round(10 + ((i + 1) / normalizedFiles.length) * 40))
  }

  // Process audio if present
  let audio: MemoryAudio | undefined
  if (input.audioFile) {
    onProgress?.(60)
    const base64 = await blobToBase64(input.audioFile)
    audio = {
      url: base64,
      kind: input.audio?.kind || 'mp3',
    }
  } else if (input.audio) {
    // Se não houver arquivo mas houver Spotify ou outro link de áudio
    audio = input.audio
  }

  onProgress?.(80)

  const happenedAt = new Date(input.happenedAt).toISOString()

  // Create memory object
  const offlineMemory: OfflineMemory = {
    id: memoryId,
    title: input.title,
    author: input.author,
    happenedAt,
    createdAt: new Date().toISOString(),
    timestamp: new Date(input.happenedAt).getTime(),
    relatoDoDia: input.relatoDoDia,
    photos,
    audio,
  }

  // Save to localStorage
  const memories = getStoredMemories()
  memories.push(offlineMemory)
  memories.sort((a, b) => b.timestamp - a.timestamp)
  saveMemories(memories)

  onProgress?.(100)
  
  // Return as MemoryEntry
  return {
    id: offlineMemory.id,
    title: offlineMemory.title,
    author: offlineMemory.author,
    happenedAt: offlineMemory.happenedAt,
    createdAt: offlineMemory.createdAt,
    relatoDoDia: offlineMemory.relatoDoDia,
    photos: offlineMemory.photos,
    audio: offlineMemory.audio,
  }
}

export async function updateMemory(
  memoryId: string,
  input: MemoryFormInput,
  previous?: MemoryEntry,
  onProgress?: UploadProgressCallback
): Promise<MemoryEntry> {
  onProgress?.(10)

  const memories = getStoredMemories()
  const index = memories.findIndex((m) => m.id === memoryId)

  if (index === -1) {
    throw new Error(`Memória ${memoryId} não encontrada`)
  }

  // Process new images if provided
  let photos = memories[index].photos
  if (input.photos.length > 0) {
    const normalizedFiles = await normalizeImageFiles(input.photos)
    photos = []

    for (let i = 0; i < normalizedFiles.length; i++) {
      const base64 = await blobToBase64(normalizedFiles[i])
      photos.push({
        id: `${memoryId}-${i}`,
        url: base64,
        alt: input.photos[i].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
      })
      onProgress?.(Math.round(10 + ((i + 1) / normalizedFiles.length) * 40))
    }
  }

  // Process new audio if provided
  let audio = memories[index].audio
  if (input.audioFile) {
    onProgress?.(60)
    const base64 = await blobToBase64(input.audioFile)
    audio = {
      url: base64,
      kind: input.audio?.kind || 'mp3',
    }
  } else if (input.audio) {
    // Se não houver arquivo novo mas houver Spotify ou outro link
    audio = input.audio
  }

  onProgress?.(80)

  const happenedAt = new Date(input.happenedAt).toISOString()

  // Update memory
  memories[index] = {
    ...memories[index],
    title: input.title,
    author: input.author,
    happenedAt,
    timestamp: new Date(input.happenedAt).getTime(),
    relatoDoDia: input.relatoDoDia,
    photos,
    audio,
  }

  memories.sort((a, b) => b.timestamp - a.timestamp)
  saveMemories(memories)

  onProgress?.(100)
  
  const updated = memories[index]
  return {
    id: updated.id,
    title: updated.title,
    author: updated.author,
    happenedAt: updated.happenedAt,
    createdAt: updated.createdAt,
    relatoDoDia: updated.relatoDoDia,
    photos: updated.photos,
    audio: updated.audio,
  }
}

export async function deleteMemory(memoryId: string): Promise<void> {
  const memories = getStoredMemories()
  const filtered = memories.filter((m) => m.id !== memoryId)
  saveMemories(filtered)
}

export async function getAllMemories(): Promise<MemoryEntry[]> {
  const memories = getStoredMemories()
  return memories
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((m) => ({
      id: m.id,
      title: m.title,
      author: m.author,
      happenedAt: m.happenedAt,
      createdAt: m.createdAt,
      relatoDoDia: m.relatoDoDia,
      photos: m.photos,
      audio: m.audio,
    }))
}

export async function runRuntimeDiagnostics(): Promise<string[]> {
  try {
    // Test localStorage write
    const testKey = 'offline-test'
    localStorage.setItem(testKey, 'test')
    const stored = localStorage.getItem(testKey)
    localStorage.removeItem(testKey)

    const success = stored === 'test'
    return success
      ? ['Modo Offline: localStorage funcionando corretamente.', 'Memórias sendo salvas localmente no navegador.']
      : ['Erro: localStorage não está funcionando.']
  } catch (error) {
    return [`Erro ao testar localStorage: ${String(error)}`]
  }
}
