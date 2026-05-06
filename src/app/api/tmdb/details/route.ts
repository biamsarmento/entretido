import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.themoviedb.org/3'

async function tmdbGet(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}` },
    next: { revalidate: 3600 },
  })
  return res.json()
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const type = searchParams.get('type') as 'movie' | 'tv'

  if (!id || !type) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const [details, credits] = await Promise.all([
    tmdbGet(`/${type}/${id}?language=pt-BR`),
    tmdbGet(`/${type}/${id}/credits?language=pt-BR`),
  ])

  return NextResponse.json({ ...details, credits })
}
