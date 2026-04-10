import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react'
import { Upload, Music4, ImagePlus, PenSquare } from 'lucide-react'
import type { MemoryAudio, MemoryEntry } from '../types'
import type { MemoryFormInput } from '../lib/memoryService'

function getSpotifyEmbedUrl(rawUrl: string) {
  const value = rawUrl.trim()

  if (!value) {
    return null
  }

  if (value.startsWith('spotify:')) {
    const [, type, id] = value.split(':')

    if (type && id) {
      return `https://open.spotify.com/embed/${type}/${id.split('?')[0]}`
    }

    return null
  }

  const normalized = value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`

  try {
    const parsed = new URL(normalized)

    if (!parsed.hostname.includes('spotify.com')) {
      return null
    }

    const rawSegments = parsed.pathname.split('/').filter(Boolean)
    const segments = rawSegments[0]?.startsWith('intl-') ? rawSegments.slice(1) : rawSegments

    if (segments[0] === 'embed' && segments.length >= 3) {
      return `https://open.spotify.com/embed/${segments[1]}/${segments[2]}`
    }

    if (segments.length >= 2) {
      return `https://open.spotify.com/embed/${segments[0]}/${segments[1]}`
    }

    return null
  } catch {
    return null
  }
}

type AdminPanelProps = {
  canEdit: boolean
  memories: MemoryEntry[]
  onPublish: (payload: MemoryFormInput) => Promise<void>
  onUpdate: (memoryId: string, payload: MemoryFormInput) => Promise<void>
  onDelete: (memoryId: string) => Promise<void>
  onRunDiagnostics: () => Promise<void>
  loading?: boolean
  diagnosticsLoading?: boolean
  diagnosticsReport?: string[]
  uploadProgress?: number
}

