import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Sidebar from '@/components/Sidebar';
import { getPosts } from '@/lib/blogger';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// Memaksa halaman selalu mengambil data segar secara real-time
export const revalidate = 0;

interface PopularPageProps {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: PopularPageProps) {
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;
  return {
    title: `Berita & Artikel Terpopuler (Halaman ${currentPage}) - Guru Online`,
    description: 'Daftar artikel, materi pembelajaran, dan perangkat ajar yang paling banyak dibaca oleh bapak/ibu guru di seluruh Indonesia.',
    alternates: {
      canonical: `https://www.guruonline.web.id/popular${currentPage > 1 ? `?page=${currentPage}` : ''}`,
    },
  };
}

export default async function PopularPage({ searchParams }: PopularPageProps) {
  // 1. Tangkap parameter halaman aktif dari URL (?page=X)
  const { page } = await searchParams;
  const currentPage = page ? parseInt(page, 10) : 1;
  const itemsPerPage = 10; // Batasan muatan data: 10 artikel per halaman

  // 2. Ambil semua data artikel dari Blogger API
  const allPosts = await getPosts();
  let popularList: any[] = [];
  let totalItems = 0;

  const getSafePath = (urlStr: string) => {
    try {
      return urlStr ? new URL(urlStr).pathname : '';
    } catch (e) {
      return '';
    }
  };

  try {
    // 3. Hitung total seluruh baris data di tabel Supabase untuk menentukan jumlah halaman maks
    const { count } = await supabase
      .from('artikel_views')
      .select('*', { count: 'exact', head: true });
    
    totalItems = count || allPosts.length;

    // 4. Ambil data dari Supabase dengan teknik OFFSET (Range) sesuai halaman aktif
    const fromRange = (currentPage - 1) * itemsPerPage;
    const toRange = fromRange + itemsPerPage - 1;

    const { data: viewsData, error } = await supabase
      .from('artikel_views')
      .select('slug, views')
      .order('views', { ascending: false })
      .range(fromRange, toRange); // Mengambil data secara bertahap (Pagination Database)

    if (!error && viewsData && viewsData.length > 0) {
      popularList = viewsData
        .map((viewItem) => {
          const matchedPost = allPosts.find((post: any) => {
            if (!post?.url) return false;
            return getSafePath(post.url) === viewItem.slug;
          });

          if (matchedPost) {
            return {
              ...matchedPost,
              totalViews: viewItem.views,
            };
          }
          return null;
        })
        .filter(Boolean);
    }
  } catch (err) {
    console.error("Gagal memuat database halaman populer dengan pagination:", err);
  }

  // Fallback jika data Supabase kosong
  if (popularList.length === 0 && currentPage === 1) {
    popularList = allPosts.slice(0, itemsPerPage);
    totalItems = allPosts.length;
  }

  // Kalkulasi total halaman matematika dasar
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#373d45]">
      <Header />

      <div className="max-w-[1000px] mx-auto px-4 py-8">
        {/* Header Judul */}
        <div className="flex items-center space-x-3 border-b-2 border-gray-200 pb-4 mb-8">
          <span className="w-2 h-7 bg-orange-600 rounded-full"></span>
          <h1 className="text-2xl md:text-3xl font-black text-gray-950 tracking-tight uppercase">
            Trending & Terpopuler
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* SISI KIRI: LIST BERITA */}
          <main className="lg:col-span-2 flex flex-col justify-between">
            <div className="space-y-6">
              {popularList.length === 0 ? (
                <div className="text-center py-12 text-gray-500 font-medium">Tidak ada artikel di halaman ini.</div>
              ) : (
                popularList.map((post: any, index: number) => {
                  // Hitung nomor peringkat asli kumulatif antar halaman
                  const globalIndex = (currentPage - 1) * itemsPerPage + index + 1;
                  const postPath = getSafePath(post.url);
                  
                  return (
                    <div 
                      key={post.id || index} 
                      className="flex flex-col md:flex-row bg-white rounded-2xl p-4 border border-gray-100 shadow-3xs hover:shadow-xs transition duration-200 gap-5 items-start relative group"
                    >
                      <div className="absolute -top-3 -left-3 w-10 h-10 bg-orange-600 text-white font-black rounded-xl flex items-center justify-center text-lg shadow-md border border-orange-500 z-10 font-sans">
                        {globalIndex}
                      </div>

                      <div className="w-full md:w-48 aspect-video bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                        <img 
                          src={post.images?.[0]?.url || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400'} 
                          alt={post.title} 
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between h-full space-y-2">
                        <div>
                          <span className="text-[10px] bg-orange-50 text-orange-600 font-black px-2.5 py-1 rounded-md uppercase tracking-wider inline-block mb-1">
                            {post.labels?.[0] || 'EDUKASI'}
                          </span>
                          <Link href={postPath}>
                            <h2 className="text-base md:text-lg font-black text-gray-950 leading-snug group-hover:text-orange-600 transition cursor-pointer line-clamp-2">
                              {post.title}
                            </h2>
                          </Link>
                          <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 font-medium">
                            {post.snippet || 'Klik untuk membaca ulasan lengkap materi edukasi ini selengkapnya...'}
                          </p>
                        </div>

                        <div className="flex items-center space-x-4 text-xs font-semibold text-gray-400 pt-2 border-t border-gray-50">
                          <span className="flex items-center text-orange-600/80 bg-orange-50/50 px-2 py-0.5 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            </svg>
                            {post.totalViews || 0} dibaca
                          </span>
                          <span>
                            {new Date(post.published).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* KOMPONEN TOMBOL NAVIGASI PAGINATION */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-4 mt-12 pt-6 border-t border-gray-200">
                {hasPrevPage ? (
                  <Link 
                    href={`/popular?page=${currentPage - 1}`}
                    className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 hover:text-orange-600 text-sm font-bold rounded-xl shadow-3xs transition cursor-pointer select-none"
                  >
                    ← Sebelumnya
                  </Link>
                ) : (
                  <span className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-bold rounded-xl border border-gray-200 opacity-60 cursor-not-allowed select-none">
                    ← Sebelumnya
                  </span>
                )}

                <span className="text-sm font-black text-gray-800">
                  Halaman {currentPage} dari {totalPages}
                </span>

                {hasNextPage ? (
                  <Link 
                    href={`/popular?page=${currentPage + 1}`}
                    className="px-4 py-2 bg-white border border-gray-200 hover:border-orange-500 hover:text-orange-600 text-sm font-bold rounded-xl shadow-3xs transition cursor-pointer select-none"
                  >
                    Selanjutnya →
                  </Link>
                ) : (
                  <span className="px-4 py-2 bg-gray-100 text-gray-400 text-sm font-bold rounded-xl border border-gray-200 opacity-60 cursor-not-allowed select-none">
                    Selanjutnya →
                  </span>
                )}
              </div>
            )}
          </main>

          {/* SISI KANAN: SIDEBAR */}
          <Sidebar posts={allPosts || []} />
        </div>
      </div>

      <Footer />
    </div>
  );
}