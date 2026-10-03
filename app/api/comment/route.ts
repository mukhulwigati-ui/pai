import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { slug, nama, email, komentar } = await request.json();

    // Validasi sederhana
    if (!slug || !nama || !email || !komentar) {
      return NextResponse.json({ error: 'Semua kolom wajib diisi!' }, { status: 400 });
    }

    // Masukkan data ke tabel Supabase
    const { data, error } = await supabase
      .from('artikel_komentar')
      .insert([{ slug, nama, email, komentar }]);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Komentar berhasil dikirim!' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}