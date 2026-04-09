import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { MemoryEntry } from '../types'
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
  return (
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
        <PhotoGrid photos={entry.photos} />

        {entry.audio?.kind === 'spotify' ? <SpotifyEmbed url={entry.audio.url} /> : null}
        {entry.audio?.kind === 'mp3' ? <Mp3Player url={entry.audio.url} /> : null}
      </div>
    </motion.article>
  )
}
