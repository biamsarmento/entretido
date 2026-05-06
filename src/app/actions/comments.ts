'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getCommentsAction(recommendationId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('comments')
    .select('*, profiles(full_name, username)')
    .eq('recommendation_id', recommendationId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function addCommentAction(recommendationId: string, content: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  const admin = createAdminClient()

  await admin.from('profiles').upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  }, { onConflict: 'id' })

  const { data, error } = await admin
    .from('comments')
    .insert({ recommendation_id: recommendationId, user_id: user.id, content: content.trim() })
    .select('*, profiles(full_name, username)')
    .single()

  if (error) throw new Error('Erro ao adicionar comentário.')
  return data
}

export async function deleteCommentAction(commentId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  const admin = createAdminClient()

  const { data: comment } = await admin
    .from('comments')
    .select('user_id')
    .eq('id', commentId)
    .single()

  if (!comment || comment.user_id !== user.id) throw new Error('Sem permissão.')

  await admin.from('comments').delete().eq('id', commentId)
}
