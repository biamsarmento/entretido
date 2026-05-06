'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Search, Loader2, Plus, Check } from 'lucide-react'
import { POSTER_BASE } from '@/lib/tmdb'
import { formatDate } from '@/lib/utils'
import type { TMDBSearchResult } from '@/types'

interface Props {
  onSelect: (result: TMDBSearchResult) => void
  alreadyAdded: number[]
}

export default function SearchMovies({ onSelect, alreadyAdded }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TMDBSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(value: string) {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await fetch(`/api/tmdb?q=${encodeURIComponent(value)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setOpen(true)
      setLoading(false)
    }, 400)
  }

  function handleSelect(result: TMDBSearchResult) {
    onSelect(result)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Buscar filme ou série..."
          className="w-full bg-background border border-muted rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-muted rounded-xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto">
          {results.map((result) => {
            const added = alreadyAdded.includes(result.id)
            const title = result.title || result.name || ''
            const year = formatDate(result.release_date || result.first_air_date)
            return (
              <button
                key={result.id}
                onClick={() => !added && handleSelect(result)}
                disabled={added}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-9 h-12 flex-shrink-0 rounded overflow-hidden bg-muted">
                  {result.poster_path ? (
                    <Image
                      src={`${POSTER_BASE}${result.poster_path}`}
                      alt={title}
                      width={36}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{title}</p>
                  <p className="text-xs text-muted-foreground">
                    {year} · {result.media_type === 'tv' ? 'Série' : 'Filme'}
                  </p>
                </div>
                {added ? (
                  <Check size={16} className="text-primary flex-shrink-0" />
                ) : (
                  <Plus size={16} className="text-muted-foreground flex-shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-muted rounded-xl p-4 text-sm text-muted-foreground text-center z-50">
          Nenhum resultado encontrado.
        </div>
      )}
    </div>
  )
}
