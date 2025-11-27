import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sutdymegsogddjvvzumh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1dGR5bWVnc29nZGRqdnZ6dW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3ODkwMzIsImV4cCI6MjA3NzM2NTAzMn0.FphL6co8-bHXH0tfEx5uzboDxrjYJDO2Tm-H1XbzPRc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce', // Explicitly set PKCE flow
    debug: process.env.NODE_ENV === 'development' // Enable debug in development
  }, 
  global: {
    headers: {
      'x-application-name': 'students-for-students'
    }
  }
});