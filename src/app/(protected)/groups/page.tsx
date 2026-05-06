'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, Hash, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import CreateGroupModal from '@/components/groups/CreateGroupModal'
import JoinGroupModal from '@/components/groups/JoinGroupModal'

interface Group {
  id: string
  name: string
  description: string | null
  invite_code: string
  member_count?: number
}

export default function GroupsPage() {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadGroups = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('group_members')
      .select('groups(id, name, description, invite_code)')
      .eq('user_id', userId)
    const list: Group[] = (data ?? [])
      .flatMap((m) => (Array.isArray(m.groups) ? m.groups : m.groups ? [m.groups] : []))
      .filter((g): g is Group => !!g && typeof g === 'object' && 'id' in g)
    setGroups(list)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  useEffect(() => { loadGroups() }, [loadGroups])

  if (!userId) return null

  return (
    <div className="px-6 py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Grupos</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoin(true)}
            className="flex items-center gap-2 px-4 py-2 border border-muted hover:bg-muted rounded-lg text-sm transition-colors"
          >
            <Hash size={16} />
            Entrar com código
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
          >
            <Plus size={16} />
            Criar grupo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-card border border-muted rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-card border border-muted rounded-2xl p-12 text-center">
          <Users size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Sem grupos ainda</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Crie um grupo e convide seus amigos, ou entre com um código.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setShowJoin(true)}
              className="px-4 py-2 border border-muted hover:bg-muted rounded-lg text-sm transition-colors"
            >
              Entrar com código
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
            >
              Criar grupo
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="flex items-center gap-4 bg-card border border-muted hover:border-primary/50 rounded-xl p-4 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl flex-shrink-0">
                {group.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{group.name}</p>
                {group.description && (
                  <p className="text-sm text-muted-foreground truncate">{group.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">Código: {group.invite_code}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateGroupModal
          onClose={() => setShowCreate(false)}
          onCreated={loadGroups}
        />
      )}
      {showJoin && (
        <JoinGroupModal
          onClose={() => setShowJoin(false)}
          onJoined={loadGroups}
        />
      )}
    </div>
  )
}
