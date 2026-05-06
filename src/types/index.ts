export interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface Group {
  id: string
  name: string
  description: string | null
  invite_code: string
  created_by: string | null
  created_at: string
  member_count?: number
}

export interface GroupMember {
  id: string
  group_id: string
  user_id: string
  role: 'admin' | 'member'
  joined_at: string
  profiles?: Profile
}

export interface Recommendation {
  id: string
  group_id: string
  user_id: string
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  overview: string | null
  release_date: string | null
  vote_average: number | null
  recommended_at: string
  profiles?: Profile
}

export interface WatchLaterItem {
  id: string
  user_id: string
  tmdb_id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  overview: string | null
  release_date: string | null
  vote_average: number | null
  added_at: string
}

export interface TMDBSearchResult {
  id: number
  title?: string
  name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  media_type: 'movie' | 'tv' | 'person'
  genre_ids: number[]
}

export interface TMDBCastMember {
  id: number
  name: string
  character: string
  profile_path: string | null
  order: number
}
