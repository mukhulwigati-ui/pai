import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface SidebarProps {
  posts: any[];
}

export default async function Sidebar({ posts = [] }: SidebarProps) {
  let populerPosts: any[] = [];

  // Fungsi pembantu untuk ekstraksi pathname URL secara aman
  const getSafePath = (urlStr: string) => {
    try {
      return urlStr ? new URL(urlStr).pathname : '#';
    } catch (e) {
      return '#';
    }
  };

  try {
    // 1. Ambil 10 artikel dengan akumulasi views tertinggi dari database Supabase
    const { data: viewsData, error } = await supabase
      .from('artikel_views')
      .select('slug, views')
      .order('views', { ascending: false })
      .limit(10);

    if (!error && viewsData && viewsData.length > 0) {
      // 2. Cocokkan slug path lengkap dari Supabase dengan data post utuh milik Blogger
      populerPosts = viewsData
        .map((viewItem) => {
          return posts.find((post: any) => {
            if (!post?.url) return false;
            // Samakan pembanding menggunakan format pathname lengkap (Contoh: /2026/05/nama-file.html)
            const currentPostPath = getSafePath(post.url);
            return currentPostPath === viewItem.slug;
          });
        })
        .filter(Boolean); // Bersihkan elemen undefined jika ada artikel yang tidak sinkron
    }
  } catch (err) {
    console.error("Gagal memuat statistik riwayat populer dari Supabase:", err);
  }

  // Fallback pengaman: Jika data Supabase masih kosong/gagal, gunakan slice bawaan Blogger
  if (populerPosts.length === 0) {
    populerPosts = posts.slice(0, 10);
  }

  // Berita terkini murni mengambil 5 artikel paling baru tanpa manipulasi urutan
  const terkiniPosts = posts.slice(0, 5);

  return (
    <aside className="lg:col-span-1 space-y-10">
      
      {/* 1. TOPIK POPULER (TAGS) */}
      <div>
        <h3 className="font-bold text-lg border-b-2 border-gray-300 pb-2 mb-4 uppercase tracking-wider text-[#373d45]">
          TOPIK POPULER
        </h3>
        <div className="space-y-1">
          {["KURIKULUM MERDEKA", "PERANGKAT AJAR", "STRATEGI MENGAJAR", "TIPS GURU", "MATERI BELAJAR"].map(tag => (
            <p key={tag} className="font-bold text-sm py-3 border-b border-gray-200/60 cursor-pointer hover:text-orange-600 transition flex items-center text-gray-700">
              <span className="text-orange-600 mr-2">#</span> {tag}
            </p>
          ))}
        </div>
      </div>

      {/* 2. WIDGET POPULER REAL-TIME */}
      <div>
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-4">
          <h3 className="font-bold text-lg uppercase tracking-wider text-[#373d45]">POPULER</h3>
        </div>
        
        {/* Desain Banner Utama Peringkat 1 Populer */}
        {populerPosts[0] && (
          <Link href={getSafePath(populerPosts[0].url)} className="mb-5 block group cursor-pointer">
            <div className="w-full aspect-video bg-gray-100 rounded-xl mb-2.5 overflow-hidden shadow-xs border border-gray-200/50">
              <img 
                src={populerPosts[0].images?.[0]?.url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60"} 
                alt={populerPosts[0].title} 
                className="w-full h-full object-cover group-hover:scale-103 transition duration-300 ease-out" 
              />
            </div>
            <p className="text-sm font-black text-gray-950 group-hover:text-orange-600 transition leading-snug line-clamp-2">
              {populerPosts[0].title}
            </p>
          </Link>
        )}

        {/* List Sisa Artikel Populer Urutan 2-10 (Menghindari Duplikasi dengan Banner Atas) */}
        <div className="space-y-5 mt-4">
          {populerPosts.slice(1).map((post: any, index: number) => {
            return (
              <Link href={getSafePath(post.url)} key={post.id || index} className="flex gap-4 items-start group cursor-pointer">
                <span className="text-4xl font-black text-gray-200 font-sans leading-none group-hover:text-orange-600 transition w-8 flex-shrink-0 text-center">
                  {index + 2}
                </span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase text-gray-400 font-black tracking-wider mb-0.5">
                    {post.labels?.[0] || 'EDUKASI'}
                  </span>
                  <p className="text-sm font-bold text-gray-800 leading-snug group-hover:text-orange-600 transition line-clamp-2">
                    {post.title}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. WIDGET BERITA TERKINI */}
      <div>
        <div className="flex justify-between items-center border-b border-gray-300 pb-2 mb-4">
          <h3 className="font-bold text-lg uppercase tracking-wider text-[#373d45]">BERITA TERKINI</h3>
        </div>
        
        <div className="space-y-4">
          {terkiniPosts.map((post: any, index: number) => {
            return (
              <Link href={getSafePath(post.url)} key={post.id || index} className="block group cursor-pointer">
                <div className="flex gap-3 items-start">
                  {index === 0 ? (
                    <div className="w-full">
                      <div className="w-full aspect-video bg-gray-100 rounded-xl mb-2 overflow-hidden shadow-xs border border-gray-200/50">
                        <img 
                          src={post.images?.[0]?.url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60"} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-300 ease-out" 
                        />
                      </div>
                      <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition leading-snug line-clamp-2">{post.title}</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200/50">
                        <img 
                          src={post.images?.[0]?.url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&auto=format&fit=crop&q=60"} 
                          alt={post.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <p className="text-xs font-bold text-gray-800 leading-snug group-hover:text-orange-600 transition line-clamp-2">{post.title}</p>
                    </>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}