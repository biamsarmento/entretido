import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { Users, Bookmark, ArrowRight } from 'lucide-react'
import { POSTER_BASE } from '@/lib/tmdb'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username')
    .eq('id', user!.id)
    .single()

  const { data: memberships } = await supabase
    .from('group_members')
    .select('groups(id, name, description, avatar_url)')
    .eq('user_id', user!.id)
    .limit(4)

  type GroupRow = { id: string; name: string; description: string | null; avatar_url: string | null }
  const groups: GroupRow[] = (memberships ?? [])
    .flatMap((m) => (Array.isArray(m.groups) ? m.groups : m.groups ? [m.groups] : []))
    .filter((g): g is GroupRow => !!g && typeof g === 'object' && 'id' in g)

  const { data: watchLater } = await supabase
    .from('watch_later')
    .select('*')
    .eq('user_id', user!.id)
    .order('added_at', { ascending: false })
    .limit(4)

  const name = profile?.full_name || profile?.username || user?.email?.split('@')[0] || 'você'

  return (
    <div className="px-6 pt-14 pb-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Olá, {name.split(' ')[0]} 👋</h1>
        <p className="text-muted-foreground mt-1">O que vamos assistir hoje?</p>
      </div>

      {/* Groups */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Seus grupos
          </h2>
          <Link href="/groups" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="bg-card border border-muted rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm mb-3">Você ainda não faz parte de nenhum grupo.</p>
            <Link href="/groups" className="text-sm text-primary hover:underline">
              Criar ou entrar em um grupo →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
                className="bg-card border border-muted hover:border-primary/50 rounded-xl p-4 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg shrink-0 overflow-hidden">
                    {group.avatar_url ? (
                      <Image src={group.avatar_url} alt={group.name} width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      group.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-muted-foreground truncate">{group.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Watch later */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bookmark size={20} className="text-primary" />
            Ver mais tarde
          </h2>
          <Link href="/profile" className="text-sm text-primary hover:underline flex items-center gap-1">
            Ver todos <ArrowRight size={14} />
          </Link>
        </div>

        {(watchLater ?? []).length === 0 ? (
          <div className="bg-card border border-muted rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Sua lista está vazia. Explore um grupo e salve títulos que quiser assistir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(watchLater ?? []).map((item) => (
              <div key={item.id} className="bg-card border border-muted rounded-xl overflow-hidden">
                <div className="relative aspect-[2/3] bg-muted">
                  {item.poster_path ? (
                    <Image src={`${POSTER_BASE}${item.poster_path}`} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🎬</div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-medium line-clamp-2">{item.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
