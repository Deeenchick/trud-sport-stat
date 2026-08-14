// js/supabase.js
// ================================================================
// ПОДКЛЮЧЕНИЕ К SUPABASE
// ================================================================

const SUPABASE_URL = 'https://obmhexrwltdtldjdeuxo.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ibWhleHJ3bHRkdGxkamRldXhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxMzY1MDYsImV4cCI6MjEwMDcxMjUwNn0.JcReg2I4AgyVzxOtc9g5wo72250fW_MVJgeH6XjkFbE'

// Ждём загрузки клиента из CDN
if (!window.supabase) {
    throw new Error('Supabase client not loaded. Check your internet connection.')
}

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
