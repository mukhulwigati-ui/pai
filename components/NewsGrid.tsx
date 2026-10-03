import React from 'react';
import Link from 'next/link';

// 1. Definisikan interface agar TypeScript mengenali 'posts'
interface NewsGridProps {
  posts: any[];
}

export default function NewsGrid({ posts }: NewsGridProps) {
  if (!posts || posts.length === 0) {
    return <div className="w-full text-center py-10">Belum ada berita.</div>;
  }

  return (
    <div className="mt-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-8">
        {posts.map((post: any) => {
          const img = post.images && post.images.length > 0 
            ? post.images[0].url 
            : "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=500&auto=format&fit=crop&q=60";
          
          const date = new Date(post.published).toLocaleDateString('id-ID', { 
            day: 'numeric', month: 'short' 
          });

          const urlObj = new URL(post.url);
          const path = urlObj.pathname; 

          return (
            <Link href={path} key={post.id} className="group cursor-pointer flex flex-col">
              <div className="w-full aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-sm">
                <img
                  src={img}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-350 ease-out"
                />
              </div>

              <h3 className="text-[15px] font-bold text-[#373d45] leading-snug mt-3 line-clamp-2 group-hover:text-orange-600 transition duration-200">
                {post.title}
              </h3>

              <span className="text-xs text-gray-400 font-medium mt-1.5">
                {date}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}