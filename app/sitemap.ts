import type { MetadataRoute } from 'next';
import { getPosts } from '../lib/blogger';

// ============================================================================
// CONFIG
// ============================================================================

const BASE_URL = 'https://www.senyum.or.id';

// ============================================================================
// HELPER
// ============================================================================

function safeDate(value?: string | Date | null): Date {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);

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
    console.error(
      'Gagal mengambil data Blogger untuk sitemap:',
      error
    );

    posts = [];
  }

  // ==========================================================================
  // HALAMAN STATIS
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
  // ARTIKEL
  // ==========================================================================

  const postEntries: MetadataRoute.Sitemap = [];

  for (const post of posts) {
    try {
      if (!post?.url) {
        continue;
      }

      const originalUrl = new URL(post.url);

      const pathname = originalUrl.pathname;

      postEntries.push({
        url: `${BASE_URL}${pathname}`,
        lastModified: safeDate(
          post.updated ||
          post.published
        ),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    } catch (error) {
      console.error(
        'Gagal membuat sitemap untuk artikel:',
        post?.url,
        error
      );
    }
  }

  // ==========================================================================
  // GABUNGKAN SEMUA URL
  // ==========================================================================

  const allEntries: MetadataRoute.Sitemap = [
    ...staticRoutes,
    ...postEntries,
  ];

  // ==========================================================================
  // HAPUS DUPLIKAT
  // ==========================================================================

  const uniqueEntriesMap = new Map<
    string,
    MetadataRoute.Sitemap[number]
  >();

  for (const entry of allEntries) {
    uniqueEntriesMap.set(
      entry.url,
      entry
    );
  }

  return Array.from(
    uniqueEntriesMap.values()
  );
}