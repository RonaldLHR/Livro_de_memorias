import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { MemoryEntry, MemoryPhoto } from '../types'
import { PhotoGrid } from './PhotoGrid'

type TimelineCardProps = {
  entry: MemoryEntry
}

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

function SpotifyEmbed({ url }: { url: string }) {
  const embedUrl = getSpotifyEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div className="rounded-3xl bg-white/75 p-4 shadow-sm ring-1 ring-black/5">
        <p className="text-sm text-stone-600">Link do Spotify inválido para embed.</p>
        <a href={url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-medium text-blush-700 underline">
          Abrir música no Spotify
        </a>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-stone-950/90 shadow-soft ring-1 ring-white/10">
      <iframe
        src={embedUrl}
        width="100%"
        height="152"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title="Spotify player"
      />
    </div>
  )
}

function Mp3Player({ url }: { url: string }) {
  return (
    <div className="rounded-3xl bg-white/75 p-4 shadow-sm ring-1 ring-black/5">
      <audio controls className="w-full" src={url} preload="none" />
    </div>
  )
}

export function TimelineCard({ entry }: TimelineCardProps) {
  const [activePhoto, setActivePhoto] = useState<MemoryPhoto | null>(null)
  const [photoDirection, setPhotoDirection] = useState<1 | -1>(1)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const activePhotoIndex = activePhoto ? entry.photos.findIndex((photo) => photo.id === activePhoto.id) : -1
  const hasMultiplePhotos = entry.photos.length > 1

  const goToPreviousPhoto = useCallback(() => {
    if (activePhotoIndex < 0 || entry.photos.length === 0) {
      return
    }

    const previousIndex = (activePhotoIndex - 1 + entry.photos.length) % entry.photos.length
    setPhotoDirection(-1)
    setActivePhoto(entry.photos[previousIndex])
  }, [activePhotoIndex, entry.photos])

  const goToNextPhoto = useCallback(() => {
    if (activePhotoIndex < 0 || entry.photos.length === 0) {
      return
    }

    const nextIndex = (activePhotoIndex + 1) % entry.photos.length
    setPhotoDirection(1)
    setActivePhoto(entry.photos[nextIndex])
  }, [activePhotoIndex, entry.photos])

  useEffect(() => {
    if (!activePhoto) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActivePhoto(null)
      }

      if (event.key === 'ArrowLeft') {
        goToPreviousPhoto()
      }

      if (event.key === 'ArrowRight') {
        goToNextPhoto()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [activePhoto, goToNextPhoto, goToPreviousPhoto])

  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    const firstTouch = event.touches[0]
    touchStartXRef.current = firstTouch.clientX
    touchStartYRef.current = firstTouch.clientY
  }

  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultiplePhotos) {
      return
    }

    const startX = touchStartXRef.current
    const startY = touchStartYRef.current

    if (startX == null || startY == null) {
      return
    }

    const endTouch = event.changedTouches[0]
    const deltaX = endTouch.clientX - startX
    const deltaY = endTouch.clientY - startY

    touchStartXRef.current = null
    touchStartYRef.current = null

    const horizontalThreshold = 40
    const verticalGuard = 70

    if (Math.abs(deltaY) > verticalGuard || Math.abs(deltaX) < horizontalThreshold) {
      return
    }

    if (deltaX > 0) {
      goToPreviousPhoto()
      return
    }

    goToNextPhoto()
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative rounded-[2rem] bg-white/70 p-5 shadow-soft ring-1 ring-black/5 backdrop-blur md:p-7"
      >
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blush-700/80">{entry.author}</p>
            <h3 className="mt-1 font-serif text-3xl leading-tight text-stone-900 md:text-4xl">
              {entry.title}
            </h3>
          </div>

          <time className="rounded-full bg-blush-100 px-4 py-2 text-sm font-medium text-blush-700">
            {new Date(entry.happenedAt).toLocaleDateString('pt-BR')}
          </time>
        </div>

        <div className="prose prose-stone max-w-none prose-p:leading-7 prose-headings:font-serif prose-headings:font-normal prose-a:text-blush-700">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.relatoDoDia}</ReactMarkdown>
        </div>

        <div className="mt-5 space-y-4">
          <PhotoGrid
            photos={entry.photos}
            onPhotoClick={(photo) => {
              setPhotoDirection(1)
              setActivePhoto(photo)
            }}
          />

          {entry.audio?.kind === 'spotify' ? <SpotifyEmbed url={entry.audio.url} /> : null}
          {entry.audio?.kind === 'mp3' ? <Mp3Player url={entry.audio.url} /> : null}
        </div>
      </motion.article>

      {activePhoto ? (
        <div
          className="fixed inset-0 z-50 bg-stone-950/95 p-4 backdrop-blur-sm md:p-8"
          role="dialog"
          aria-modal="true"
          onClick={() => setActivePhoto(null)}
        >
          <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-4" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/10 p-4 text-white ring-1 ring-white/15">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-blush-200/80">{entry.author}</p>
                <h4 className="font-serif text-2xl">{entry.title}</h4>
                <p className="mt-1 text-sm text-stone-200">{new Date(entry.happenedAt).toLocaleDateString('pt-BR')}</p>
                <p className="mt-3 max-w-3xl text-sm text-stone-100/90">{entry.relatoDoDia}</p>
              </div>

              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                className="rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/25"
              >
                Fechar
              </button>
            </div>

            <div
              className="relative flex-1 overflow-hidden rounded-3xl bg-black/30 ring-1 ring-white/10"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence initial={false} mode="wait" custom={photoDirection}>
                <motion.img
                  key={activePhoto.id}
                  src={activePhoto.url}
                  alt={activePhoto.alt}
                  className="h-full w-full object-contain"
                  custom={photoDirection}
                  initial={{ opacity: 0, x: photoDirection > 0 ? 40 : -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: photoDirection > 0 ? -40 : 40 }}
                  transition={{ duration: 0.28, ease: 'easeOut' }}
                />
              </AnimatePresence>

              {hasMultiplePhotos ? (
                <>
                  <button
                    type="button"
                    onClick={goToPreviousPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-lg font-bold text-white transition hover:bg-black/65"
                    aria-label="Foto anterior"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={goToNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/45 px-3 py-2 text-lg font-bold text-white transition hover:bg-black/65"
                    aria-label="Próxima foto"
                  >
                    →
                  </button>

                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 text-xs text-white">
                    {activePhotoIndex + 1} / {entry.photos.length}
                  </div>
                </>
              ) : null}
            </div>

            <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              {entry.audio?.kind === 'spotify' ? <SpotifyEmbed url={entry.audio.url} /> : null}
              {entry.audio?.kind === 'mp3' ? <Mp3Player url={entry.audio.url} /> : null}
              {!entry.audio ? <p className="text-sm text-stone-200">Sem música associada a esta memória.</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
