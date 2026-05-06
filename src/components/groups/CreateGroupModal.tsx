'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  userId: string
  onClose: () => void
  onCreated: () => void
}

export default function CreateGroupModal({ userId, onClose, onCreated }: Props) {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({ name: name.trim(), description: description.trim() || null, created_by: userId, invite_code: inviteCode })
      .select()
      .single()

    if (groupError) { setError('Erro ao criar grupo.'); setLoading(false); return }

    await supabase.from('group_members').insert({ group_id: group.id, user_id: userId, role: 'admin' })

    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-card border border-muted rounded-2xl w-full max-w-md p-6 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">Criar grupo</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome do grupo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              placeholder="Ex: Família, Amigos da facul..."
              className="w-full bg-background border border-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição <span className="text-muted-foreground">(opcional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Do que é esse grupo?"
              className="w-full bg-background border border-muted rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-muted rounded-lg text-sm hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              Criar grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
