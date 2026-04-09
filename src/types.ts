export type MemoryPhoto = {
  id: string
  url: string
  alt: string
}

export type MemoryAudio = {
  kind: 'spotify' | 'mp3'
  url: string
}

export type MemoryEntry = {
  id: string
  title: string
  happenedAt: string
  createdAt: string
  relatoDoDia: string
  photos: MemoryPhoto[]
  audio?: MemoryAudio
  author: 'Ronald' | 'Suellen'
}
