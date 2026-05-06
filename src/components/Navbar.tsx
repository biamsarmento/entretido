'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { Film, Users, User, LogOut } from 'lucide-react'
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
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-56 bg-secondary p-4 z-40">
        <Link href="/dashboard" className="flex justify-center mb-8">
          <Image src="/brand/logo.png" alt="Entretido" width={160} height={54} className="object-contain" />
        </Link>
        <nav className="flex-1 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                  ? 'bg-primary/20 text-primary'
                  : 'text-primary/60 hover:text-primary hover:bg-primary/10'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary/50 hover:text-primary hover:bg-primary/10 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>
      </aside>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-secondary z-40 flex">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors',
              pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
                ? 'text-primary'
                : 'text-primary/50'
            )}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs text-primary/50"
        >
          <LogOut size={20} />
          Sair
        </button>
      </nav>
    </>
  )
}
