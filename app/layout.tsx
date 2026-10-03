import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Racikan SEO Tak Tertandingi untuk Guru Online
export const metadata: Metadata = {
  metadataBase: new URL("https://www.guruonline.web.id"),
  title: {
    default: "Guru Online - Platform Edukasi, Materi & Perangkat Ajar Guru Indonesia",
    template: "%s | Guru Online"
  },
  description: "GuruOnline.web.id adalah platform edukasi yang menyediakan informasi, materi pembelajaran, perangkat ajar, serta tips dan strategi mengajar bagi guru dan pelajar di Indonesia. Temukan berbagai referensi pendidikan terbaru untuk meningkatkan kualitas belajar dan mengajar secara efektif.",
  keywords: [
    "Guru Online", 
    "perangkat ajar", 
    "materi pembelajaran", 
    "strategi mengajar", 
    "edukasi Indonesia", 
    "referensi pendidikan", 
    "kurikulum merdeka", 
    "tips guru",
    "guruonline.web.id"
  ],
  authors: [{ name: "Guru Online Team" }],
  creator: "Guru Online",
  publisher: "Guru Online",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico", // Pastikan file ini ada di folder public
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png", // Pastikan file ini ada di folder public
  },
  openGraph: {
    title: "Guru Online - Platform Edukasi & Perangkat Ajar Indonesia",
    description: "Temukan berbagai referensi pendidikan, materi pembelajaran, dan strategi mengajar terbaru secara efektif di GuruOnline.web.id.",
    url: "https://www.guruonline.web.id",
    siteName: "Guru Online",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/og-image.png", // Sediakan foto banner ukuran 1200x630 di folder public
        width: 1200,
        height: 630,
        alt: "Guru Online Platform Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guru Online - Platform Edukasi & Perangkat Ajar Indonesia",
    description: "Temukan berbagai referensi pendidikan, materi pembelajaran, dan strategi mengajar terbaru secara efektif.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id" // Diubah ke "id" agar mesin pencari tahu target utamanya adalah audiens Indonesia
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-[#373d45]">
        {children}
      </body>
    </html>
  );
}