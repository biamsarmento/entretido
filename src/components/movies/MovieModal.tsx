'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Star, Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { POSTER_BASE, BACKDROP_BASE } from '@/lib/tmdb'
import { formatDate, formatRating } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { TMDBCastMember, WatchLaterItem } from '@/types'

interface Props {
  tmdbId: number
  mediaType: 'movie' | 'tv'
  onClose: () => void
}

export default function MovieModal({ tmdbId, mediaType, onClose }: Props) {
  const supabase = createClient()
  const [details, setDetails] = useState<Record<string, unknown> | null>(null)
  const [inWatchLater, setInWatchLater] = useState(false)
  const [loadingWL, setLoadingWL] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => {
    fetch(`/api/tmdb/details?id=${tmdbId}&type=${mediaType}`)
      .then((r) => r.json())
      .then(setDetails)
  }, [tmdbId, mediaType])

  useEffect(() => {
    if (!userId) return
    supabase
      .from('watch_later')
      .select('id')
      .eq('user_id', userId)
      .eq('tmdb_id', tmdbId)
      .eq('media_type', mediaType)
      .maybeSingle()
      .then(({ data }) => setInWatchLater(!!data))
  }, [userId, tmdbId, mediaType])

  async function toggleWatchLater() {
    if (!userId || !details) return
    setLoadingWL(true)
    const title = (details.title as string) || (details.name as string) || ''
    if (inWatchLater) {
      await supabase
        .from('watch_later')
        .delete()
        .eq('user_id', userId)
        .eq('tmdb_id', tmdbId)
        .eq('media_type', mediaType)
      setInWatchLater(false)
    } else {
      await supabase.from('watch_later').insert({
        user_id: userId,
        tmdb_id: tmdbId,
        media_type: mediaType,
        title,
        poster_path: details.poster_path as string | null,
        overview: details.overview as string | null,
        release_date: (details.release_date as string) || (details.first_air_date as string) || null,
        vote_average: details.vote_average as number | null,
      })
      setInWatchLater(true)
    }
    setLoadingWL(false)
  }

  const cast: TMDBCastMember[] = ((details?.credits as { cast?: TMDBCastMember[] })?.cast ?? []).slice(0, 8)
  const title = (details?.title as string) || (details?.name as string) || ''
  const year = formatDate((details?.release_date as string) || (details?.first_air_date as string))
  const rating = formatRating(details?.vote_average as number)
  const backdrop = details?.backdrop_path ? `${BACKDROP_BASE}${details.backdrop_path}` : null
  const poster = details?.poster_path ? `${POSTER_BASE}${details.poster_path}` : null
  const genres = (details?.genres as { id: number; name: string }[] | undefined) ?? []
  const overview = details?.overview as string | undefined

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-muted rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop */}
        {backdrop && (
          <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
            <Image src={backdrop} alt={title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
          </div>
        )}

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-20"
        >
          <X size={18} />
        </button>

        {!details ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : (
          <div className="p-6">
            <div className="flex gap-4">
              {poster && (
                <div className="flex-shrink-0">
                  <Image src={poster} alt={title} width={100} height={150} className="rounded-lg object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold mb-1 leading-tight">{title}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span>{year}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Star size={13} className="text-accent fill-accent" />
                    {rating}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{mediaType === 'tv' ? 'Série' : 'Filme'}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {genres.map((g) => (
                    <span key={g.id} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                      {g.name}
                    </span>
                  ))}
                </div>
                <button
                  onClick={toggleWatchLater}
                  disabled={loadingWL}
                  className="flex items-center gap-2 px-4 py-2 border border-muted hover:border-primary text-sm rounded-lg transition-colors disabled:opacity-50"
                >
                  {loadingWL ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : inWatchLater ? (
                    <BookmarkCheck size={15} className="text-primary" />
                  ) : (
                    <Bookmark size={15} />
                  )}
                  {inWatchLater ? 'Salvo' : 'Ver mais tarde'}
                </button>
              </div>
            </div>

            {overview && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2 text-sm">Sinopse</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{overview}</p>
              </div>
            )}

            {cast.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold mb-3 text-sm">Elenco principal</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {cast.map((member) => (
                    <div key={member.id} className="text-center">
                      <div className="w-14 h-14 mx-auto rounded-full bg-muted overflow-hidden mb-1">
                        {member.profile_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                            alt={member.name}
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-bold">
                            {member.name[0]}
                          </div>
                        )}
                      </div>
                      <p className="text-xs font-medium leading-tight">{member.name}</p>
                      <p className="text-xs text-muted-foreground leading-tight truncate">{member.character}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
