import type { MemoryPhoto } from '../types'

type PhotoGridProps = {
  photos: MemoryPhoto[]
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  if (!photos.length) {
    return null
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo) => (
        <figure
          key={photo.id}
          className="aspect-[4/5] overflow-hidden rounded-3xl bg-white/70 shadow-sm ring-1 ring-black/5"
        >
          <img
            src={photo.url}
            alt={photo.alt}
            className="h-full w-full object-cover transition duration-300 hover:scale-[1.02]"
            loading="lazy"
          />
        </figure>
      ))}
    </div>
  )
}
