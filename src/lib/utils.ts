import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return 'Data desconhecida'
  return new Date(dateStr).getFullYear().toString()
}

export function formatRating(rating: number | null | undefined) {
  if (!rating) return 'N/A'
  return rating.toFixed(1)
}
