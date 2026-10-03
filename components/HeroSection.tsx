'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function HeroSection({ posts = [] }: { posts: any[] }) {
  const [beritaTerpopuler, setBeritaTerpopuler] = useState<any[]>([]);
  const headline = posts[0];
  const subHeadlines = posts.slice(1, 4);

  // Fungsi pembantu untuk mendapatkan pathname URL secara aman
  const getSafePath = (urlStr: string) => {
    try {
      return urlStr ? new URL(urlStr).pathname : '';
    } catch (e) {
      return '';
    }
  };

  // Fungsi pembantu untuk menghitung waktu relatif (Contoh: "5 jam lalu")
  const getRelativeTime = (dateStr: string) => {
    try {
      const now = new Date();
      const postDate = new Date(dateStr);
      const diffInMs = now.getTime() - postDate.getTime();
      
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 60) return `${diffInMinutes || 1} menit lalu`;
      if (diffInHours < 24) return `${diffInHours} jam lalu`;
      return `${diffInDays} hari lalu`;
    } catch (e) {
      return '';
    }
  };

  // AMBIL DATA TERPOPULER DARI SUPABASE REAL-TIME (LIMIT 10 UNTUK SCROLLING BOX)
  useEffect(() => {
    const fetchPopularHero = async () => {
      try {
        const { data: viewsData, error } = await supabase
          .from('artikel_views')
          .select('slug, views')
          .order('views', { ascending: false })
          .limit(10);

        if (!error && viewsData && viewsData.length > 0) {
          const matchedPopular = viewsData
            .map((viewItem) => {
              return posts.find((post: any) => {
                if (!post?.url) return false;
                return getSafePath(post.url) === viewItem.slug;
              });
            })
            .filter(Boolean);

          setBeritaTerpopuler(matchedPopular);
        }
      } catch (err) {
        console.error("Gagal memuat statistik terpopuler pada Hero Section:", err);
      }
    };

    if (posts.length > 0) {
      fetchPopularHero();
    }
  }, [posts]);

  // Fallback Pengaman: Mengambil 10 data urutan default slice apabila Supabase kosong
  const finalTerpopuler = beritaTerpopuler.length > 0 ? beritaTerpopuler : posts.slice(4, 14);

  if (!headline) return null;

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
      
      {/* LEFT SIDE: HERO HEADLINE */}
      <div className="lg:col-span-2">
        <Link href={getSafePath(headline.url)} className="block group">
          <div className="w-full h-64 md:h-[400px] bg-gray-200 rounded-2xl overflow-hidden relative shadow-xs">
            <img 
              src={headline.images?.[0]?.url || '/placeholder.jpg'} 
              alt={headline.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            />
          </div>
          <div className="pt-4 pb-5">
            <span className="text-xs text-gray-400 font-semibold tracking-wide">
              {getRelativeTime(headline.published)}
            </span>
            <h2 className="text-xl md:text-3xl font-black text-gray-950 tracking-tight leading-tight mt-1 group-hover:text-orange-600 transition">
              {headline.title}
            </h2>
          </div>
        </Link>

        {/* Sub Grid 3 Berita Bawah */}
        <div className="border-t border-gray-200/70 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-200/70">
            {subHeadlines.map((sh, index) => (
              <Link href={getSafePath(sh.url)} key={sh.id} className={`block group ${index > 0 ? 'md:pl-4 pt-3 md:pt-0' : ''}`}>
                <span className="text-xs text-gray-400 font-medium mb-1 block">
                  {getRelativeTime(sh.published)}
                </span>
                <h4 className="text-sm font-extrabold text-gray-900 leading-snug line-clamp-3 group-hover:text-orange-600 transition">
                  {sh.title}
                </h4>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: TERPOPULER (LIPUTAN6 GAYA SCROLL BOX) */}
      <div className="flex flex-col lg:pl-2 w-full">
        <div className="flex items-center space-x-2 border-b border-gray-200/70 pb-3 mb-2">
          <span className="w-1.5 h-5 bg-orange-600 rounded-full"></span>
          <h3 className="text-lg font-black text-gray-950 tracking-tight">Terpopuler</h3>
        </div>

        {/* Kontainer Box Utama dengan Pembatas Tinggi & Fitur Scroll Semat */}
        <div className="max-h-[460px] overflow-y-auto pr-2 divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {finalTerpopuler.map((bt, index) => (
            <Link href={getSafePath(bt.url)} key={bt.id || index} className="py-3.5 flex items-start space-x-4 block group border-b border-gray-100 last:border-none">
              <span className="text-5xl font-black text-transparent [-webkit-text-stroke:1.5px_#f97316] leading-none pt-0.5 min-w-[55px] group-hover:[-webkit-text-stroke:1.5px_#ea580c] transition text-center font-sans">
                {index + 1}
              </span>
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition">
                  {bt.title}
                </h4>
                <span className="text-[11px] text-gray-400 font-medium mt-1 block">
                  {getRelativeTime(bt.published)}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* TOMBOL SELENGKAPNYA MENEMBAK KE /popular (PERSIS LIPUTAN6) */}
        <div className="w-full text-center pt-5 border-t border-gray-100 mt-2">
          <Link 
            href="/popular" 
            className="text-sm font-bold text-orange-600 hover:text-orange-700 transition duration-200 flex items-center justify-center space-x-1 group/btn cursor-pointer"
          >
            <span>Selengkapnya</span>
            <span className="transform group-hover/btn:translate-x-1 transition-transform duration-200">&gt;</span>
          </Link>
        </div>

      </div>
    </section>
  );
}