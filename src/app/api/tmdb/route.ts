import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.themoviedb.org/3'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')

  if (!query) return NextResponse.json({ results: [] })

  const res = await fetch(
    `${BASE_URL}/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=pt-BR&page=1`,
    {
      headers: { Authorization: `Bearer ${process.env.TMDB_READ_ACCESS_TOKEN}` },
    }
  )
  const data = await res.json()
  const results = (data.results ?? []).filter(
    (r: { media_type: string }) => r.media_type === 'movie' || r.media_type === 'tv'
  )
  return NextResponse.json({ results })
}
