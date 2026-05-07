'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Copy, Check, Plus, Users, Trash2, Camera, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import SearchMovies from '@/components/movies/SearchMovies'
import RecommendationCard from '@/components/movies/RecommendationCard'
import MovieModal from '@/components/movies/MovieModal'
import { deleteGroupAction, uploadGroupAvatarAction } from '@/app/actions/groups'
import CommentsModal from '@/components/groups/CommentsModal'
import Image from 'next/image'
import type { Recommendation, TMDBSearchResult } from '@/types'

interface GroupInfo {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  invite_code: string
  created_by: string | null
}

type SortOrder = 'recent' | 'az' | 'za' | 'year_desc' | 'year_asc'
type MediaFilter = 'all' | 'movie' | 'tv'

const PAGE_SIZE = 10

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
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [selectedComment, setSelectedComment] = useState<{ recId: string; title: string } | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent')
  const [currentPage, setCurrentPage] = useState(1)

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

  useEffect(() => { setCurrentPage(1) }, [mediaFilter, sortOrder])

  const filtered = useMemo(() => {
    let list = [...recommendations]

    if (mediaFilter !== 'all') {
      list = list.filter((r) => r.media_type === mediaFilter)
    }

    if (sortOrder === 'az') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
    } else if (sortOrder === 'za') {
      list.sort((a, b) => b.title.localeCompare(a.title, 'pt-BR'))
    } else if (sortOrder === 'year_desc') {
      list.sort((a, b) => {
        const ya = a.release_date ? new Date(a.release_date).getFullYear() : 0
        const yb = b.release_date ? new Date(b.release_date).getFullYear() : 0
        return yb - ya
      })
    } else if (sortOrder === 'year_asc') {
      list.sort((a, b) => {
        const ya = a.release_date ? new Date(a.release_date).getFullYear() : Infinity
        const yb = b.release_date ? new Date(b.release_date).getFullYear() : Infinity
        return ya - yb
      })
    }

    return list
  }, [recommendations, mediaFilter, sortOrder])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      const url = await uploadGroupAvatarAction(id, formData)
      setGroup((prev) => prev ? { ...prev, avatar_url: url } : prev)
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
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
      <div className="px-6 pt-14 pb-8 max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-card rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-card rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-2/3 bg-card rounded-xl animate-pulse" />
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
    <div className="px-6 pt-14 pb-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {group.avatar_url ? (
                <Image src={group.avatar_url} alt={group.name} width={64} height={64} className="object-cover w-full h-full" />
              ) : (
                group.name[0].toUpperCase()
              )}
            </div>
            {group.created_by === userId && (
              <>
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity disabled:opacity-60"
                >
                  <Camera size={20} className="text-white" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </>
            )}
          </div>

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

      {/* Filters */}
      {recommendations.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          {/* Media type */}
          <div className="flex rounded-lg border border-muted overflow-hidden text-sm">
            {([['all', 'Todos'], ['movie', 'Filmes'], ['tv', 'Séries']] as [MediaFilter, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setMediaFilter(val)}
                className={`px-3 py-1.5 transition-colors ${mediaFilter === val ? 'bg-primary text-white' : 'hover:bg-muted text-muted-foreground'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="px-3 py-1.5 rounded-lg border border-muted bg-card text-sm text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          >
            <option value="recent">Mais recentes indicações</option>
            <option value="year_desc">Ano: mais recentes</option>
            <option value="year_asc">Ano: mais antigos</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>

          {/* Results count */}
          <span className="text-xs text-muted-foreground ml-auto">
            {filtered.length} título{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Recommendations grid */}
      {filtered.length === 0 ? (
        <div className="bg-card border border-muted rounded-2xl p-12 text-center">
          {recommendations.length === 0 ? (
            <>
              <p className="text-muted-foreground mb-2">Nenhuma indicação ainda.</p>
              <p className="text-sm text-muted-foreground">Seja o primeiro a indicar um filme ou série!</p>
            </>
          ) : (
            <p className="text-muted-foreground">Nenhum título encontrado com esses filtros.</p>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {paginated.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onClick={() => setSelectedRec({ tmdbId: rec.tmdb_id, mediaType: rec.media_type })}
                onRemove={() => handleRemove(rec.id)}
                canRemove={rec.user_id === userId || group.created_by === userId}
                onComment={() => setSelectedComment({ recId: rec.id, title: rec.title })}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-muted hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-primary text-white'
                      : 'border border-muted hover:bg-muted text-muted-foreground'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-muted hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}

      {selectedRec && (
        <MovieModal
          tmdbId={selectedRec.tmdbId}
          mediaType={selectedRec.mediaType}
          onClose={() => setSelectedRec(null)}
        />
      )}

      {selectedComment && userId && (
        <CommentsModal
          recommendationId={selectedComment.recId}
          title={selectedComment.title}
          userId={userId}
          onClose={() => setSelectedComment(null)}
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
