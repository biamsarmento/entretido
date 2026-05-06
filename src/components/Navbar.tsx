'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Film, Users, Bookmark, User, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard', label: 'Início', icon: Film },
  { href: '/groups', label: 'Grupos', icon: Users },
  { href: '/profile', label: 'Perfil', icon: User },
]

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-card border-r border-muted p-4 z-40">
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-primary mb-8 px-2">
          <Film size={24} />
          entretido
        </Link>
        <nav className="flex-1 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-muted z-40 flex">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors',
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? 'text-primary'
                : 'text-muted-foreground'
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground"
        >
          <LogOut size={20} />
          Sair
        </button>
      </nav>
    </>
  )
}
