import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import ShareButton from '../../../../components/ShareButton';
import Sidebar from '../../../../components/Sidebar';
import CommentSection from '../../../../components/CommentSection';

import {
  getPostByPath,
  getPosts,
} from '../../../../lib/blogger';

import { supabaseAdmin } from '../../../../lib/supabase-admin';

// ============================================================================
// CONFIG
// ============================================================================

const SITE_URL = 'https://www.senyum.or.id';
const SITE_NAME = 'Senyum.or.id';

interface BlogDetailProps {
  params: Promise<{
    year: string;
    month: string;
    slug: string;
  }>;
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({
  params,
}: BlogDetailProps): Promise<Metadata> {
  const {
    year,
    month,
    slug,
  } = await params;

  const currentPath =
    `/${year}/${month}/${slug}`;

  const post =
    await getPostByPath(currentPath);

  if (!post) {
    return {
      title: 'Artikel Tidak Ditemukan',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // ==========================================================================
  // DESCRIPTION
  // ==========================================================================

  const cleanSnippet = post.content
    ? post.content
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .substring(0, 160)
        .trim()
    : 'Informasi guru dan pendidikan Indonesia di Senyum.or.id.';

  const canonicalUrl =
    `${SITE_URL}${currentPath}`;

  const imageUrl =
    post.images?.[0]?.url ||
    `${SITE_URL}/og-image.png`;

  return {
    title: post.title,

    description: cleanSnippet,

    alternates: {
      canonical: canonicalUrl,
    },

    openGraph: {
      title: post.title,

      description:
        cleanSnippet,

      url:
        canonicalUrl,

      siteName:
        SITE_NAME,

      type:
        'article',

      locale:
        'id_ID',

      publishedTime:
        post.published,

      images: [
        {
          url: imageUrl,
          alt: post.title,
        },
      ],
    },

    twitter: {
      card:
        'summary_large_image',

      title:
        post.title,

      description:
        cleanSnippet,

      images: [
        imageUrl,
      ],
    },

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };
}

// ============================================================================
// BLOG DETAIL
// ============================================================================

export default async function BlogDetail({
  params,
}: BlogDetailProps) {
  const {
    year,
    month,
    slug,
  } = await params;

  // ==========================================================================
  // PATH ARTIKEL
  // ==========================================================================

  const currentPath =
    `/${year}/${month}/${slug}`;

  const fullUrl =
    `${SITE_URL}${currentPath}`;

  // ==========================================================================
  // BLOGGER DATA
  // ==========================================================================

  const post =
    await getPostByPath(currentPath);

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        <div className="mx-auto max-w-[1000px] px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Artikel tidak ditemukan
          </h1>

          <Link
            href="/"
            className="mt-5 inline-block font-semibold text-[#087F8C] hover:underline"
          >
            Kembali ke Beranda
          </Link>
        </div>

        <Footer />
      </div>
    );
  }

  // ==========================================================================
  // RELATED POSTS
  // ==========================================================================

  let relatedPosts: any[] = [];

  try {
    const posts =
      await getPosts();

    relatedPosts =
      Array.isArray(posts)
        ? posts
        : [];
  } catch (error) {
    console.error(
      'Gagal mengambil artikel terkait:',
      error
    );

    relatedPosts = [];
  }

  // ==========================================================================
  // KOMENTAR SUPABASE
  // ==========================================================================

  let comments: any[] = [];

  try {
    const {
      data,
      error,
    } = await supabaseAdmin
      .from('senyum_comments')
      .select(`
        id,
        post_id,
        post_slug,
        post_title,
        name,
        message,
        status,
        parent_id,
        created_at,
        updated_at
      `)
      .eq(
        'post_slug',
        currentPath
      )
      .eq(
        'status',
        'approved'
      )
      .order(
        'created_at',
        {
          ascending: true,
        }
      );

    if (error) {
      console.error(
        'Gagal mengambil komentar dari Supabase:',
        error
      );
    } else {
      comments =
        data ?? [];
    }
  } catch (error) {
    console.error(
      'Gagal memuat daftar komentar:',
      error
    );

    comments = [];
  }

  // ==========================================================================
  // COUNTER VIEW
  // ==========================================================================

  try {
    const {
      error: viewError,
    } = await supabaseAdmin.rpc(
      'increment_article_view',
      {
        article_slug:
          currentPath,
      }
    );

    if (viewError) {
      console.error(
        'Gagal menambah jumlah view:',
        viewError
      );
    }
  } catch (error) {
    console.error(
      'Gagal mengirim metrik kunjungan:',
      error
    );
  }

  // ==========================================================================
  // FORMAT TANGGAL
  // ==========================================================================

  const publishedDate =
    new Date(post.published);

  const formattedDate =
    Number.isNaN(
      publishedDate.getTime()
    )
      ? ''
      : publishedDate.toLocaleDateString(
          'id-ID',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }
        );

