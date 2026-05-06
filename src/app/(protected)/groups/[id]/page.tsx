'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, Plus, Users, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SearchMovies from '@/components/movies/SearchMovies'
import RecommendationCard from '@/components/movies/RecommendationCard'
import MovieModal from '@/components/movies/MovieModal'
import { deleteGroupAction } from '@/app/actions/groups'
import type { Recommendation, TMDBSearchResult } from '@/types'

interface GroupInfo {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_by: string | null
}

export default function GroupPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [group, setGroup] = useState<GroupInfo | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [isMember, setIsMember] = useState(false)
  const [loading, setLoading] = useState(true)
  const [codeCopied, setCodeCopied] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedRec, setSelectedRec] = useState<{ tmdbId: number; mediaType: 'movie' | 'tv' } | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  const loadData = useCallback(async () => {
    if (!id || !userId) return

    const [{ data: groupData }, { data: recsData }, { data: memberData }, { count }] = await Promise.all([
      supabase.from('groups').select('*').eq('id', id).single(),
      supabase
        .from('recommendations')
        .select('*, profiles(full_name, username, avatar_url)')
        .eq('group_id', id)
        .order('recommended_at', { ascending: false }),
      supabase.from('group_members').select('id').eq('group_id', id).eq('user_id', userId).maybeSingle(),
      supabase.from('group_members').select('*', { count: 'exact', head: true }).eq('group_id', id),
    ])

    setGroup(groupData)
    setRecommendations(recsData ?? [])
    setIsMember(!!memberData)
    setMemberCount(count ?? 0)
    setLoading(false)
  }, [id, userId])

  useEffect(() => { loadData() }, [loadData])

  async function handleAddRecommendation(result: TMDBSearchResult) {
    if (!userId || !id) return
    const title = result.title || result.name || ''
    await supabase.from('recommendations').insert({
      group_id: id,
      user_id: userId,
      tmdb_id: result.id,
      media_type: result.media_type as 'movie' | 'tv',
      title,
      poster_path: result.poster_path,
      overview: result.overview,
      release_date: result.release_date || result.first_air_date || null,
      vote_average: result.vote_average,
    })
    setShowSearch(false)
    loadData()
  }

  async function handleRemove(recId: string) {
    await supabase.from('recommendations').delete().eq('id', recId)
    setRecommendations((prev) => prev.filter((r) => r.id !== recId))
  }

  function copyCode() {
    if (!group) return
    navigator.clipboard.writeText(group.invite_code)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  async function handleDelete() {
    if (!id) return
    setDeleting(true)
    try {
      await deleteGroupAction(id)
      router.push('/groups')
    } catch {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (loading) {
    return (
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-card rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-card rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!group || !isMember) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Grupo não encontrado ou você não é membro.</p>
        </div>
      </div>
    )
  }

  const addedIds = recommendations.map((r) => r.tmdb_id)

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          {group.description && <p className="text-muted-foreground mt-1">{group.description}</p>}
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users size={14} /> {memberCount} membros</span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 border border-muted rounded-lg hover:bg-muted transition-colors text-xs"
            >
              {codeCopied ? <Check size={13} className="text-primary" /> : <Copy size={13} />}
              {codeCopied ? 'Copiado!' : `Código: ${group.invite_code}`}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start shrink-0">
          {group.created_by === userId && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
              title="Apagar grupo"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            Indicar título
          </button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="mb-6 p-4 bg-card border border-muted rounded-xl">
          <p className="text-sm font-medium mb-3">Buscar e indicar</p>
          <SearchMovies onSelect={handleAddRecommendation} alreadyAdded={addedIds} />
        </div>
      )}

      {/* Recommendations grid */}
      {recommendations.length === 0 ? (
        <div className="bg-card border border-muted rounded-2xl p-12 text-center">
          <p className="text-muted-foreground mb-2">Nenhuma indicação ainda.</p>
          <p className="text-sm text-muted-foreground">Seja o primeiro a indicar um filme ou série!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {recommendations.map((rec) => (
            <RecommendationCard
              key={rec.id}
              rec={rec}
              onClick={() => setSelectedRec({ tmdbId: rec.tmdb_id, mediaType: rec.media_type })}
              onRemove={() => handleRemove(rec.id)}
              canRemove={rec.user_id === userId || group.created_by === userId}
            />
          ))}
        </div>
      )}

      {selectedRec && (
        <MovieModal
          tmdbId={selectedRec.tmdbId}
          mediaType={selectedRec.mediaType}
          onClose={() => setSelectedRec(null)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(false)}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="relative bg-card border border-muted rounded-2xl w-full max-w-sm p-6 z-10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-2">Apagar grupo</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Tem certeza? Todas as indicações do grupo serão apagadas permanentemente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 border border-muted rounded-lg text-sm hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {deleting ? 'Apagando...' : 'Apagar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
