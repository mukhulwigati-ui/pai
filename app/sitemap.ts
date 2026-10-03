import { MetadataRoute } from 'next';
import { getPosts } from '../lib/blogger';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.guruonline.web.id';

  // Ambil semua artikel dari Blogger untuk dimasukkan ke sitemap
  const posts = await getPosts();
  
  const postEntries: MetadataRoute.Sitemap = posts.map((post: any) => {
    try {
      const path = new URL(post.url).pathname;
      return {
        url: `${baseUrl}${path}`,
        lastModified: new Date(post.published),
        changeFrequency: 'weekly',
        priority: 0.7,
      };
    } catch (e) {
      return {
        url: baseUrl,
        lastModified: new Date(),
      };
    }
  });

  // Halaman-halaman statis utama Anda
  const routes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/category/Berita`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/category/Artikel`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/category/Opini`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/category/Kurikulum`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/p/disclaimer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  return [...routes, ...postEntries];
}