  const formattedTime =
    Number.isNaN(
      publishedDate.getTime()
    )
      ? ''
      : publishedDate.toLocaleTimeString(
          'id-ID',
          {
            hour: '2-digit',
            minute: '2-digit',
          }
        );

  // ==========================================================================
  // SPLIT CONTENT
  // ==========================================================================

  const content =
    typeof post.content === 'string'
      ? post.content
      : '';

  const contentParts =
    content.split('</p>');

  const half =
    Math.min(
      2,
      Math.max(
        0,
        contentParts.length - 1
      )
    );

  const contentPart1 =
    contentParts
      .slice(0, half)
      .join('</p>') +
    (half > 0 ? '</p>' : '');

  const contentPart2 =
    contentParts
      .slice(half)
      .join('</p>');

  // ==========================================================================
  // URL HELPER
  // ==========================================================================

  const safeGetPathname = (
    urlStr: string
  ) => {
    try {
      return new URL(
        urlStr
      ).pathname;
    } catch {
      return '/';
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-[#373d45]">

      <Header />

      <div
        className="
          mx-auto
          grid
          max-w-[1000px]
          grid-cols-1
          gap-10
          px-4
          py-8
          lg:grid-cols-3
        "
      >
        {/* ================================================================ */}
        {/* MAIN */}
        {/* ================================================================ */}

        <main className="lg:col-span-2">

          {/* ============================================================= */}
          {/* BREADCRUMB */}
          {/* ============================================================= */}

          <div className="mb-4 flex space-x-2 text-xs font-bold uppercase tracking-widest text-gray-500">

            <Link
              href="/"
              className="transition hover:text-[#087F8C]"
            >
              Home
            </Link>

            <span>
              &gt;
            </span>

            <span className="text-gray-700">
              Artikel
            </span>

          </div>

          {/* ============================================================= */}
          {/* TITLE */}
          {/* ============================================================= */}

          <h1 className="mb-6 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            {post.title}
          </h1>

          {post.snippet && (
            <p className="mb-6 text-lg font-medium leading-relaxed text-zinc-600">
              {post.snippet}
            </p>
          )}

          {/* ============================================================= */}
          {/* AUTHOR */}
          {/* ============================================================= */}

          <div className="mb-8 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-[#f4f6f9] p-4 shadow-sm">

            <div className="flex items-center space-x-3">

              <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-300">

                <img
                  src="/icon.png"
                  alt="Senyum.or.id"
                  className="h-full w-full object-cover"
                />

              </div>

              <div className="text-sm">

                <p className="font-bold text-[#087F8C]">
                  {post.author?.displayName ||
                    'Senyum.or.id'}
                </p>

                <p className="text-xs text-gray-500">
                  Diterbitkan{' '}
                  {formattedDate}

                  {formattedTime &&
                    `, ${formattedTime} WIB`}
                </p>

              </div>

            </div>

            <ShareButton />

          </div>

          {/* ============================================================= */}
          {/* ARTIKEL BAGIAN 1 */}
          {/* ============================================================= */}

          <article
            className="
              prose
              prose-lg
              max-w-none
              leading-relaxed
              text-[#333]

              [&_p]:mb-6
              [&_p]:text-[17px]

              [&_ul]:ml-6
              [&_ul]:list-disc

              [&_ol]:ml-6
              [&_ol]:list-decimal

              [&_img]:mx-auto
              [&_img]:aspect-video
              [&_img]:w-full
              [&_img]:rounded-xl
              [&_img]:object-cover

              [&_iframe]:mx-auto
              [&_iframe]:my-8
              [&_iframe]:block
              [&_iframe]:aspect-video
              [&_iframe]:w-full
              [&_iframe]:max-w-[750px]
              [&_iframe]:rounded-2xl
              [&_iframe]:shadow-xl
            "
            dangerouslySetInnerHTML={{
              __html:
                contentPart1,
            }}
          />

          {/* ============================================================= */}
          {/* BACA JUGA */}
          {/* ============================================================= */}

          {relatedPosts.length >
            0 && (
            <div className="my-8 rounded-lg border-l-4 border-[#F15A24] bg-[#f2f2f2] p-6">

              <h4 className="mb-4 text-sm font-bold tracking-wider text-gray-900">
                BACA JUGA
              </h4>

              <ul className="space-y-4">

                {relatedPosts
                  .filter(
                    (item: any) =>
                      item?.url &&
                      safeGetPathname(
                        item.url
                      ) !==
                        currentPath
                  )
                  .slice(0, 3)
                  .map(
                    (
                      item: any
                    ) => (
                      <li
                        key={
                          item.id
                        }
                        className="group flex items-start gap-3"
                      >
                        <span className="mt-1.5 shrink-0 text-xs text-[#F15A24]">
                          ■
                        </span>

                        <Link
                          href={safeGetPathname(
                            item.url
                          )}
                          className="text-[16px] font-bold leading-snug text-gray-800 transition hover:text-[#087F8C]"
                        >
                          {
                            item.title
                          }
                        </Link>

                      </li>
                    )
                  )}

              </ul>

            </div>
          )}

          {/* ============================================================= */}
          {/* ARTIKEL BAGIAN 2 */}
          {/* ============================================================= */}

          <article
            className="
              prose
              prose-lg
              max-w-none
              leading-relaxed
              text-[#333]

              [&_p]:mb-6
              [&_p]:text-[17px]

              [&_ul]:ml-6
              [&_ul]:list-disc

              [&_ol]:ml-6
              [&_ol]:list-decimal

              [&_img]:mx-auto
              [&_img]:aspect-video
              [&_img]:w-full
              [&_img]:rounded-xl
              [&_img]:object-cover

              [&_iframe]:mx-auto
              [&_iframe]:my-8
              [&_iframe]:block
              [&_iframe]:aspect-video
              [&_iframe]:w-full
              [&_iframe]:max-w-[750px]
              [&_iframe]:rounded-2xl
              [&_iframe]:shadow-xl
            "
            dangerouslySetInnerHTML={{
              __html:
                contentPart2,
            }}
          />

          {/* ============================================================= */}
          {/* SHARE */}
          {/* ============================================================= */}

          <div className="mt-10 flex flex-wrap items-center justify-start gap-3 border-t border-gray-100 pt-6">

            {/* FACEBOOK */}

            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                fullUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex overflow-hidden rounded-md bg-[#5071b2] text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              <span className="flex items-center justify-center border-r border-white/20 bg-black/10 px-4 py-2.5">
                f
              </span>

              <span className="px-4 py-2.5">
                Facebook
              </span>
            </a>

            {/* X */}

            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                fullUrl
              )}&text=${encodeURIComponent(
                post.title
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex overflow-hidden rounded-md bg-black text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <span className="px-4 py-2.5">
                X / Twitter
              </span>
            </a>

            {/* WHATSAPP */}

            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `${post.title} - ${fullUrl}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex overflow-hidden rounded-md bg-[#25D366] text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              <span className="px-4 py-2.5">
                WhatsApp
              </span>
            </a>

            {/* PINTEREST */}

            <a
              href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(
                fullUrl
              )}&description=${encodeURIComponent(
                post.title
              )}&media=${encodeURIComponent(
                post.images?.[0]
                  ?.url || ''
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex overflow-hidden rounded-md bg-[#cb2027] text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              <span className="px-4 py-2.5">
                Pinterest
              </span>
            </a>

          </div>

          {/* ============================================================= */}
          {/* REKOMENDASI */}
          {/* ============================================================= */}

          <div className="mt-16 border-t border-gray-200 pt-8">

            <h3 className="mb-6 text-xl font-bold uppercase tracking-tight text-gray-900">
              Rekomendasi
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

              {relatedPosts
                .filter(
                  (item: any) =>
                    item?.url &&
                    safeGetPathname(
                      item.url
                    ) !==
                      currentPath
                )
                .slice(0, 6)
                .map(
                  (
                    item: any
                  ) => (
                    <Link
                      href={safeGetPathname(
                        item.url
                      )}
                      key={
                        item.id
                      }
                      className="group block"
                    >
                      <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl border border-gray-100 bg-gray-200 shadow-md">

                        <img
                          src={
                            item
                              .images?.[0]
                              ?.url ||
                            '/og-image.png'
                          }
                          alt={
                            item.title
                          }
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />

                      </div>

                      <h4 className="line-clamp-2 text-sm font-black leading-snug text-gray-900 transition group-hover:text-[#087F8C]">
                        {
                          item.title
                        }
                      </h4>

                    </Link>
                  )
                )}

            </div>

          </div>

          {/* ============================================================= */}
          {/* KOMENTAR */}
          {/* ============================================================= */}

          <CommentSection
            slug={currentPath}
            initialComments={comments}
          />

        </main>

        {/* ================================================================ */}
        {/* SIDEBAR */}
        {/* ================================================================ */}

        <Sidebar
          posts={
            relatedPosts ||
            []
          }
        />

      </div>

      <Footer />

    </div>
  );
}