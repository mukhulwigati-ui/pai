import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import HeroSection from '../components/HeroSection';
import NewsGrid from '../components/NewsGrid';
import VideoSection from '../components/VideoSection';
import BeritaPilihan from '../components/BeritaPilihan';
import CategoryBlocks from '../components/CategoryBlocks';
import { getPosts } from '../lib/blogger';

// ============================================================================
// SITE CONFIG
// ============================================================================

const SITE_NAME = 'Senyum.or.id';
const SITE_SHORT_NAME = 'Senyum';
const SITE_URL = 'https://www.senyum.or.id';
const SITE_TAGLINE = 'Senyum Guru, Pendidikan Maju';

const SITE_DESCRIPTION =
  'Senyum.or.id adalah media guru dan pendidikan Indonesia yang menyajikan berita pendidikan, informasi guru, perangkat ajar, materi pembelajaran, kurikulum, inspirasi mengajar, serta berbagai referensi pendidikan Indonesia.';

// ============================================================================
// DYNAMIC RENDERING
// ============================================================================

// Memastikan Vercel selalu mengambil data terbaru dari Blogger API
// ketika halaman diakses.
export const dynamic = 'force-dynamic';

// ============================================================================
// HOME PAGE
// ============================================================================

export default async function Home() {
  // Ambil data langsung dari Blogger API melalui Server Component
  const allPosts = await getPosts();

  // Proteksi jika Blogger API gagal / mengembalikan data bukan array
  const safePosts = Array.isArray(allPosts) ? allPosts : [];

  // ==========================================================================
  // JSON-LD / STRUCTURED DATA
  // ==========================================================================

  const jsonLdData = {
    '@context': 'https://schema.org',

    '@graph': [
      // ======================================================================
      // WEBSITE
      // ======================================================================
      {
        '@type': 'WebSite',

        '@id': `${SITE_URL}/#website`,

        url: SITE_URL,

        name: SITE_NAME,

        alternateName: [
          SITE_SHORT_NAME,
          'Senyum Guru',
        ],

        description: SITE_DESCRIPTION,

        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },

        potentialAction: {
          '@type': 'SearchAction',

          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },

          'query-input': 'required name=search_term_string',
        },

        inLanguage: 'id-ID',
      },

      // ======================================================================
      // ORGANIZATION
      // ======================================================================
      {
        '@type': 'Organization',

        '@id': `${SITE_URL}/#organization`,

        name: SITE_NAME,

        alternateName: SITE_SHORT_NAME,

        url: SITE_URL,

        slogan: SITE_TAGLINE,

        description: SITE_DESCRIPTION,

        logo: {
          '@type': 'ImageObject',

          '@id': `${SITE_URL}/#logo`,

          url: `${SITE_URL}/logo-senyum.png`,

          contentUrl: `${SITE_URL}/logo-senyum.png`,

          caption: `${SITE_NAME} - ${SITE_TAGLINE}`,
        },

        image: {
          '@id': `${SITE_URL}/#logo`,
        },
      },

      // ======================================================================
      // WEB PAGE
      // ======================================================================
      {
        '@type': 'WebPage',

        '@id': `${SITE_URL}/#webpage`,

        url: SITE_URL,

        name: `${SITE_NAME} - ${SITE_TAGLINE}`,

        description: SITE_DESCRIPTION,

        isPartOf: {
          '@id': `${SITE_URL}/#website`,
        },

        about: {
          '@id': `${SITE_URL}/#organization`,
        },

        primaryImageOfPage: {
          '@type': 'ImageObject',

          url: `${SITE_URL}/og-image.png`,

          width: 1200,

          height: 630,

          caption: `${SITE_NAME} - ${SITE_TAGLINE}`,
        },

        inLanguage: 'id-ID',
      },
    ],
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased text-[#373d45]">

      {/* ================================================================ */}
      {/* JSON-LD SEO */}
      {/* ================================================================ */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdData),
        }}
      />

      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}

      <Header />

      {/* ================================================================ */}
      {/* MAIN CONTENT */}
      {/* ================================================================ */}

      <main
        className="
          max-w-[1000px]
          mx-auto
          px-4
          py-8
          space-y-12

          [&_h1]:text-[#373d45]
          [&_h1]:font-bold

          [&_h2]:text-[#373d45]
          [&_h2]:font-bold

          [&_h3]:text-[#373d45]
          [&_h3]:font-bold

          [&_h4]:text-[#373d45]
          [&_h4]:font-bold

          [&_h5]:text-[#373d45]
          [&_h5]:font-bold

          [&_h6]:text-[#373d45]
          [&_h6]:font-bold

          [&_nav_a]:text-[#4b5461]
          [&_nav_a]:font-bold

          [&_nav_a:hover]:text-[#087F8C]

          [&_.group:hover_h1]:text-[#087F8C]
          [&_.group:hover_h2]:text-[#087F8C]
          [&_.group:hover_h3]:text-[#087F8C]
          [&_.group:hover_h4]:text-[#087F8C]
          [&_.group:hover_h5]:text-[#087F8C]

          [&_.group\/card:hover_h4]:text-[#087F8C]

          [&_nav_a.text-orange-600]:text-[#F15A24]

          [&_.text-orange-600]:text-[#F15A24]

          [&_.text-teal-600]:text-[#087F8C]
        "
      >

        {/* ============================================================ */}
        {/* EMPTY / ERROR STATE */}
        {/* ============================================================ */}

        {safePosts.length === 0 ? (
          <div
            className="
              w-full
              text-center
              py-20
              px-6
              border
              border-gray-200
              bg-white
              rounded-2xl
              shadow-sm
            "
          >
            <div
              className="
                w-12
                h-12
                mx-auto
                mb-5
                rounded-full
                border-4
                border-gray-200
                border-t-[#087F8C]
                animate-spin
              "
            />

            <p className="text-[#373d45] font-bold text-lg">
              Sedang memuat informasi pendidikan...
            </p>

            <p className="text-gray-500 text-sm mt-2">
              Mohon tunggu sebentar. Kami sedang mengambil data terbaru.
            </p>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* HERO / HEADLINE */}
            {/* ======================================================== */}

            <HeroSection posts={safePosts} />

            {/* ======================================================== */}
            {/* BERITA TERBARU */}
            {/* ======================================================== */}

            <NewsGrid posts={safePosts} />

            {/* ======================================================== */}
            {/* VIDEO */}
            {/* ======================================================== */}

            <VideoSection posts={safePosts} />

            {/* ======================================================== */}
            {/* BERITA PILIHAN */}
            {/* ======================================================== */}

            <BeritaPilihan posts={safePosts} />

            {/* ======================================================== */}
            {/* KATEGORI */}
            {/* ======================================================== */}

            <CategoryBlocks posts={safePosts} />
          </>
        )}

      </main>

      {/* ================================================================ */}
      {/* FOOTER */}
      {/* ================================================================ */}

      <Footer />
    </div>
  );
}