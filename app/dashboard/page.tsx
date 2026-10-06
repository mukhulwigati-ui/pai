'use client';

import Link from 'next/link';
import Image from 'next/image';

import {
  Suspense,
  useEffect,
  useState,
} from 'react';

import {
  useRouter,
  useSearchParams,
} from 'next/navigation';

import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LockKeyhole,
  School,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

/* ============================================================
   KONFIGURASI SEKOLAH
============================================================ */

const SCHOOL_NAME =
  'Sekolah Dasar Islam Terpadu Khoiro Ummah';

const SCHOOL_SHORT_NAME =
  'SDIT Khoiro Ummah';

/* ============================================================
   QUICK MENU
============================================================ */

const menus = [
  {
    title:
      'Ustadz & Ustadzah',

    description:
      'Kelola data ustadz, ustadzah, dan akun pengajar.',

    href:
      '/dashboard/teachers',

    icon:
      Users,

    color:
      'emerald',
  },

  {
    title:
      'Siswa',

    description:
      'Kelola data siswa dan penempatan kelas.',

    href:
      '/dashboard/students',

    icon:
      GraduationCap,

    color:
      'cyan',
  },

  {
    title:
      'Kelas',

    description:
      'Kelola kelas jenjang SD tingkat 1 sampai 6.',

    href:
      '/dashboard/classes',

    icon:
      School,

    color:
      'teal',
  },

  {
    title:
      'Mata Pelajaran',

    description:
      'Kelola mata pelajaran jenjang SD.',

    href:
      '/dashboard/subjects',

    icon:
      BookOpen,

    color:
      'blue',
  },

  {
    title:
      'Kurikulum',

    description:
      'Kelola CP dan TP pembelajaran.',

    href:
      '/dashboard/curriculum',

    icon:
      FileText,

    color:
      'amber',
  },

  {
    title:
      'Input Asesmen',

    description:
      'Masukkan nilai formatif dan sumatif siswa.',

    href:
      '/dashboard/assessment',

    icon:
      ClipboardCheck,

    color:
      'violet',
  },
];

/* ============================================================
   COLOR MAP
============================================================ */

const colorMap:
  Record<
    string,
    string
  > = {
  emerald:
    'bg-emerald-50 text-emerald-700 ring-emerald-100',

  cyan:
    'bg-cyan-50 text-cyan-700 ring-cyan-100',

  teal:
    'bg-teal-50 text-teal-700 ring-teal-100',

  blue:
    'bg-blue-50 text-blue-700 ring-blue-100',

  amber:
    'bg-amber-50 text-amber-700 ring-amber-100',

  violet:
    'bg-violet-50 text-violet-700 ring-violet-100',
};

/* ============================================================
   DASHBOARD CONTENT
============================================================ */