export function AdminPanel({
  canEdit,
  memories,
  onPublish,
  onUpdate,
  onDelete,
  onRunDiagnostics,
  loading,
  diagnosticsLoading,
  diagnosticsReport = [],
  uploadProgress = 0,
}: AdminPanelProps) {
  const [formState, setFormState] = useState({
    title: '',
    happenedAt: '',
    relatoDoDia: '',
    spotifyUrl: '',
    author: 'Ronald' as 'Ronald' | 'Suellen',
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null)

  const statusLabel = useMemo(
    () => (canEdit ? 'Acesso liberado para Ronald e Suellen' : 'Somente o casal pode publicar'),
    [canEdit]
  )

  const spotifyPreviewUrl = useMemo(() => getSpotifyEmbedUrl(formState.spotifyUrl), [formState.spotifyUrl])

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file))
    setPhotoPreviewUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  useEffect(() => {
    if (!videoFile) {
      setVideoPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(videoFile)
    setVideoPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [videoFile])

  useEffect(() => {
    if (!audioFile) {
      setAudioPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(audioFile)
    setAudioPreviewUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [audioFile])

  function resetForm() {
    setFormState({ title: '', happenedAt: '', relatoDoDia: '', spotifyUrl: '', author: 'Ronald' })
    setPhotos([])
    setVideoFile(null)
    setAudioFile(null)
    setEditingId(null)
  }

  function startEdit(memory: MemoryEntry) {
    setEditingId(memory.id)
    setFormState({
      title: memory.title,
      happenedAt: memory.happenedAt,
      relatoDoDia: memory.relatoDoDia,
      spotifyUrl: memory.audio?.kind === 'spotify' ? memory.audio.url : '',
      author: memory.author,
    })
    setPhotos([])
    setVideoFile(null)
    setAudioFile(null)
  }

  async function handleDelete(memoryId: string) {
    if (!canEdit) {
      return
    }

    const shouldDelete = window.confirm('Deseja realmente excluir esta memória?')

    if (!shouldDelete) {
      return
    }

    await onDelete(memoryId)

    if (editingId === memoryId) {
      resetForm()
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canEdit) {
      return
    }

    const payload = {
      title: formState.title,
      happenedAt: formState.happenedAt,
      relatoDoDia: formState.relatoDoDia,
      author: formState.author,
      photos,
      videoFile,
      audioFile,
      audio: audioFile
        ? { kind: 'mp3', url: audioFile.name }
        : formState.spotifyUrl
          ? { kind: 'spotify', url: formState.spotifyUrl }
          : undefined,
    } satisfies MemoryFormInput

    try {
      if (editingId) {
        await onUpdate(editingId, payload)
      } else {
        await onPublish(payload)
      }

      resetForm()
    } catch {
      return
    }
  }

  return (
    <section className="rounded-[2rem] bg-white/80 p-5 shadow-soft ring-1 ring-black/5 md:p-7">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-blush-100 p-3 text-blush-700">
          <Upload size={20} />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-stone-900">Painel do casal</h2>
          <p className="text-sm text-stone-500">{statusLabel}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4">
        {loading ? (
          <div className="rounded-2xl border border-blush-200 bg-blush-50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-blush-700">
              <span>Progresso do upload</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-blush-100">
              <div className="h-full rounded-full bg-blush-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Título da memória</span>
            <input
              value={formState.title}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFormState({ ...formState, title: event.target.value })}
              placeholder="Ex: Nosso primeiro pôr do sol"
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-blush-500"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-stone-700">Data em que aconteceu</span>
            <input
              type="date"
              value={formState.happenedAt}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setFormState({ ...formState, happenedAt: event.target.value })}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-blush-500"
            />
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-stone-700">Autor</span>
          <select
            value={formState.author}
            onChange={(event) => setFormState({ ...formState, author: event.target.value as 'Ronald' | 'Suellen' })}
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-blush-500"
          >
            <option value="Ronald">Ronald</option>
            <option value="Suellen">Suellen</option>
          </select>
        </label>

        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <PenSquare size={16} />
            Relato do dia
          </span>
          <textarea
            rows={6}
            value={formState.relatoDoDia}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setFormState({ ...formState, relatoDoDia: event.target.value })}
            placeholder="Escreva em Markdown ou texto simples..."
            className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-blush-500"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <ImagePlus size={16} />
              Upload de fotos múltiplas
            </span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setPhotos(Array.from(event.target.files ?? []))}
              className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500 file:mr-4 file:rounded-full file:border-0 file:bg-blush-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blush-700 hover:border-blush-500"
            />

            <p className="text-xs text-stone-500">JPEG/PNG/WebP são convertidas automaticamente para WebP 4:5.</p>

              {photoPreviewUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {photoPreviewUrls.map((url) => (
                    <img key={url} src={url} alt="Pré-visualização" className="h-16 w-full rounded-xl object-cover ring-1 ring-black/5" />
                  ))}
                </div>
              ) : null}
          </label>

          <label className="grid gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <Music4 size={16} />
              Spotify Embed
            </span>
            <div className="relative">
              <input
                value={formState.spotifyUrl}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setFormState({ ...formState, spotifyUrl: event.target.value })}
                placeholder="Cole o link do Spotify (ex: https://open.spotify.com/track/...)"
                className="rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-blush-500"
              />
              {formState.spotifyUrl ? (
                <div className="absolute right-3 top-3.5">
                  {spotifyPreviewUrl ? (
                    <span className="text-sm font-medium text-emerald-600">✓</span>
                  ) : (
                    <span className="text-sm font-medium text-amber-600">⚠</span>
                  )}
                </div>
              ) : null}
            </div>
            {formState.spotifyUrl && !spotifyPreviewUrl ? (
              <p className="text-xs text-amber-600">⚠️ Link do Spotify não reconhecido. Use um link direto da música (open.spotify.com/track/...)</p>
            ) : null}
            {spotifyPreviewUrl ? (
              <div className="overflow-hidden rounded-2xl bg-stone-950/90 ring-1 ring-white/10">
                <iframe
                  src={spotifyPreviewUrl}
                  width="100%"
                  height="80"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  title="Spotify preview"
                />
              </div>
            ) : null}
          </label>
        </div>

        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <Upload size={16} />
            Vídeo curto (opcional)
          </span>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(event: ChangeEvent<HTMLInputElement>) => setVideoFile(event.target.files?.[0] ?? null)}
            className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500 file:mr-4 file:rounded-full file:border-0 file:bg-blush-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blush-700 hover:border-blush-500"
          />

          <p className="text-xs text-stone-500">Sugestão: até 15-30s para manter carregamento rápido e visual elegante.</p>
          {videoFile ? <p className="text-xs text-stone-500">Vídeo selecionado: {videoFile.name}</p> : null}
          {videoPreviewUrl ? <video controls className="w-full rounded-2xl ring-1 ring-black/10" src={videoPreviewUrl} preload="metadata" /> : null}
        </label>

        <label className="grid gap-2">
          <span className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <Music4 size={16} />
            Upload de áudio MP3
          </span>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3"
            onChange={(event: ChangeEvent<HTMLInputElement>) => setAudioFile(event.target.files?.[0] ?? null)}
            className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-sm text-stone-500 file:mr-4 file:rounded-full file:border-0 file:bg-blush-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blush-700 hover:border-blush-500"
          />

          {audioFile ? <p className="text-xs text-stone-500">Arquivo selecionado: {audioFile.name}</p> : null}
          {audioPreviewUrl ? <audio controls className="w-full" src={audioPreviewUrl} preload="none" /> : null}
        </label>

        <button
          type="submit"
          disabled={!canEdit || loading}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (editingId ? 'Salvando...' : 'Publicando...') : editingId ? 'Salvar edição' : 'Publicar memória'}
        </button>

        {editingId ? (
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-white"
          >
            Cancelar edição
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => void onRunDiagnostics()}
          disabled={diagnosticsLoading}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {diagnosticsLoading ? 'Executando diagnóstico...' : 'Executar diagnóstico'}
        </button>

        {diagnosticsReport.length > 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
            <p className="mb-2 font-medium text-stone-800">Resultado do diagnóstico:</p>
            <ul className="space-y-1">
              {diagnosticsReport.map((line) => (
                <li key={line}>• {line}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </form>

      <div className="mt-8 space-y-3">
        <h3 className="font-serif text-xl text-stone-900">Memórias cadastradas</h3>
        {memories.length === 0 ? (
          <p className="text-sm text-stone-500">Nenhuma memória ainda.</p>
        ) : (
          memories.slice(0, 8).map((memory) => (
            <div key={memory.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-black/5">
              <div>
                <p className="text-sm font-medium text-stone-800">{memory.title}</p>
                <p className="text-xs text-stone-500">{new Date(memory.happenedAt).toLocaleDateString('pt-BR')}</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(memory)}
                  className="rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-stone-700 hover:bg-white"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(memory.id)}
                  className="rounded-full border border-rose-200 px-4 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
