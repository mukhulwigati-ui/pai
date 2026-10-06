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
    <div className="min-h-screen bg-[#f0f0f1] px-4 py-6 text-[#1d2327] sm:px-7">
      <h1 className="mb-5 text-2xl font-normal">Dashboard</h1>

      <section className="mb-6 border border-[#c3c4c7] bg-white">
        <div className="flex flex-col gap-5 border-b border-[#dcdcde] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-4">
            <Image src="/sdit.png" alt="Logo SDIT Khoiro Ummah" width={64} height={64} priority className="h-16 w-16 shrink-0 object-contain" />
            <div>
              <h2 className="text-2xl font-semibold">Selamat Datang</h2>
              <p className="mt-1 text-base text-[#646970]">E-Rapor · {SCHOOL_SHORT_NAME}</p>
            </div>
          </div>
          <p dir="rtl" className="font-serif text-xl leading-relaxed text-[#50575e]">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
        </div>
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold">Kelola akademik sekolah</h3>
          <p className="mt-2 text-base text-[#646970]">Pilih modul untuk mengelola data dan penilaian siswa.</p>
          <Link href="/dashboard/assessment" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-sm border border-[#2271b1] bg-[#2271b1] px-4 py-2 text-base font-medium text-white hover:bg-[#135e96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2271b1]">
            Input Asesmen <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {menus.map((menu) => {
          const Icon = menu.icon;
          return (
            <section key={menu.href} className="border border-[#c3c4c7] bg-white">
              <h2 className="flex items-center gap-3 border-b border-[#dcdcde] px-4 py-3 text-base font-semibold">
                <Icon size={20} className="shrink-0 text-[#646970]" aria-hidden="true" />
                {menu.title}
              </h2>
              <div className="p-4">
                <p className="min-h-12 text-base leading-6 text-[#646970]">{menu.description}</p>
                <Link href={menu.href} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-sm border border-[#2271b1] px-3 py-2 text-base text-[#2271b1] hover:border-[#135e96] hover:bg-[#f0f6fc] hover:text-[#135e96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2271b1]">
                  Buka Modul <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-5 border border-[#c3c4c7] bg-white">
        <h2 className="border-b border-[#dcdcde] px-4 py-3 text-base font-semibold">Informasi Sekolah</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          <InfoItem label="Jenjang" value="Sekolah Dasar" />
          <InfoItem label="Sistem" value="E-Rapor Akademik" />
          <InfoItem label="Lembaga" value={SCHOOL_SHORT_NAME} last />
        </div>
      </section>
      <footer className="mt-7 text-sm leading-6 text-[#646970]">{SCHOOL_NAME}</footer>

      {showForbidden && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forbidden-title"
        >

          <div
            className="relative w-full max-w-md overflow-hidden rounded-sm border border-[#c3c4c7] bg-white shadow-2xl"
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
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-sm text-[#646970] transition hover:bg-slate-100 hover:text-[#50575e]"
            >

              <X
                size={18}
              />

            </button>

            <div className="flex justify-center pt-8">

              <div className="relative flex h-20 w-20 items-center justify-center rounded-sm bg-red-50">

                <div className="absolute inset-0 rounded-sm border-4 border-red-100" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-sm bg-red-100">

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

              <div className="mb-2 inline-flex items-center rounded-sm bg-red-50 px-3 py-1 text-base font-bold uppercase tracking-wider text-red-600">
                Akses Terbatas
              </div>

              <h2
                id="forbidden-title"
                className="text-xl font-bold tracking-tight text-[#1d2327]"
              >
                Akses Ditolak
              </h2>

              <p className="mx-auto mt-2 max-w-sm text-base leading-6 text-[#646970]">
                Maaf, Anda tidak memiliki izin untuk mengakses halaman yang Anda buka.
              </p>

              <div className="mt-5 rounded-sm border border-red-100 bg-red-50/70 p-4 text-left">

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
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm bg-[#2271b1] px-4 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#135e96] hover:shadow-md active:scale-[0.98]"
              >

                <ArrowRight
                  size={17}
                  className="rotate-180"
                />

                Kembali ke Dashboard

              </button>

            </div>



          </div>

        </div>
      )}

    </div>
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
          : 'border-b border-[#dcdcde] sm:border-b-0 sm:border-r'
      }`}
    >

      <p className="text-sm font-medium text-[#646970]">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold text-[#50575e]">
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
        <div className="min-h-screen bg-[#f0f0f1]" />
      }
    >

      <DashboardContent />

    </Suspense>
  );
}