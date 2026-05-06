'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function createGroupAction(name: string, description: string | null, inviteCode: string) {
  // Verifica autenticação com o client normal
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  // Usa admin client para escrever (bypassa RLS)
  const admin = createAdminClient()

  await admin.from('profiles').upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  }, { onConflict: 'id' })

  const { data: group, error: groupError } = await admin
    .from('groups')
    .insert({ name, description, created_by: user.id, invite_code: inviteCode })
    .select()
    .single()

  if (groupError) throw new Error(groupError.message)

  await admin.from('group_members').insert({
    group_id: group.id,
    user_id: user.id,
    role: 'admin',
  })

  return group
}

export async function joinGroupAction(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  const admin = createAdminClient()

  await admin.from('profiles').upsert({
    id: user.id,
    full_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
  }, { onConflict: 'id' })

  const { data: group } = await admin
    .from('groups')
    .select('id, name')
    .eq('invite_code', inviteCode.trim().toUpperCase())
    .maybeSingle()

  if (!group) throw new Error('Código inválido. Verifique e tente novamente.')

  const { error: memberError } = await admin
    .from('group_members')
    .insert({ group_id: group.id, user_id: user.id, role: 'member' })

  if (memberError) {
    if (memberError.code === '23505') throw new Error('Você já faz parte desse grupo.')
    throw new Error('Erro ao entrar no grupo.')
  }

  return group
}

export async function deleteGroupAction(groupId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Não autenticado')

  const admin = createAdminClient()

  const { data: group } = await admin
    .from('groups')
    .select('created_by')
    .eq('id', groupId)
    .single()

  if (!group) throw new Error('Grupo não encontrado.')
  if (group.created_by !== user.id) throw new Error('Apenas o criador pode apagar o grupo.')

  const { error } = await admin.from('groups').delete().eq('id', groupId)
  if (error) throw new Error('Erro ao apagar o grupo.')
}
