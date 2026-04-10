// frontend/js/supabaseClient.js

// Version SANS Vite - mets TES vraies valeurs directement
const SUPABASE_URL = 'https://auumbkcfwjpvdifnxzly.supabase.co'  // ← REMPLACE
const SUPABASE_ANON_KEY = 'sb_publishable_2S0l2S3ETAq8u-VuSd7flg_QoTgdkKq'      

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

console.log('✅ Supabase connecté')