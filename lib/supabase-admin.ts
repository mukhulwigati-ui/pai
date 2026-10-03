import 'server-only';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// SUPABASE ADMIN CLIENT
// ============================================================================
//
// KHUSUS SERVER.
//
// Digunakan untuk:
// - Menyimpan komentar
// - Moderasi komentar
// - Update status komentar
// - Hapus komentar
// - Operasi server lainnya yang membutuhkan Service Role
//
// JANGAN import file ini ke Client Component.
//
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// ============================================================================
// VALIDASI ENV
// ============================================================================

if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL belum tersedia. Periksa file .env.local.'
  );
}

if (!supabaseServiceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY belum tersedia. Periksa file .env.local.'
  );
}

// ============================================================================
// CREATE ADMIN CLIENT
// ============================================================================

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);