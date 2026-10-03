import React from 'react';
import Link from 'next/link';

export default function CategoryBlocks({ posts = [] }: { posts: any[] }) {
  // Definisi kanal dan label yang terkait (Kapital sesuai dengan label di Blogger)
  const kanalConfig = [
    { title: "Berita", label: "Berita" },
    { title: "Artikel", label: "Artikel" },
    { title: "Opini", label: "Opini" },
  ];

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-10">
      {kanalConfig.map((kanal, index) => {
        // Filter postingan berdasarkan label kategori
        const postsPerKanal = posts.filter(post => post.labels?.includes(kanal.label));
        const headline = postsPerKanal[0];
        const list = postsPerKanal.slice(1, 5);

        return (
          <div key={index} className="flex flex-col justify-between w-full">
            <div>
              {/* Nama Kanal */}
              <div className="flex items-center space-x-2 border-b border-gray-200/70 pb-3 mb-4">
                <span className="w-1.5 h-4 bg-orange-600 rounded-full"></span>
                <h3 className="text-base font-black text-gray-950 tracking-tight">{kanal.title}</h3>
              </div>

              {/* Berita Headline Utama Kanal */}
              {headline && (
                <Link href={new URL(headline.url).pathname} className="group cursor-pointer block mb-4">
                  <div className="w-full aspect-[16/10] bg-gray-100 rounded-2xl overflow-hidden shadow-xs">
                    <img 
                      src={headline.images?.[0]?.url || '/placeholder.jpg'} 
                      alt={headline.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                  <h4 className="text-[15px] font-extrabold text-gray-950 leading-snug mt-3 line-clamp-3 group-hover:text-orange-600 transition">
                    {headline.title}
                  </h4>
                  <span className="text-[11px] text-gray-400 font-semibold tracking-wide mt-1.5 block">
                    {new Date(headline.published).toLocaleDateString('id-ID')}
                  </span>
                </Link>
              )}

              {/* List Sub-Berita */}
              <div className="divide-y divide-gray-200/60 border-t border-gray-200/70">
                {list.map((item) => (
                  <Link href={new URL(item.url).pathname} key={item.id} className="py-3.5 block group">
                    <h5 className="text-[13.5px] font-bold text-gray-900 leading-snug line-clamp-3 group-hover:text-orange-600 transition">
                      {item.title}
                    </h5>
                    <span className="text-[11px] text-gray-400 font-medium mt-1 block">
                      {new Date(item.published).toLocaleDateString('id-ID')}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Tombol Selengkapnya - Perbaikan: Menggunakan kanal.label asli (Case-Sensitive) */}
            <div className="pt-4 border-t border-gray-200/70 mt-2">
              <Link 
                href={`/category/${kanal.label}`} 
                className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center space-x-1 transition w-max"
              >
                <span>Selengkapnya {kanal.title}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}