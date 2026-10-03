import React from 'react';
// Perbaikan path: naik 3 level (app/category/[slug]/ -> root)
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import Sidebar from '../../../components/Sidebar';
import { getPosts } from '../../../lib/blogger';
import Link from 'next/link';

interface CategoryProps {
  params: Promise<{ slug: string }>; // Sesuai dengan folder [slug]
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CategoryPage({ params, searchParams }: CategoryProps) {
  const { slug } = await params; // Mengambil dari [slug]
  const resolvedSearchParams = await searchParams;
  
  // Konfigurasi Pagination
  const page = Number(resolvedSearchParams['page']) || 1;
  const pageSize = 10;
  
  // Ambil data
  const allPosts = await getPosts();
  const decodedLabel = decodeURIComponent(slug);
  
  // Filter berdasarkan label
  const filteredPosts = allPosts.filter((post: any) => 
    post.labels?.includes(decodedLabel)
  );

  // Hitung data untuk halaman saat ini
  const totalPages = Math.ceil(filteredPosts.length / pageSize);
  const paginatedPosts = filteredPosts.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#373d45]">
      <Header />
      
      <main className="max-w-[1000px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <div className="lg:col-span-2">
          <div className="border-b border-gray-200 pb-4 mb-8">
            <h1 className="text-3xl font-black uppercase text-gray-950">
              Kategori: {decodedLabel}
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-8">
            {paginatedPosts.length > 0 ? (
              paginatedPosts.map((post: any) => (
                <Link href={new URL(post.url).pathname} key={post.id} className="group block flex gap-4 items-start">
                  <div className="w-1/3 aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-xs flex-shrink-0">
                    <img 
                      src={post.images?.[0]?.url || '/placeholder.jpg'} 
                      alt={post.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition leading-tight">
                      {post.title}
                    </h2>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(post.published).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center py-10 text-gray-500">Tidak ada berita untuk kategori ini.</p>
            )}
          </div>

          {/* Pagination Navigation - Diperbarui agar sesuai dengan /category/[slug] */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center space-x-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <Link 
                  key={i}
                  href={`/category/${slug}?page=${i + 1}`}
                  className={`px-4 py-2 rounded-lg font-bold ${
                    page === i + 1 
                      ? 'bg-orange-600 text-white' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <Sidebar posts={allPosts || []} />
      </main>
      
      <Footer />
    </div>
  );
}