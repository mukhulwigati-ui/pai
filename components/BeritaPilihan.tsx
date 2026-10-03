'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function BeritaPilihan({ posts = [] }: { posts: any[] }) {
  // Gunakan state untuk menyimpan data yang diacak setelah di-client
  const [shuffledPosts, setShuffledPosts] = useState<any[]>([]);

  useEffect(() => {
    // Acak hanya saat di sisi klien agar tidak terjadi hydration mismatch
    const shuffled = [...posts].sort(() => Math.random() - 0.5);
    setShuffledPosts(shuffled);
  }, [posts]);

  // Jika belum di-client, tampilkan urutan asli agar server dan client sama
  const displayPosts = shuffledPosts.length > 0 ? shuffledPosts : posts;

  const mainPost = displayPosts[0];
  const listKanan = displayPosts.slice(1, 4);
  const gridBawah = displayPosts.slice(4, 8);

  if (!mainPost) return null;

  return (
    <div className="mt-12 w-full">
      {/* HEADER KOMPONEN (tetap sama) */}
      <div className="flex items-center justify-between border-b border-gray-200/70 pb-4 mb-6">
        <div className="flex items-center space-x-2">
          <span className="w-1.5 h-6 bg-orange-600 rounded-full"></span>
          <h2 className="text-xl font-black text-gray-950 tracking-tight">Berita Pilihan</h2>
        </div>
      </div>

      {/* BLOK ATAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <Link href={new URL(mainPost.url).pathname} className="lg:col-span-2 group cursor-pointer block">
          <div className="w-full aspect-[16/10] bg-gray-100 rounded-2xl overflow-hidden relative shadow-xs">
            <img 
              src={mainPost.images?.[0]?.url || '/placeholder.jpg'} 
              alt={mainPost.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            />
          </div>
          <div className="mt-4">
            <span className="text-xs text-gray-400 font-semibold tracking-wide">
              {new Date(mainPost.published).toLocaleDateString('id-ID')}
            </span>
            <h3 className="text-xl md:text-2xl font-black text-gray-950 leading-tight mt-1 group-hover:text-orange-600 transition">
              {mainPost.title}
            </h3>
          </div>
        </Link>

        {/* LIST KANAN */}
        <div className="space-y-5 lg:pl-2">
          {listKanan.map((item) => (
            <Link href={new URL(item.url).pathname} key={item.id} className="flex items-start space-x-4 cursor-pointer group block">
              <div className="w-[95px] h-[95px] bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-xs">
                <img src={item.images?.[0]?.url || '/placeholder.jpg'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="flex-1">
                <span className="text-[11px] text-gray-400 font-medium">{new Date(item.published).toLocaleDateString('id-ID')}</span>
                <h4 className="text-sm font-extrabold text-gray-950 leading-snug line-clamp-3 mt-0.5 group-hover:text-orange-600 transition">
                  {item.title}
                </h4>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* GRID BAWAH (tetap sama) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-8 pt-8 border-t border-gray-200/70">
        {gridBawah.map((item) => (
          <Link href={new URL(item.url).pathname} key={item.id} className="group cursor-pointer block">
            <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-xs">
              <img src={item.images?.[0]?.url || '/placeholder.jpg'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <h4 className="text-sm font-extrabold text-gray-950 leading-snug mt-3 line-clamp-2 group-hover:text-orange-600 transition">
              {item.title}
            </h4>
          </Link>
        ))}
      </div>
    </div>
  );
}