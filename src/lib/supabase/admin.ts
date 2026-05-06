import { createClient } from '@supabase/supabase-js'

// Cliente admin (service role) — só usar em Server Actions/API routes
// Bypassa RLS, mas verificamos auth manualmente antes de qualquer operação
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
