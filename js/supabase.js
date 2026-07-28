// js/supabase.js
// ================================================================
// ПОДКЛЮЧЕНИЕ К SUPABASE
// ================================================================

const SUPABASE_URL = 'https://obmhexrwltdtldjdeuxo.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_HX4idr3fjs1BvNTwZidseg_oiQddbPX'

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
