'use client';

import React, { useRef } from 'react';
import Link from 'next/link';

export default function VideoSection({ posts = [] }: { posts: any[] }) {
  const sliderRef = useRef<HTMLDivElement>(null);

  // Filter postingan yang memiliki label 'Video'
  const videoPosts = posts.filter(post => post.labels?.includes('Video'));

  // Ambil 1 video utama (index 0) dan sisanya untuk carousel shorts
  const mainVideo = videoPosts[0];
  const shorts = videoPosts.slice(1, 9);

  const geserKesamping = (arah: 'kiri' | 'kanan') => {
    if (sliderRef.current) {
      const jumlahGeser = 400;
      sliderRef.current.scrollBy({ 
        left: arah === 'kiri' ? -jumlahGeser : jumlahGeser, 
        behavior: 'smooth' 
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      
      {/* ================= BARIS 1: FEATURE VIDEO (ENAM+) ================= */}
      {mainVideo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden bg-black shadow-xs">
          <div className="relative w-full aspect-video md:h-[340px] bg-gray-900 group cursor-pointer">
            <Link href={new URL(mainVideo.url).pathname}>
              <img 
                src={mainVideo.images?.[0]?.url || '/placeholder.jpg'} 
                alt={mainVideo.title} 
                className="w-full h-full object-cover opacity-80"
              />
              <span className="absolute top-4 left-4 bg-green-700 text-white text-[11px] font-black px-2.5 py-0.5 rounded tracking-wider uppercase">
                VIDEO
              </span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-orange-600 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7 text-black group-hover:text-white ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
          <div className="p-8 md:p-12 flex flex-col justify-center items-start text-white bg-black">
            <h2 className="text-2xl font-bold tracking-tighter !text-white flex items-center select-none">
              ENAM<span className="text-orange-500 text-xl font-bold ml-0.5">+</span>
            </h2>
            <h3 className="text-lg md:text-xl font-bold !text-gray-100 mt-4 leading-snug tracking-tight">
              {mainVideo.title}
            </h3>
            <Link href={new URL(mainVideo.url).pathname} className="mt-6 bg-white hover:bg-orange-600 hover:text-white text-black font-extrabold text-xs md:text-sm px-6 py-3 rounded-xl shadow-md transition duration-300">
              Tonton Selengkapnya
            </Link>
          </div>
        </div>
      )}

      {/* ================= BARIS 2: CAROUSEL VIDEO PENDEK (SHORTS) ================= */}
      <div className="relative group/slider pt-2">
        <button onClick={() => geserKesamping('kiri')} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 hover:bg-orange-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover/slider:opacity-100 transition hidden md:flex">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.75-7.75" /></svg>
        </button>

        <div ref={sliderRef} className="flex space-x-4 overflow-x-auto scrollbar-none snap-x snap-mandatory py-1">
          {shorts.map((video) => (
            <Link href={new URL(video.url).pathname} key={video.id} className="flex-shrink-0 w-[145px] sm:w-[165px] aspect-[9/14] relative rounded-2xl overflow-hidden shadow-xs group/card cursor-pointer snap-start">
              <img 
                src={video.images?.[0]?.url || '/placeholder.jpg'} 
                alt={video.title} 
                className="w-full h-full object-cover group-hover/card:scale-105 transition duration-500"
              />
              
              {/* Overlay Konten & Ikon Play */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-between p-3.5 select-none">
                {/* Ikon Play di tengah Thumbnail */}
                <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover/card:scale-110 transition duration-300">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-white"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>

                <span className="text-[9px] !text-white/60 font-semibold tracking-wider self-end z-10">VIDEO</span>
                
                <div className="space-y-2 z-10">
                  <h4 className="text-[11px] sm:text-xs font-bold !text-white leading-snug line-clamp-3 group-hover/card:!text-orange-400 transition">
                    {video.title}
                  </h4>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <button onClick={() => geserKesamping('kanan')} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/80 hover:bg-orange-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover/slider:opacity-100 transition hidden md:flex">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
        </button>
      </div>
    </div>
  );
}