import Link from 'next/link'
import { Film, Users, Bookmark, Star } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-muted">
        <span className="text-2xl font-bold text-primary">entretido</span>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Entrar
          </Link>
          <Link href="/signup" className="px-4 py-2 text-sm bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors">
            Criar conta
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="max-w-2xl">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Indique filmes e séries{' '}
            <span className="text-primary">para os amigos</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
            Crie grupos com seus amigos, compartilhe recomendações e organize tudo
            que você quer assistir em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-8 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-medium text-lg transition-colors">
              Começar grátis
            </Link>
            <Link href="/login" className="px-8 py-3 border border-muted hover:border-border text-muted-foreground hover:text-foreground rounded-lg font-medium text-lg transition-colors">
              Já tenho conta
            </Link>
          </div>
        </div>
      </main>

      <section className="px-6 pb-24">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: <Users size={24} className="text-primary" />, title: 'Grupos de amigos', desc: 'Crie grupos e convide quem quiser com um código simples.' },
            { icon: <Film size={24} className="text-primary" />, title: 'Busca inteligente', desc: 'Encontre qualquer filme ou série com a base do TMDB.' },
            { icon: <Bookmark size={24} className="text-primary" />, title: 'Ver mais tarde', desc: 'Salve o que te interessou e acesse quando quiser.' },
            { icon: <Star size={24} className="text-primary" />, title: 'Quem indicou', desc: 'Veja qual amigo recomendou cada título no grupo.' },
          ].map((f) => (
            <div key={f.title} className="bg-card border border-muted rounded-xl p-6">
              <div className="mb-3">{f.icon}</div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-muted py-6 text-center text-sm text-muted-foreground">
        © 2025 Entretido
      </footer>
    </div>
  )
}
