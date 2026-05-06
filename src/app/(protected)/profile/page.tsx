'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Bookmark, Trash2, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import MovieModal from '@/components/movies/MovieModal'
import { POSTER_BASE } from '@/lib/tmdb'
import { formatDate, formatRating } from '@/lib/utils'
import type { WatchLaterItem, Profile } from '@/types'

export default function ProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [watchLater, setWatchLater] = useState<WatchLaterItem[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{ tmdbId: number; mediaType: 'movie' | 'tv' } | null>(null)

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: profileData }, { data: wlData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('watch_later').select('*').eq('user_id', user.id).order('added_at', { ascending: false }),
    ])

    setProfile(profileData)
    setWatchLater(wlData ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function removeFromWatchLater(item: WatchLaterItem) {
    await supabase.from('watch_later').delete().eq('id', item.id)
    setWatchLater((prev) => prev.filter((w) => w.id !== item.id))
  }

  const displayName = profile?.full_name || profile?.username || 'Usuário'
  const initials = displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-4xl mx-auto">
        <div className="h-20 w-20 rounded-full bg-card animate-pulse mb-4" />
        <div className="h-6 w-40 bg-card rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-[2/3] bg-card rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-4xl mx-auto">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt={displayName} width={64} height={64} className="object-cover w-full h-full" />
          ) : (
            initials
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold">{displayName}</h1>
          {profile?.username && profile.username !== profile.full_name && (
            <p className="text-muted-foreground text-sm">@{profile.username}</p>
          )}
        </div>
      </div>

      {/* Watch later */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
          <Bookmark size={20} className="text-primary" />
          Ver mais tarde
          <span className="text-sm font-normal text-muted-foreground">({watchLater.length})</span>
        </h2>

        {watchLater.length === 0 ? (
          <div className="bg-card border border-muted rounded-2xl p-12 text-center">
            <Bookmark size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Sua lista está vazia.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Abra qualquer indicação em um grupo e salve para ver depois.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {watchLater.map((item) => (
              <div key={item.id} className="bg-card border border-muted rounded-xl overflow-hidden hover:border-primary/50 transition-all group">
                <button className="w-full text-left" onClick={() => setSelected({ tmdbId: item.tmdb_id, mediaType: item.media_type })}>
                  <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                    {item.poster_path ? (
                      <Image
                        src={`${POSTER_BASE}${item.poster_path}`}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className="px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                        {item.media_type === 'tv' ? 'Série' : 'Filme'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 pb-2">
                    <p className="font-medium text-xs leading-tight line-clamp-2">{item.title}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatDate(item.release_date)}</span>
                      {item.vote_average && (
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-accent fill-accent" />
                          {formatRating(item.vote_average)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
                <div className="px-3 pb-3">
                  <button
                    onClick={() => removeFromWatchLater(item)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={12} />
                    Remover
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <MovieModal
          tmdbId={selected.tmdbId}
          mediaType={selected.mediaType}
          onClose={() => { setSelected(null); loadData() }}
        />
      )}
    </div>
  )
}
