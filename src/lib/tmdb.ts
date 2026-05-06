const BASE_URL = 'https://api.themoviedb.org/3'
const TOKEN = process.env.TMDB_READ_ACCESS_TOKEN

export const POSTER_BASE = 'https://image.tmdb.org/t/p/w500'
export const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original'

async function tmdbFetch(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 3600 },
  })
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`)
  return res.json()
}

export async function searchMulti(query: string) {
  return tmdbFetch(`/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=pt-BR&page=1`)
}

export async function getMovieDetails(id: number) {
  const [details, credits] = await Promise.all([
    tmdbFetch(`/movie/${id}?language=pt-BR`),
    tmdbFetch(`/movie/${id}/credits?language=pt-BR`),
  ])
  return { ...details, credits }
}

export async function getTVDetails(id: number) {
  const [details, credits] = await Promise.all([
    tmdbFetch(`/tv/${id}?language=pt-BR`),
    tmdbFetch(`/tv/${id}/credits?language=pt-BR`),
  ])
  return { ...details, credits }
}

export async function getTrending() {
  return tmdbFetch('/trending/all/week?language=pt-BR')
}