function DashboardContent() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const [
    showForbidden,
    setShowForbidden,
  ] =
    useState(false);

  /* ==========================================================
     DETEKSI FORBIDDEN
  ========================================================== */

  useEffect(() => {
    const error =
      searchParams.get(
        'error'
      );

    if (
      error ===
      'forbidden'
    ) {
      setShowForbidden(
        true
      );
    }
  }, [
    searchParams,
  ]);

  /* ==========================================================
     CLOSE FORBIDDEN
  ========================================================== */

  const closeForbidden =
    () => {
      setShowForbidden(
        false
      );

      router.replace(
        '/dashboard'
      );
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f5f7f5]">

      {/* ======================================================
          HEADER / HERO
      ======================================================= */}

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/sdit.png"
              alt="Logo SDIT Khoiro Ummah"
              width={64}
              height={64}
              priority
              className="h-16 w-16 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">E-Rapor</h1>
              <p className="mt-2 text-base font-medium text-slate-600">{SCHOOL_SHORT_NAME}</p>
            </div>
          </div>
          <div dir="rtl" className="font-serif text-2xl leading-relaxed text-emerald-700">
            بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
          </div>
        </div>
      </section>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <section className="mx-auto max-w-6xl px-5 py-7 sm:px-8 lg:py-9">

        {/* ====================================================
            WELCOME
        ===================================================== */}

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />

              <span className="text-base font-semibold uppercase tracking-wider text-emerald-700">
                Dashboard
              </span>

            </div>

            <h2 className="text-2xl font-bold tracking-tight text-slate-800">
              Selamat Datang 👋
            </h2>

            <p className="mt-1.5 max-w-2xl text-base leading-6 text-slate-600">
              Kelola data akademik dan rapor siswa dengan mudah.
            </p>

          </div>

          {/* STATUS */}

          <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3.5 py-2.5 shadow-sm">

            <ShieldCheck
              size={17}
              className="text-emerald-600"
            />

            <div>

              <p className="text-base font-semibold uppercase tracking-wide text-slate-600">
                Status Sistem
              </p>

              <p className="text-base font-semibold text-emerald-700">
                Sistem Aktif
              </p>

            </div>

            <span className="ml-1 h-2 w-2 rounded-full bg-emerald-500" />

          </div>

        </div>

        {/* ====================================================
            QUICK INTRO
        ===================================================== */}

        <div className="mb-7 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">

          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                <Image
                  src="/sdit.png"
                  alt="Logo SDIT Khoiro Ummah"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />

              </div>

              <div>

                <h3 className="font-semibold text-slate-800">
                  Pusat Pengelolaan Akademik
                </h3>

                <p className="mt-1 max-w-2xl text-base leading-6 text-slate-600">
                  Pilih menu untuk mulai mengelola data sekolah.
                </p>

              </div>

            </div>

            <div
              dir="rtl"
              className="font-serif text-lg font-semibold text-emerald-700"
            >
              وَقُلْ رَبِّ زِدْنِي عِلْمًا
            </div>

          </div>

          <div className="h-1 bg-gradient-to-r from-emerald-700 via-emerald-500 to-amber-400" />

        </div>

        {/* ====================================================
            AKSES CEPAT
        ===================================================== */}

        <div className="mb-4">

          <h3 className="text-lg font-bold text-slate-800">
            Akses Cepat
          </h3>

          <p className="mt-1 text-base text-slate-600">
            Pilih modul yang ingin Anda kelola.
          </p>

        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {menus.map(
            (
              menu
            ) => {
              const Icon =
                menu.icon;

              return (
                <Link
                  key={
                    menu.title
                  }
                  href={
                    menu.href
                  }
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >

                  <div className="absolute left-0 right-0 top-0 h-0.5 bg-gradient-to-r from-emerald-600 to-amber-400 opacity-0 transition group-hover:opacity-100" />

                  <div className="mb-5 flex items-start justify-between">

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ring-1 ${
                        colorMap[
                          menu.color
                        ]
                      }`}
                    >

                      <Icon
                        size={21}
                        strokeWidth={
                          1.8
                        }
                      />

                    </div>

                    <ArrowRight
                      size={17}
                      className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
                    />

                  </div>

                  <h4 className="text-lg font-bold text-slate-800">
                    {
                      menu.title
                    }
                  </h4>

                  <p className="mt-1.5 min-h-[48px] text-base leading-6 text-slate-600">
                    {
                      menu.description
                    }
                  </p>

                  <div className="mt-4 flex items-center gap-1.5 text-base font-semibold text-emerald-700">

                    Buka Modul

                    <ArrowRight
                      size={12}
                    />

                  </div>

                </Link>
              );
            }
          )}

        </div>

        {/* ====================================================
            SCHOOL INFORMATION
        ===================================================== */}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">

          <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">

            <InfoItem
              label="Jenjang"
              value="Sekolah Dasar"
            />

            <InfoItem
              label="Sistem"
              value="E-Rapor Akademik"
            />

            <InfoItem
              label="Lembaga"
              value={
                SCHOOL_SHORT_NAME
              }
              last
            />

          </div>

        </div>

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-base font-semibold text-slate-600">
              {SCHOOL_NAME}
            </p>

            <p className="mt-0.5 text-base text-slate-600">
              Sistem E-Rapor &amp; Manajemen Akademik
            </p>

          </div>

          <div
            dir="rtl"
            className="font-serif text-base text-slate-600"
          >
            رَبِّ زِدْنِي عِلْمًا
          </div>

        </div>

      </section>

      {/* ======================================================
          POPUP AKSES DITOLAK
      ======================================================= */}

      {showForbidden && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forbidden-title"
        >

          <div
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
            onClick={(
              e
            ) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              onClick={
                closeForbidden
              }
              aria-label="Tutup"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-slate-700"
            >

              <X
                size={18}
              />

            </button>

            <div className="flex justify-center pt-8">

              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-50">

                <div className="absolute inset-0 animate-pulse rounded-full border-4 border-red-100" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-red-100">

                  <LockKeyhole
                    size={27}
                    strokeWidth={
                      2
                    }
                    className="text-red-600"
                  />

                </div>

              </div>

            </div>

            <div className="px-7 pb-8 pt-5 text-center">

              <div className="mb-2 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-base font-bold uppercase tracking-wider text-red-600">
                Akses Terbatas
              </div>

              <h2
                id="forbidden-title"
                className="text-xl font-bold tracking-tight text-slate-800"
              >
                Akses Ditolak
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-base leading-6 text-slate-600">
                Maaf, Anda tidak memiliki izin untuk mengakses halaman yang Anda buka.
              </p>

              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50/70 p-4 text-left">

                <div className="flex items-start gap-3">

                  <div className="mt-0.5 shrink-0">

                    <ShieldCheck
                      size={18}
                      className="text-red-600"
                    />

                  </div>

                  <div>

                    <p className="text-base font-semibold text-red-700">
                      Khusus Administrator
                    </p>

                    <p className="mt-1 text-base leading-6 text-red-700">
                      Halaman ini hanya dapat diakses oleh pengguna dengan hak akses Administrator.
                    </p>

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  closeForbidden
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#07543f] px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#054131] hover:shadow-md active:scale-[0.98]"
              >

                <ArrowRight
                  size={17}
                  className="rotate-180"
                />

                Kembali ke Dashboard

              </button>

            </div>

            <div className="h-1 bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500" />

          </div>

        </div>
      )}

    </main>
  );
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`px-5 py-4 ${
        last
          ? ''
          : 'border-b border-slate-100 sm:border-b-0 sm:border-r'
      }`}
    >

      <p className="text-base font-bold uppercase tracking-[0.14em] text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold text-slate-700">
        {value}
      </p>

    </div>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f7f5]" />
      }
    >

      <DashboardContent />

    </Suspense>
  );
}