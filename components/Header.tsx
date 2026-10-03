'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function Header() {
  const [isSticky, setIsSticky] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<any[]>([]);
  const router = useRouter();

  // 1. Ambil status login secara real-time dari Supabase Auth
  useEffect(() => {
    const getAuthSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };

    getAuthSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. DATA TRENDING INTERNAL: Mengambil 5-6 artikel teratas & dipangkas otomatis menjadi 2 kata saja
  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        const { data, error } = await supabase
          .from('artikel_views')
          .select('slug, views')
          .order('views', { ascending: false })
          .limit(6);

        if (!error && data && data.length > 0) {
          const formattedTrending = data.map((item) => {
            // Pecah segmen path untuk mengambil nama file di ujung paling akhir (membuang /2026/05/)
            const segments = item.slug.split('/');
            let rawTitle = segments[segments.length - 1] || '';

            // Hapus ekstensi .html di akhir string secara aman (case-insensitive)
            rawTitle = rawTitle.replace(/\.html$/i, '');

            // Ubah tanda hubung (-), underscore (_), atau spasi URL (%20) menjadi spasi biasa
            const cleanTitle = rawTitle
              .replace(/[-_]/g, ' ')
              .replace(/%20/g, ' ')
              .replace(/\b\w/g, (char: string) => char.toUpperCase());

            // FITUR PEMOTONG JUDUL: Hanya mengambil maksimal 2 kata pertama agar tampilan minimalis
            const words = cleanTitle.split(' ');
            const shortTitle = words.slice(0, 2).join(' ');

            return {
              title: shortTitle, // Menyimpan judul pendek hasil pangkasan
              path: item.slug    // Tetap menyimpan path utuh asli untuk rute navigasi klik
            };
          });
          setTrendingPosts(formattedTrending);
        }
      } catch (err) {
        console.error("Gagal memuat data trending internal:", err);
      }
    };

    fetchTrendingData();
  }, []);

  // 3. Efek Scroll Menu Sticky
  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 75);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 4. Tombol Handler Interaktif (Masuk OAuth / Keluar SignOut)
  const handleAuthAction = async () => {
    if (user) {
      await supabase.auth.signOut();
      router.refresh();
    } else {
      try {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.href,
          },
        });
      } catch (err) {
        console.error("Gagal memicu autentikasi Google:", err);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <>
      {/* ================= BARIS 1: LOGO, SEARCH BAR, MASUK ================= */}
      <div className="w-full bg-white border-b border-gray-100 md:border-none">
        <div className="max-w-[1000px] mx-auto px-4 py-3 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
          
          <div className="w-full md:w-auto flex items-center justify-between flex-shrink-0">
            <Link href="/">
              <img 
                src="/logo-senyum.png" 
                alt="Logo Senyum" 
                className="h-8 md:h-10 w-auto object-contain cursor-pointer"
              />
            </Link>

            <button 
              onClick={handleAuthAction}
              className={`md:hidden text-white font-bold text-xs px-4 py-2 rounded-full flex items-center space-x-1.5 transition cursor-pointer ${
                user ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              <span>{user ? 'Keluar' : 'Masuk'}</span>
            </button>
          </div>

          <form onSubmit={handleSearch} className="hidden md:flex md:flex-1 md:max-w-2xl items-center space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Berita apa yang ingin anda baca hari ini?"
              className="w-full px-5 py-2.5 border border-gray-200 rounded-full text-sm bg-white focus:outline-none focus:border-orange-500 placeholder-gray-400 shadow-3xs"
            />
            <button 
              type="submit" 
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-7 py-2.5 rounded-full uppercase tracking-wider transition flex-shrink-0 cursor-pointer"
            >
              Cari
            </button>
          </form>

          <button 
            onClick={handleAuthAction}
            className={`hidden md:flex text-white font-bold text-sm px-5 py-2.5 rounded-full items-center space-x-2 transition flex-shrink-0 cursor-pointer ${
              user ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-gray-900'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
            <span>{user ? 'Keluar' : 'Masuk'}</span>
          </button>
        </div>
      </div>

      {/* ================= BARIS 2: NAVIGASI MENU ================= */}
      <div 
        className={`w-full border-b border-gray-100 sticky top-0 z-50 transition-all duration-300 ease-in-out ${
          isSticky 
            ? 'bg-white/90 backdrop-blur-md shadow-md' 
            : 'bg-white shadow-none'
        }`}
      >
        <div className="max-w-[1000px] mx-auto px-4">
          <nav 
            className={`flex space-x-5 md:space-x-6 text-xs md:text-sm font-bold text-gray-800 overflow-x-auto scrollbar-none whitespace-nowrap transition-all duration-300 ease-in-out ${
              isSticky ? 'py-2.5' : 'py-3'
            }`}
          >
            <Link href="/" className="text-orange-600 border-b-2 border-orange-600 pb-3 -mb-3 tracking-wide">HOME</Link>
            <Link href="/category/Berita" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">BERITA</Link>
            <Link href="/category/Artikel" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">ARTIKEL</Link>
            <Link href="/category/Opini" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">OPINI</Link>
            <Link href="/category/Video" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">VIDEO</Link>
            <Link href="/category/Viral" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">VIRAL</Link>
            <Link href="/category/Kurikulum" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">KURIKULUM</Link>
            <Link href="/category/Tips%20dan%20Trik" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">TIPS DAN TRIK</Link>
            <Link href="/category/Kisah" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">KISAH</Link>
            <Link href="/category/Download" className="hover:text-orange-600 pb-3 -mb-3 transition tracking-wide">DOWNLOAD</Link>
            <Link href="/category/Lainnya" className="hover:text-orange-600 pb-3 -mb-3 transition flex items-center space-x-1 tracking-wide">
              <span>LAINNYA</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* ================= BARIS 3: TRENDING SECTION ================= */}
      <div className="w-full max-w-[1000px] mx-auto px-4 mt-4">
        <div className="border border-orange-100 bg-orange-50/20 rounded-xl p-2 md:p-2.5 flex items-center space-x-3 overflow-x-auto scrollbar-none">
          <div className="flex items-center space-x-1 text-orange-600 font-bold text-xs md:text-sm flex-shrink-0 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 md:w-4 md:h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 0 5.814-5.518l2.74-8.74m0 0-5.923 1.017M21.75 3.25l-1.017 5.923" />
            </svg>
            <span>Trending</span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] md:text-xs font-bold text-gray-800 whitespace-nowrap">
            {trendingPosts.length === 0 ? (
              /* Fallback Default jika statistik Supabase views kosong */
              <>
                <Link href="/search?q=Kurikulum%20Merdeka" className="bg-orange-100/40 hover:bg-orange-100/70 px-3 md:px-4 py-1.5 rounded-full transition">Kurikulum Merdeka</Link>
                <Link href="/search?q=Perangkat%20Ajar" className="bg-orange-100/40 hover:bg-orange-100/70 px-3 md:px-4 py-1.5 rounded-full transition">Perangkat Ajar</Link>
                <Link href="/search?q=Materi%20Belajar" className="bg-orange-100/40 hover:bg-orange-100/70 px-3 md:px-4 py-1.5 rounded-full transition">Materi Belajar</Link>
                <Link href="/search?q=Tips%20Guru" className="bg-orange-100/40 hover:bg-orange-100/70 px-3 md:px-4 py-1.5 rounded-full transition">Tips Guru</Link>
                <Link href="/search?q=Strategi%20Mengajar" className="bg-orange-100/40 hover:bg-orange-100/70 px-3 md:px-4 py-1.5 rounded-full transition">Strategi Mengajar</Link>
              </>
            ) : (
              /* Render data asli real-time dari hit-klik guruonline.web.id */
              trendingPosts.slice(0, 5).map((post, idx) => (
                <Link 
                  key={idx} 
                  href={post.path} 
                  className="bg-orange-100/40 hover:bg-orange-100/70 px-3 md:px-4 py-1.5 rounded-full transition"
                >
                  {post.title}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}