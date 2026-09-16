import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://fyycsuprnwpacbsiyzrt.supabase.co'
export const SUPABASE_KEY = import.meta.env?.VITE_SUPABASE_KEY || 'sb_publishable_9YNgEYYtwKsklAorPWj-xA_z7mUS_kk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
