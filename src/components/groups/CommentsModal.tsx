'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Trash2, Loader2 } from 'lucide-react'
import { getCommentsAction, addCommentAction, deleteCommentAction } from '@/app/actions/comments'

interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
  profiles: { full_name: string | null; username: string | null } | null
}

interface Props {
  recommendationId: string
  title: string
  userId: string
  onClose: () => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function CommentsModal({ recommendationId, title, userId, onClose }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCommentsAction(recommendationId).then((data) => {
      setComments(data as Comment[])
      setLoading(false)
    })
  }, [recommendationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      const comment = await addCommentAction(recommendationId, text)
      setComments((prev) => [...prev, comment as Comment])
      setText('')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId: string) {
    await deleteCommentAction(commentId)
    setComments((prev) => prev.filter((c) => c.id !== commentId))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-muted rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md flex flex-col z-10 max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-muted shrink-0">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Comentários</p>
            <p className="font-semibold truncate">{title}</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors ml-3">
            <X size={20} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhum comentário ainda. Seja o primeiro!
            </p>
          ) : (
            comments.map((c) => {
              const name = c.profiles?.full_name || c.profiles?.username || 'Usuário'
              const isOwn = c.user_id === userId
              return (
                <div key={c.id} className="flex gap-3 group">
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0 mt-0.5">
                    {name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold">{name}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm mt-0.5 break-words">{c.content}</p>
                  </div>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="px-5 py-4 border-t border-muted shrink-0 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva um comentário..."
            maxLength={500}
            className="flex-1 bg-background border border-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="p-2 bg-primary hover:bg-primary-hover disabled:opacity-40 text-white rounded-lg transition-colors"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  )
}
