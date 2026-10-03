import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Sistem adaptif: Mengutamakan PUBLISHABLE_KEY terbaru, jika kosong baru pakai ANON_KEY lama
const supabaseKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("⚠️ Error: File .env.local Supabase belum terkonfigurasi dengan benar!");
}

// Inisialisasi client tunggal yang sah untuk Next.js
export const supabase = createClient(supabaseUrl || '', supabaseKey || '', {
  auth: {
    persistSession: true, // Menjaga user Google Hanin Amani Anda tetap terkunci masuk saat berpindah artikel
    autoRefreshToken: true,
  }
});