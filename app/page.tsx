import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import NewsGrid from '../components/NewsGrid';
import VideoSection from '../components/VideoSection';
import BeritaPilihan from '../components/BeritaPilihan';
import CategoryBlocks from '../components/CategoryBlocks';
import { getPosts } from '../lib/blogger';

// Memastikan Vercel selalu mengambil data paling fresh dari Blogger API saat diakses pengguna
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Ambil data langsung di server component
  const allPosts = await getPosts();

  // Proteksi jika API Blogger down atau return data kosong agar web tidak blank putih
  const safePosts = Array.isArray(allPosts) ? allPosts : [];

  // Skema Rich Snippet (JSON-LD) Tingkat Tinggi untuk SEO Google Pencarian
  const jsonLdData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': 'https://www.guruonline.web.id/#website',
        'url': 'https://www.guruonline.web.id',
        'name': 'Guru Online',
        'description': 'Platform edukasi yang menyediakan informasi, materi pembelajaran, perangkat ajar, serta tips dan strategi mengajar bagi guru dan pelajar di Indonesia.',
        'publisher': {
          '@id': 'https://www.guruonline.web.id/#organization'
        },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://www.guruonline.web.id/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        },
        'inLanguage': 'id-ID'
      },
      {
        '@type': 'Organization',
        '@id': 'https://www.guruonline.web.id/#organization',
        'name': 'Guru Online',
        'url': 'https://www.guruonline.web.id',
        'logo': {
          '@type': 'ImageObject',
          '@id': 'https://www.guruonline.web.id/#logo',
          'url': 'https://www.guruonline.web.id/guru.png',
          'caption': 'Guru Online Logo'
        },
        'image': {
          '@id': 'https://www.guruonline.web.id/#logo'
        },
        'sameAs': [
          // Anda bisa menambahkan link media sosial resmi Guru Online di sini di masa mendatang
          'https://github.com/azharhanin002-web/guruonline'
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-[#373d45]">
      
      {/* Menyuntikkan Skema JSON-LD ke struktur HTML secara aman */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
      />
      
      <Header />

      {/* Memindahkan utilitas pemaksa warna teks (arbitrary variant) ke sini. 
        Gaya dipisah agar engine compiler Next.js/Turbopack bisa membaca data fetching dengan lancar.
      */}
      <main className="max-w-[1000px] mx-auto px-4 py-8 space-y-12 
        [&_h1]:text-[#373d45] [&_h1]:font-bold 
        [&_h2]:text-[#373d45] [&_h2]:font-bold 
        [&_h3]:text-[#373d45] [&_h3]:font-bold 
        [&_h4]:text-[#373d45] [&_h4]:font-bold 
        [&_h5]:text-[#373d45] [&_h5]:font-bold 
        [&_h6]:text-[#373d45] [&_h6]:font-bold
        [&_nav_a]:text-[#4b5461] [&_nav_a]:font-bold 
        [&_nav_a:hover]:text-orange-600 
        [&_.group:hover_h1]:text-orange-600 
        [&_.group:hover_h2]:text-orange-600 
        [&_.group:hover_h3]:text-orange-600 
        [&_.group:hover_h4]:text-orange-600 
        [&_.group:hover_h5]:text-orange-600 
        [&_.group\/card:hover_h4]:text-orange-600 
        [&_nav_a.text-orange-600]:text-orange-600 
        [&_.text-orange-600]:text-orange-600"
      >
        
        {/* Validasi data: jika data kosong, berikan feedback visual sementara */}
        {safePosts.length === 0 ? (
          <div className="w-full text-center py-20 border border-gray-200 bg-white rounded-2xl shadow-xs">
            <p className="text-gray-500 font-medium">Sedang memuat data dari Blogger atau token API Anda telah kedaluwarsa...</p>
          </div>
        ) : (
          <>
            {/* Distribusi data posts yang aman ke masing-masing komponen anak */}
            <HeroSection posts={safePosts} />
            
            <NewsGrid posts={safePosts} />
            
            <VideoSection posts={safePosts} />
            
            <BeritaPilihan posts={safePosts} />
            
            <CategoryBlocks posts={safePosts} />
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}