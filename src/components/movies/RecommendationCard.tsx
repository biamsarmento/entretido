'use client'

import Image from 'next/image'
import { Star, Trash2 } from 'lucide-react'
import { POSTER_BASE } from '@/lib/tmdb'
import { formatDate, formatRating } from '@/lib/utils'
import type { Recommendation } from '@/types'

interface Props {
  rec: Recommendation
  onClick: () => void
  onRemove?: () => void
  canRemove?: boolean
}

export default function RecommendationCard({ rec, onClick, onRemove, canRemove }: Props) {
  return (
    <div className="bg-card border border-muted rounded-xl overflow-hidden hover:border-primary/50 transition-all group">
      <button className="w-full text-left" onClick={onClick}>
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {rec.poster_path ? (
            <Image
              src={`${POSTER_BASE}${rec.poster_path}`}
              alt={rec.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-4xl">🎬</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-2 right-2">
            <span className="px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
              {rec.media_type === 'tv' ? 'Série' : 'Filme'}
            </span>
          </div>
        </div>
        <div className="p-3">
          <p className="font-medium text-sm leading-tight mb-1 line-clamp-2">{rec.title}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatDate(rec.release_date)}</span>
            {rec.vote_average && (
              <span className="flex items-center gap-1">
                <Star size={11} className="text-accent fill-accent" />
                {formatRating(rec.vote_average)}
              </span>
            )}
          </div>
        </div>
      </button>

      <div className="px-3 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary">
            {(rec.profiles?.full_name || rec.profiles?.username || '?')[0].toUpperCase()}
          </div>
          <span className="text-xs text-muted-foreground truncate">
            {rec.profiles?.full_name || rec.profiles?.username || 'Usuário'}
          </span>
        </div>
        {canRemove && onRemove && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="p-1 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
