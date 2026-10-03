import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ============================================================================
// FONT
// ============================================================================

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ============================================================================
// SITE CONFIG
// ============================================================================

const SITE_NAME = "Senyum";
const SITE_DOMAIN = "senyum.or.id";
const SITE_URL = "https://www.senyum.or.id";
const SITE_TAGLINE = "Senyum Guru, Pendidikan Maju";

const SITE_DESCRIPTION =
  "Senyum.or.id adalah media pendidikan Indonesia yang menyajikan informasi guru, berita pendidikan, perangkat ajar, materi pembelajaran, kurikulum, inspirasi mengajar, serta berbagai referensi untuk mendukung kemajuan pendidikan Indonesia.";

// ============================================================================
// SEO METADATA
// ============================================================================

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  applicationName: SITE_NAME,

  title: {
    default: "Senyum.or.id - Senyum Guru, Pendidikan Maju",
    template: `%s | ${SITE_NAME}`,
  },

  description: SITE_DESCRIPTION,

  keywords: [
    "Senyum",
    "Senyum Guru",
    "Senyum Guru Pendidikan Maju",
    "senyum.or.id",
    "guru Indonesia",
    "pendidikan Indonesia",
    "berita pendidikan",
    "berita guru",
    "informasi guru",
    "media guru",
    "media pendidikan",
    "perangkat ajar",
    "materi pembelajaran",
    "materi guru",
    "modul ajar",
    "kurikulum",
    "kurikulum merdeka",
    "pembelajaran",
    "strategi pembelajaran",
    "strategi mengajar",
    "tips guru",
    "inspirasi guru",
    "referensi guru",
    "dunia pendidikan",
    "sekolah Indonesia",
    "pendidik Indonesia",
  ],

  authors: [
    {
      name: "Senyum.or.id",
      url: SITE_URL,
    },
  ],

  creator: "Senyum.or.id",
  publisher: "Senyum.or.id",

  category: "education",

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // ==========================================================================
  // CANONICAL
  // ==========================================================================

  alternates: {
    canonical: "/",
    languages: {
      "id-ID": "/",
    },
  },

  // ==========================================================================
  // ICON
  // ==========================================================================

  icons: {
    icon: [
      {
        url: "/favicon.ico",
      },
      {
        url: "/icon.png",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
    apple: [
      {
        url: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  // ==========================================================================
  // OPEN GRAPH / WHATSAPP / FACEBOOK
  // ==========================================================================

  openGraph: {
    type: "website",
    locale: "id_ID",

    url: SITE_URL,

    siteName: "Senyum.or.id",

    title: "Senyum.or.id - Senyum Guru, Pendidikan Maju",

    description:
      "Media guru dan pendidikan Indonesia. Temukan berita pendidikan, informasi guru, perangkat ajar, materi pembelajaran, kurikulum, dan inspirasi mengajar di Senyum.or.id.",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Senyum.or.id - Senyum Guru, Pendidikan Maju",
        type: "image/png",
      },
    ],
  },

  // ==========================================================================
  // X / TWITTER
  // ==========================================================================

  twitter: {
    card: "summary_large_image",

    title: "Senyum.or.id - Senyum Guru, Pendidikan Maju",

    description:
      "Media guru dan pendidikan Indonesia yang menghadirkan informasi, perangkat ajar, materi pembelajaran, dan inspirasi pendidikan.",

    images: ["/og-image.png"],
  },

  // ==========================================================================
  // ROBOTS / GOOGLE
  // ==========================================================================

  robots: {
    index: true,
    follow: true,

    nocache: false,

    googleBot: {
      index: true,
      follow: true,

      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ==========================================================================
  // OTHER META
  // ==========================================================================

  other: {
    "theme-color": "#087F8C",
    "apple-mobile-web-app-title": "Senyum",
    "mobile-web-app-capable": "yes",
  },
};

// ============================================================================
// VIEWPORT
// ============================================================================

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",

  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: "#ffffff",
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: "#087F8C",
    },
  ],
};

// ============================================================================
// ROOT LAYOUT
// ============================================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-gray-50 text-[#373d45]">
        {children}
      </body>
    </html>
  );
}