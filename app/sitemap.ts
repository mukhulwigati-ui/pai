import { MetadataRoute } from 'next';
import { getPosts } from '../lib/blogger';

// ============================================================================
// CONFIG
// ============================================================================

const BASE_URL = 'https://www.senyum.or.id';

// ============================================================================
// HELPER
// ============================================================================

function safeDate(value?: string | Date | null): Date {
  const date = value ? new Date(value) : new Date();

  return Number.isNaN(date.getTime())
    ? new Date()
    : date;
}

// ============================================================================
// SITEMAP
// ============================================================================

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // ==========================================================================
  // AMBIL DATA ARTIKEL
  // ==========================================================================

  let posts: any[] = [];

  try {
    const result = await getPosts();

    posts = Array.isArray(result)
      ? result
      : [];
  } catch (error) {
    console.error('Gagal mengambil data Blogger untuk sitemap:', error);

    posts = [];
  }

  // ==========================================================================
  // ARTIKEL
  // ==========================================================================

  const postEntries: MetadataRoute.Sitemap = posts
    .map((post: any) => {
      try {
        if (!post?.url) {
          return null;
        }

        const postUrl = new URL(post.url);
        const pathname = postUrl.pathname;

        return {
          url: `${BASE_URL}${pathname}`,
          lastModified: safeDate(
            post.updated ||
            post.published
          ),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        };
      } catch (error) {
        console.error(
          'Gagal membuat URL sitemap artikel:',
          post?.url,
          error
        );

        return null;
      }
    })
    .filter(
      (
        entry
      ): entry is MetadataRoute.Sitemap[number] =>
        entry !== null
    );

  // ==========================================================================
  // HALAMAN UTAMA / STATIS
  // ==========================================================================

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },

    {
      url: `${BASE_URL}/category/Berita`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },

    {
      url: `${BASE_URL}/category/Artikel`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },

    {
      url: `${BASE_URL}/category/Opini`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },

    {
      url: `${BASE_URL}/category/Kurikulum`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },

    {
      url: `${BASE_URL}/p/disclaimer`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ];

  // ==========================================================================
  // GABUNGKAN & HAPUS DUPLIKAT URL
  // ==========================================================================

  const combinedEntries = [
    ...staticRoutes,
    ...postEntries,
  ];

  const uniqueEntries = Array.from(
    new Map(
      combinedEntries.map((entry) => [
        entry.url,
        entry,
      ])
    ).values()
  );

  return uniqueEntries;
}