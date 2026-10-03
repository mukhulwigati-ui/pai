import { NextResponse } from 'next/server';
import { getPosts } from '@/lib/blogger';

export async function GET() {
  try {
    // 1. Ambil seluruh data artikel terbaru dari Blogger API
    const posts = await getPosts();
    
    // 2. Susun barisan item XML secara dinamis berdasarkan artikel
    let xmlItems = '';
    posts.forEach((post: any) => {
      try {
        const postPath = post.url ? new URL(post.url).pathname : '';
        if (!postPath) return;

        // Ambil snippet dan bersihkan secara aman dari karakter ilegal XML
        let cleanDescription = post.snippet || '';
        // Proteksi berlapis untuk karakter ampersand di dalam deskripsi item
        cleanDescription = cleanDescription
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        xmlItems += `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://www.guruonline.web.id${postPath}</link>
      <guid isPermaLink="true">https://www.guruonline.web.id${postPath}</guid>
      <pubDate>${new Date(post.published).toUTCString()}</pubDate>
      <description><![CDATA[${cleanDescription}]]></description>
    </item>`;
      } catch (e) {
        // Skip jika format data postingan corrupt
      }
    });

    // 3. Struktur XML dengan CDATA pada deskripsi utama untuk mencegah error ampersand
    const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Guru Online</title>
    <link>https://www.guruonline.web.id</link>
    <description><![CDATA[Platform Edukasi, Materi & Perangkat Ajar Guru Indonesia]]></description>
    <language>id-id</language>
    <atom:link href="https://www.guruonline.web.id/feed.xml" rel="self" type="application/rss+xml" />
    ${xmlItems}
  </channel>
</rss>`;

    // 4. Kembalikan respons XML murni
    return new NextResponse(rssFeed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    console.error("Gagal meracik RSS Feed internal:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}