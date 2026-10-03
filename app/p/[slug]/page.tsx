import React from 'react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { getPageByPath } from '../../../lib/blogger';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function StaticPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Rekonstruksi path sesuai format penyimpanan Blogger (/p/nama-halaman.html atau /p/nama-halaman)
  // Kita coba cari yang cocok dengan URL aslinya
  const currentPath = `/p/${slug}`;
  
  // Cari data dari fungsi API yang baru kita buat
  let pageData = await getPageByPath(currentPath);

  // Jika tidak ketemu, coba cari dengan ekstensi .html
  if (!pageData) {
    pageData = await getPageByPath(`/p/${slug}.html`);
  }

  // Jika benar-benar tidak ada di Blogger, lemparkan ke halaman 404
  if (!pageData) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#373d45]">
      <Header />

      <main className="max-w-[800px] mx-auto px-4 py-12 bg-white my-8 rounded-2xl shadow-xs border border-gray-100">
        <h1 className="text-3xl font-black text-gray-950 mb-6 border-b border-gray-100 pb-4">
          {pageData.title}
        </h1>
        
        {/* Render konten HTML bawaan Blogger secara aman */}
        <div 
          className="prose prose-orange max-w-none text-gray-800 leading-relaxed 
            [&_p]:mb-4 [&_a]:text-orange-600 [&_a]:underline hover:[&_a]:text-orange-700"
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      </main>

      <Footer />
    </div>
  );
}