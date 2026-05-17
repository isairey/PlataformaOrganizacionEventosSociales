import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dqjjdbugifdvkhwhivux.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxampkYnVnaWZkdmtod2hpdnV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTYyODUsImV4cCI6MjA4MzM3MjI4NX0.SI4fb5nEczOj4wygnIfph6KmSb54Jl1eexf3IZ36vEw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)