'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface CommentSectionProps {
  slug: string;
  initialComments: any[];
}

export default function CommentSection({ slug, initialComments }: CommentSectionProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [komentar, setKomentar] = useState('');
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [msg, setMsg] = useState('');

  // 1. Cek status login pengguna saat komponen dimuat
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setAuthLoading(false);
    };

    checkUser();

    // Dengarkan perubahan status auth (login/logout) secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fungsi Pemicu Login Google OAuth Supabase (Perbaikan Redirect URL Dinamis)
  const handleGoogleLogin = async () => {
    try {
      // Menangkap URL lengkap artikel saat ini secara real-time di browser pembaca
      const currentFullURL = window.location.href;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Memaksa Supabase melempar balik ke URL detail artikel asal di domain www.guruonline.web.id
          redirectTo: currentFullURL,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setMsg(`❌ Gagal terhubung ke Google: ${err.message}`);
    }
  };

  // 3. Fungsi Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // 4. Submit Komentar Aman menggunakan Data Auth Google
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMsg('');

    // Ambil metadata nama dan email resmi dari akun Google mereka
    const userNama = user.user_metadata.full_name || user.user_metadata.name || 'Pengguna Google';
    const userEmail = user.email || '';

    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug, 
          nama: userNama, 
          email: userEmail, 
          komentar 
        }),
      });

      const responseData = await res.json();

      if (responseData.success) {
        setKomentar('');
        setMsg('✅ Komentar Anda berhasil diterbitkan!');
        router.refresh();
      } else {
        setMsg(`❌ ${responseData.error}`);
      }
    } catch (err) {
      setMsg('❌ Terjadi kesalahan jaringan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h3 className="text-xl font-bold text-gray-950 mb-6 uppercase tracking-tight flex items-center">
        💬 Komentar ({initialComments.length})
      </h3>

      {/* Bagian Info Pengguna di Atas Form */}
      {!authLoading && user && (
        <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl p-3 mb-4 text-xs font-medium text-gray-700">
          <div className="flex items-center space-x-2">
            {user.user_metadata.avatar_url && (
              <img 
                src={user.user_metadata.avatar_url} 
                alt="Avatar" 
                className="w-5 h-5 rounded-full border border-orange-200"
              />
            )}
            <span>Masuk sebagai: <strong className="text-orange-700">{user.user_metadata.full_name}</strong> ({user.email})</span>
          </div>
          <button 
            onClick={handleLogout} 
            className="text-gray-400 hover:text-red-600 transition font-bold cursor-pointer"
          >
            Keluar
          </button>
        </div>
      )}

      {/* LIST BACA KOMENTAR */}
      <div className="space-y-4 mb-8">
        {initialComments.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Belum ada komentar. Jadilah yang pertama!</p>
        ) : (
          initialComments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 border border-gray-200/60 p-4 rounded-xl shadow-xs">
              <div className="flex justify-between items-center mb-1.5">
                <span className="font-extrabold text-sm text-orange-600 flex items-center gap-1.5">
                  Google User • {comment.nama}
                </span>
                <span className="text-[11px] text-gray-400">
                  {new Date(comment.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-[14.5px] text-gray-800 leading-relaxed whitespace-pre-line">{comment.komentar}</p>
            </div>
          ))
        )}
      </div>

      {/* KONDISI INTERAKSI FORM BERDASARKAN AUTH */}
      {authLoading ? (
        <div className="text-center py-6 text-xs text-gray-400">Memeriksa enkripsi sesi masuk...</div>
      ) : !user ? (
        /* KONDISI A: JIKA BELUM LOGIN GOOGLE */
        <div className="bg-white border border-gray-200 p-8 rounded-2xl shadow-xs text-center space-y-4">
          <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Tinggalkan Tanggapan</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Untuk mencegah manipulasi identitas dan penyebaran spam, silakan masuk menggunakan akun Google resmi Anda untuk mengirim komentar.
          </p>
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="inline-flex items-center space-x-2 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs uppercase px-5 py-3 border border-gray-300 rounded-xl transition duration-200 shadow-xs tracking-wider cursor-pointer mx-auto"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.866-3.577-7.866-8s3.536-8 7.866-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.436 2.114 15.58 1 12.24 1C6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 10.793-4.537 10.793-10.972 0-.737-.08-1.3-.178-1.853H12.24z"/>
            </svg>
            <span>Masuk Dengan Akun Google</span>
          </button>
        </div>
      ) : (
        /* KONDISI B: JIKA SUDAH LOGIN (SIAP KIRIM KOMENTAR) */
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-5 rounded-2xl shadow-xs space-y-4">
          <h4 className="font-bold text-sm text-gray-900 uppercase tracking-wider">Tinggalkan Tanggapan</h4>
          
          {msg && <p className="text-xs font-semibold text-orange-600">{msg}</p>}

          <textarea
            placeholder="Tulis opini, apresiasi, atau pertanyaan Anda mengenai materi ajar di sini..."
            rows={4}
            value={komentar}
            onChange={(e) => setKomentar(e.target.value)}
            className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 font-medium leading-relaxed"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs uppercase px-5 py-3 rounded-xl transition duration-200 disabled:opacity-50 tracking-wider cursor-pointer"
          >
            {loading ? 'Mengirim...' : 'Kirim Komentar'}
          </button>
        </form>
      )}
    </div>
  );
}