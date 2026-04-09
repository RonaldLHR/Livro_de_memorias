import { collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage, firebaseAvailable } from './firebase'
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

export type PublishMemoryInput = MemoryFormInput

export type UploadProgressCallback = (progress: number) => void

function describeError(error: unknown) {
  if (error instanceof Error && 'code' in error) {
    const withCode = error as { code?: string; message?: string }
    return `${withCode.code ?? 'erro'}${withCode.message ? ` - ${withCode.message}` : ''}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs)

    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

async function uploadPhotos(memoryId: string, files: File[], onProgress?: UploadProgressCallback): Promise<MemoryPhoto[]> {
  const activeStorage = storage

  if (!activeStorage) {
    return []
  }

  if (files.length === 0) {
    onProgress?.(100)
    return []
  }

  const normalizedFiles = await normalizeImageFiles(files)

  const uploaded: MemoryPhoto[] = []

  for (let index = 0; index < normalizedFiles.length; index += 1) {
    const normalizedFile = normalizedFiles[index]
    const fileRef = ref(activeStorage, `memories/${memoryId}/photo-${index + 1}.webp`)

    await withTimeout(uploadBytes(fileRef, normalizedFile), 60000, 'Tempo esgotado no upload da foto.')
    const url = await withTimeout(getDownloadURL(fileRef), 30000, 'Tempo esgotado ao gerar URL da foto.')

    uploaded.push({
      id: `${memoryId}-${index}`,
      url,
      alt: files[index].name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
    })

    onProgress?.(Math.round(((index + 1) / normalizedFiles.length) * 100))
  }

  return uploaded
}

async function uploadAudio(memoryId: string, file: File, onProgress?: UploadProgressCallback) {
  const activeStorage = storage

  if (!activeStorage) {
    return ''
  }

  const fileRef = ref(activeStorage, `memories/${memoryId}/audio-${file.name}`)

  await withTimeout(uploadBytes(fileRef, file), 60000, 'Tempo esgotado no upload do áudio.')
  onProgress?.(100)
  const url = await withTimeout(getDownloadURL(fileRef), 30000, 'Tempo esgotado ao gerar URL do áudio.')

  return url
}

export async function publishMemory(input: PublishMemoryInput, onUploadProgress?: UploadProgressCallback) {
  if (!firebaseAvailable || !db) {
    throw new Error('Firebase não está configurado neste ambiente.')
  }

  const memoryRef = doc(collection(db, 'memories'))

  const hasAudioUpload = Boolean(input.audioFile)
  const photoWeight = hasAudioUpload ? 0.8 : 1
  const audioWeight = hasAudioUpload ? 0.2 : 0

  let photoProgress = 0
  let audioProgress = 0

  const emitCombinedProgress = () => {
    const total = (photoProgress * photoWeight + audioProgress * audioWeight) / (photoWeight + audioWeight || 1)
    onUploadProgress?.(Math.round(total))
  }

  const [photos, uploadedAudioUrl] = await Promise.all([
    uploadPhotos(memoryRef.id, input.photos, (progress) => {
      photoProgress = progress
      emitCombinedProgress()
    }),
    input.audioFile
      ? uploadAudio(memoryRef.id, input.audioFile, (progress) => {
          audioProgress = progress
          emitCombinedProgress()
        })
      : Promise.resolve<string | null>(null),
  ])

  const audio = input.audioFile
    ? ({ kind: 'mp3', url: uploadedAudioUrl ?? '' } satisfies MemoryAudio)
    : input.audio ?? undefined

  await withTimeout(
    setDoc(memoryRef, {
    title: input.title,
    happenedAt: input.happenedAt,
    relatoDoDia: input.relatoDoDia,
    author: input.author,
    createdAt: serverTimestamp(),
    photos,
    audio: audio ?? null,
    }),
    30000,
    'Tempo esgotado ao salvar memória no Firestore.'
  )

  onUploadProgress?.(100)

  return {
    id: memoryRef.id,
    title: input.title,
    happenedAt: input.happenedAt,
    relatoDoDia: input.relatoDoDia,
    author: input.author,
    createdAt: new Date().toISOString(),
    audio,
    photos,
  } satisfies MemoryEntry
}

export async function updateMemory(
  memoryId: string,
  input: MemoryFormInput,
  previous: MemoryEntry,
  onUploadProgress?: UploadProgressCallback
) {
  if (!firebaseAvailable || !db) {
    throw new Error('Firebase não está configurado neste ambiente.')
  }

  const hasPhotoUpload = input.photos.length > 0
  const hasAudioUpload = Boolean(input.audioFile)
  const weightTotal = (hasPhotoUpload ? 0.8 : 0) + (hasAudioUpload ? 0.2 : 0)
  const photoWeight = hasPhotoUpload ? 0.8 : 0
  const audioWeight = hasAudioUpload ? 0.2 : 0

  let photoProgress = hasPhotoUpload ? 0 : 100
  let audioProgress = hasAudioUpload ? 0 : 100

  const emitCombinedProgress = () => {
    if (weightTotal === 0) {
      onUploadProgress?.(100)
      return
    }

    const total = (photoProgress * photoWeight + audioProgress * audioWeight) / weightTotal
    onUploadProgress?.(Math.round(total))
  }

  const [uploadedPhotos, uploadedAudioUrl] = await Promise.all([
    input.photos.length > 0
      ? uploadPhotos(memoryId, input.photos, (progress) => {
          photoProgress = progress
          emitCombinedProgress()
        })
      : Promise.resolve<MemoryPhoto[]>(previous.photos),
    input.audioFile
      ? uploadAudio(memoryId, input.audioFile, (progress) => {
          audioProgress = progress
          emitCombinedProgress()
        })
      : Promise.resolve<string | null>(null),
  ])

  const audio = input.audioFile
    ? ({ kind: 'mp3', url: uploadedAudioUrl ?? '' } satisfies MemoryAudio)
    : input.audio ?? undefined

  await withTimeout(
    updateDoc(doc(db, 'memories', memoryId), {
      title: input.title,
      happenedAt: input.happenedAt,
      relatoDoDia: input.relatoDoDia,
      author: input.author,
      photos: uploadedPhotos,
      audio: audio ?? null,
    }),
    30000,
    'Tempo esgotado ao atualizar memória no Firestore.'
  )

  onUploadProgress?.(100)

  return {
    ...previous,
    id: memoryId,
    title: input.title,
    happenedAt: input.happenedAt,
    relatoDoDia: input.relatoDoDia,
    author: input.author,
    photos: uploadedPhotos,
    audio,
  } satisfies MemoryEntry
}

export async function deleteMemory(memoryId: string) {
  if (!firebaseAvailable || !db) {
    throw new Error('Firebase não está configurado neste ambiente.')
  }

  await withTimeout(deleteDoc(doc(db, 'memories', memoryId)), 30000, 'Tempo esgotado ao excluir memória.')
}

export async function loadMemories() {
  if (!firebaseAvailable || !db) {
    return []
  }

  const snapshot = await getDocs(query(collection(db, 'memories'), orderBy('happenedAt', 'desc')))

  return snapshot.docs.map((doc) => {
    const data = doc.data() as Omit<MemoryEntry, 'id'> & { createdAt?: unknown }
    const createdAtValue = data.createdAt
    let createdAt = new Date().toISOString()

    if (typeof createdAtValue === 'string') {
      createdAt = createdAtValue
    } else if (createdAtValue && typeof createdAtValue === 'object' && 'toDate' in createdAtValue) {
      const timestamp = createdAtValue as { toDate?: () => Date }
      createdAt = timestamp.toDate?.().toISOString() ?? createdAt
    }

    return {
      id: doc.id,
      title: data.title,
      happenedAt: data.happenedAt,
      createdAt,
      relatoDoDia: data.relatoDoDia,
      photos: data.photos ?? [],
      audio: data.audio ?? undefined,
      author: data.author,
    } satisfies MemoryEntry
  })
}

export async function runRuntimeDiagnostics() {
  const report: string[] = []

  if (!firebaseAvailable || !db || !storage) {
    return ['Firebase indisponível no frontend (.env incompleto ou inválido).']
  }

  const testId = `diagnostic-${Date.now()}`
  const memoryRef = doc(db, 'memories', testId)

  try {
    await setDoc(memoryRef, {
      title: 'diagnostic-write',
      happenedAt: new Date().toISOString().slice(0, 10),
      relatoDoDia: 'diagnostic',
      author: 'Ronald',
      createdAt: serverTimestamp(),
      photos: [],
      audio: null,
    })

    await deleteDoc(memoryRef)
    report.push('Firestore: OK (write/delete autorizado).')
  } catch (error) {
    report.push(`Firestore: FALHOU (${describeError(error)}).`)
  }

  const storageRef = ref(storage, `memories/${testId}/ping.txt`)

  try {
    await uploadBytes(storageRef, new Blob(['ping'], { type: 'text/plain' }))
    await deleteObject(storageRef)
    report.push('Storage: OK (upload/delete autorizado).')
  } catch (error) {
    report.push(`Storage: FALHOU (${describeError(error)}).`)
  }

  return report
}