import React from 'react';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import ShareButton from '../../../../components/ShareButton';
import Sidebar from '../../../../components/Sidebar';
import CommentSection from '../../../../components/CommentSection'; // Impor komponen komentar baru
import { getPostByPath, getPosts } from '../../../../lib/blogger';
import { supabase } from '../../../../lib/supabase';
import Link from 'next/link';
import { Metadata } from 'next';

interface BlogDetailProps {
  params: Promise<{ year: string; month: string; slug: string; }>;
}

// 1. RACIKAN SEO TAK TERTANDINGI: Metadata Dinamis untuk setiap artikel
export async function generateMetadata({ params }: BlogDetailProps): Promise<Metadata> {
  const { year, month, slug } = await params;
  const currentPath = `/${year}/${month}/${slug}`;
  const post = await getPostByPath(currentPath);

  if (!post) return { title: "Artikel Tidak Ditemukan" };

  // Bersihkan tag HTML dari konten untuk dijadikan deskripsi ringkas (160 karakter)
  const cleanSnippet = post.content
    ? post.content.replace(/<[^>]*>/g, '').substring(0, 160).trim()
    : 'Platform edukasi, materi, dan perangkat ajar guru Indonesia.';

  return {
    title: post.title,
    description: cleanSnippet,
    alternates: {
      // Menetapkan canonical ke domain utama untuk mencegah penalti konten duplikat dari Blogspot
      canonical: `https://www.guruonline.web.id${currentPath}`,
    },
    openGraph: {
      title: post.title,
      description: cleanSnippet,
      url: `https://www.guruonline.web.id${currentPath}`,
      type: 'article',
      publishedTime: post.published,
      images: post.images?.[0]?.url ? [{ url: post.images[0].url }] : [{ url: '/og-image.png' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: cleanSnippet,
      images: post.images?.[0]?.url ? [post.images[0].url] : ['/og-image.png'],
    },
  };
}

export default async function BlogDetail({ params }: BlogDetailProps) {
  const { year, month, slug } = await params;
  
  // Format path lengkap penanda artikel (Contoh: /2026/05/judul-artikel.html)
  const currentPath = `/${year}/${month}/${slug}`;
  const fullUrl = `https://www.guruonline.web.id${currentPath}`;
  
  const post = await getPostByPath(currentPath);
  const relatedPosts = await getPosts();

  if (!post) {
    return <div className="p-10 text-center min-h-screen">Artikel tidak ditemukan.</div>;
  }

  // 2. KONTEN KOMENTAR SUPABASE: Menggunakan currentPath agar pencarian komentar lebih spesifik & aman
  let comments: any[] = [];
  try {
    const { data } = await supabase
      .from('artikel_komentar')
      .select('id, nama, komentar, created_at')
      .eq('slug', currentPath) // Menggunakan currentPath agar konsisten dengan pendaftaran asal artikel
      .order('created_at', { ascending: true });
    
    if (data) comments = data;
  } catch (error) {
    console.error("Gagal memuat daftar komentar dari database Supabase:", error);
  }

  // 3. COUNTER HIT SUPABASE FIXED: Mengirimkan currentPath (path lengkap) ke RPC agar fungsi increment berjalan valid
  try {
    await supabase.rpc('increment_article_view', { article_slug: currentPath });
  } catch (error) {
    console.error("Gagal mengirim metrik kunjungan ke Supabase:", error);
  }

  const formattedDate = new Date(post.published).toLocaleDateString('id-ID', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });
  const formattedTime = new Date(post.published).toLocaleTimeString('id-ID', { 
    hour: '2-digit', minute: '2-digit' 
  });

  // Pemisahan paragraf untuk menyisipkan widget "Baca Juga" di tengah konten
  const contentParts = post.content.split('</p>');
  const half = Math.min(2, contentParts.length - 1); 
  const contentPart1 = contentParts.slice(0, half).join('</p>') + '</p>';
  const contentPart2 = contentParts.slice(half).join('</p>');

  // Fungsi pembantu parsing URL yang aman untuk menangani tautan internal
  const safeGetPathname = (urlStr: string) => {
    try {
      return new URL(urlStr).pathname;
    } catch (e) {
      return '/';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#373d45]">
      <Header />
      
      {/* Container utama diperbarui ke max-w-[1000px] */}
      <div className="max-w-[1000px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <main className="lg:col-span-2">
          {/* Breadcrumb */}
          <div className="flex space-x-2 text-xs text-gray-500 mb-4 uppercase tracking-widest font-bold">
            <Link href="/" className="hover:text-orange-600">Home</Link>
            <span>&gt;</span>
            <span className="text-gray-700">News</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-gray-900">{post.title}</h1>
          <p className="text-lg text-zinc-600 mb-6 font-medium leading-relaxed">{post.snippet}</p>

          <div className="w-full bg-[#f4f6f9] rounded-xl p-4 flex items-center justify-between mb-8 border border-gray-200 shadow-sm">
             <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" alt="Author" className="w-full h-full object-cover" />
                </div>
                <div className="text-sm">
                  <p className="font-bold text-[#0a58ca]">{post.author?.displayName || 'Admin'}</p>
                  <p className="text-xs text-gray-500">Diterbitkan {formattedDate}, {formattedTime} WIB</p>
                </div>
             </div>
             <ShareButton />
          </div>

          {/* KONTEN ARTIKEL BARIS 1 */}
          <article 
            className="prose prose-lg max-w-none text-[#333] leading-relaxed 
              [&_p]:mb-6 [&_p]:text-[17px] [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6
              [&_img]:rounded-xl [&_img]:mx-auto [&_img]:aspect-video [&_img]:object-cover [&_img]:w-full
              [&_iframe]:block [&_iframe]:mx-auto [&_iframe]:my-8 [&_iframe]:w-full [&_iframe]:max-w-[750px] [&_iframe]:aspect-video [&_iframe]:rounded-2xl [&_iframe]:shadow-xl"
            dangerouslySetInnerHTML={{ __html: contentPart1 }} 
          />

          {/* WIDGET BACA JUGA */}
          {relatedPosts.length > 0 && (
            <div className="bg-[#f2f2f2] p-6 my-8 rounded-lg border-l-4 border-orange-600">
              <h4 className="font-bold text-sm mb-4 tracking-wider text-gray-900">BACA JUGA</h4>
              <ul className="space-y-4">
                {relatedPosts.slice(0, 3).map((item: any) => (
                  <li key={item.id} className="flex items-start gap-3 group">
                    <span className="text-orange-600 text-xs mt-1.5 flex-shrink-0">■</span>
                    <Link href={safeGetPathname(item.url)} className="text-[16px] font-bold text-gray-800 hover:text-orange-600 transition">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* KONTEN ARTIKEL BARIS 2 */}
          <article 
            className="prose prose-lg max-w-none text-[#333] leading-relaxed 
              [&_p]:mb-6 [&_p]:text-[17px] [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6
              [&_img]:rounded-xl [&_img]:mx-auto [&_img]:aspect-video [&_img]:object-cover [&_img]:w-full
              [&_iframe]:block [&_iframe]:mx-auto [&_iframe]:my-8 [&_iframe]:w-full [&_iframe]:max-w-[750px] [&_iframe]:aspect-video [&_iframe]:rounded-2xl [&_iframe]:shadow-xl"
            dangerouslySetInnerHTML={{ __html: contentPart2 }} 
          />

          {/* SOSIAL MEDIA SHARE BUTTONS BAR */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-3 items-center justify-start">
            {/* Facebook */}
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-[#5071b2] text-white rounded-md text-sm font-semibold overflow-hidden shadow-xs hover:opacity-95 transition"
            >
              <span className="px-4 py-2.5 bg-black/10 flex items-center justify-center border-r border-white/20">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>
              </span>
              <span className="px-4 py-2.5">Facebook</span>
            </a>

            {/* Twitter / X */}
            <a 
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-[#24b9f5] text-white rounded-md text-sm font-semibold overflow-hidden shadow-xs hover:opacity-95 transition"
            >
              <span className="px-4 py-2.5 bg-black/10 flex items-center justify-center border-r border-white/20">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </span>
              <span className="px-4 py-2.5">Twitter</span>
            </a>

            {/* Pinterest */}
            <a 
              href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(fullUrl)}&description=${encodeURIComponent(post.title)}&media=${encodeURIComponent(post.images?.[0]?.url || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-[#cb2027] text-white rounded-md text-sm font-semibold overflow-hidden shadow-xs hover:opacity-95 transition"
            >
              <span className="px-4 py-2.5 bg-black/10 flex items-center justify-center border-r border-white/20">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.211-.174.256-.402.15-1.495-.698-2.43-2.889-2.43-4.649 0-3.793 2.75-7.279 7.942-7.279 4.167 0 7.407 2.974 7.407 6.944 0 4.141-2.61 7.472-6.233 7.472-1.214 0-2.356-.63-2.746-1.37l-.748 2.853c-.271 1.043-1.008 2.35-1.498 3.146 1.123.348 2.317.539 3.558.539 6.611 0 11.978-5.365 11.978-11.98C23.99 5.367 18.623 0 12.017 0z"/></svg>
              </span>
              <span className="px-4 py-2.5">Pinterest</span>
            </a>

            {/* WhatsApp */}
            <a 
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' - ' + fullUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center bg-[#72be68] text-white rounded-md text-sm font-semibold overflow-hidden shadow-xs hover:opacity-95 transition"
            >
              <span className="px-4 py-2.5 bg-black/10 flex items-center justify-center border-r border-white/20">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.454 5.709 1.455h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              </span>
              <span className="px-4 py-2.5">WhatsApp</span>
            </a>
          </div>

          {/* REKOMENDASI BAWAH ARTIKEL (FITUR DIUPDATE MENJADI 6 CARD) */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <h3 className="font-bold text-xl uppercase mb-6 text-gray-900 tracking-tight">REKOMENDASI</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.slice(0, 6).map((item: any) => (
                <Link href={safeGetPathname(item.url)} key={item.id} className="group block">
                  <div className="w-full aspect-video bg-gray-200 rounded-xl overflow-hidden mb-3 shadow-md border border-gray-100">
                    <img 
                      src={item.images?.[0]?.url || "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=300"} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-103 transition duration-300" 
                    />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                </Link>
              ))}
            </div>
          </div>

          {/* PLUG-IN FITUR KOMENTAR SECARA AMAN DENGAN SISTEM AUTH GOOGLE */}
          <CommentSection slug={currentPath} initialComments={comments} />
        </main>

        {/* Sidebar Kanan */}
        <Sidebar posts={relatedPosts || []} />
      </div>
      
      <Footer />
    </div>
  );
}