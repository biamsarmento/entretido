'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  onClose: () => void
}

export default function JoinGroupModal({ userId, onClose }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: group } = await supabase
      .from('groups')
      .select('id, name')
      .eq('invite_code', code.trim().toUpperCase())
      .maybeSingle()

    if (!group) {
      setError('Código inválido. Verifique e tente novamente.')
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: userId, role: 'member' })

    if (memberError) {
      if (memberError.code === '23505') {
        setError('Você já faz parte desse grupo.')
      } else {
        setError('Erro ao entrar no grupo.')
      }
      setLoading(false)
      return
    }

    onClose()
    router.push(`/groups/${group.id}`)
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-card border border-muted rounded-2xl w-full max-w-sm p-6 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Entrar com código</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Código do grupo</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
              maxLength={8}
              placeholder="Ex: AB1C2D"
              className="w-full bg-background border border-muted rounded-lg px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-primary transition-colors text-center"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-muted rounded-lg text-sm hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
