import React, { Suspense } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getPosts } from '../../lib/blogger';
import Link from 'next/link';

// Fungsi pembantu untuk mengekstrak pathname secara aman
const getSafePath = (urlStr: string) => {
  try {
    return urlStr ? new URL(urlStr).pathname : '';
  } catch (e) {
    return '';
  }
};

// Komponen untuk menampilkan hasil pencarian bergaya Google x Liputan6
async function SearchResults({ query }: { query: string }) {
  const allPosts = await getPosts();
  
  // Filter postingan berdasarkan judul (case-insensitive)
  const results = allPosts.filter((post: any) =>
    post.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-[652px] space-y-6 font-sans">
      {results.length > 0 ? (
        results.map((post: any) => {
          const postPath = getSafePath(post.url);
          const formattedDate = new Date(post.published).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });

          // Ambil label pertama untuk simulasi breadcrumb Google
          const category = post.labels?.[0] || 'Berita';

          return (
            <div key={post.id} className="group flex flex-col">
              {/* 1. Baris Atas: Favicon Simulasi & Tautan Jalur Google Style */}
              <div className="flex items-center space-x-2.5 mb-1 text-xs text-[#4d5156] tracking-wide">
                <div className="w-6 h-6 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 select-none">
                  <span className="text-[10px] font-black text-orange-600">G</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-sm font-medium text-gray-900">Senyum</span>
                  <span className="text-xs text-[#4d5156] mt-0.5 truncate max-w-[250px] md:max-w-[400px]">
                    https://www.senyum.or.id › {category.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* 2. Baris Tengah: Judul Biru Khas Google Search */}
              <Link href={postPath} className="mt-1 inline-block">
                <h2 className="text-xl font-normal text-[#1a0dab] group-hover:underline leading-tight tracking-normal font-sans">
                  {post.title}
                </h2>
              </Link>

              {/* 3. Baris Bawah: Snippet Deskripsi Berwarna Abu-Abu Liputan6 */}
              <p className="text-[14px] text-[#555555] leading-relaxed mt-1 font-normal">
                <span className="text-[#70757a] font-medium mr-1.5">{formattedDate} —</span>
                {post.snippet || 'Klik untuk membaca ulasan informasi, materi, dan perangkat ajar dari senyum.or.id selengkapnya...'}
              </p>
            </div>
          );
        })
      ) : (
        <p className="text-left py-10 text-[15px] text-[#555555]">
          Tidak ada hasil ditemukan untuk kata kunci: <span className="font-bold">"{query}"</span>
        </p>
      )}
    </div>
  );
}

export default async function SearchPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | undefined }>; 
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || '';

  return (
    <div className="min-h-screen bg-white font-sans text-[#373d45]">
      <Header />
      
      {/* Container diatur agar simetris dengan layout Google (padding kiri dominan) */}
      <main className="max-w-[1000px] mx-auto px-4 md:px-8 py-8">
        <div className="mb-8 border-b border-gray-100 pb-4">
          <h1 className="text-sm text-[#70757a] font-normal font-sans">
            Sekitar {query ? '35' : '120'} hasil ditemukan untuk <span className="font-bold text-gray-800">{query ? `"${query}"` : 'Semua Berita'}</span>
          </h1>
        </div>

        {/* Suspense digunakan untuk menangani loading saat data diambil */}
        <Suspense fallback={<p className="text-left text-sm py-10 text-[#70757a]">Mencari berita...</p>}>
          <SearchResults query={query} />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}