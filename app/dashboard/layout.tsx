'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  usePathname,
  useRouter,
} from 'next/navigation';

import {
  useEffect,
  useState,
} from 'react';

import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  ClipboardCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  GraduationCap,
  Menu,
  X,
  School,
  UserCheck,
  CalendarCheck,
  Heart,
  MessageSquare,
  Sparkles,
  ArrowUpCircle,
  History,
} from 'lucide-react';

/* ============================================================
   KONFIGURASI SEKOLAH
============================================================ */

const SCHOOL_NAME =
  'Sekolah Dasar Islam Terpadu Khoiro Ummah';

const SCHOOL_SHORT_NAME =
  'SDIT Khoiro Ummah';

/* ============================================================
   TYPES
============================================================ */

type MenuItem = {
  title: string;
  href: string;
  icon: any;
  category: string;
};

type Category = {
  title: string;
  icon: any;
  description: string;
};

/* ============================================================
   MENU
============================================================ */

const menus: MenuItem[] = [
  /* ==========================================================
     DATA MASTER
  ========================================================== */

  {
    title:
      'Ustadz & Ustadzah',

    href:
      '/dashboard/teachers',

    icon:
      Users,

    category:
      'Data Master',
  },

  {
    title:
      'Siswa',

    href:
      '/dashboard/students',

    icon:
      GraduationCap,

    category:
      'Data Master',
  },

  {
    title:
      'Kenaikan Kelas',

    href:
      '/dashboard/promotions',

    icon:
      ArrowUpCircle,

    category:
      'Data Master',
  },

  {
    title:
      'Riwayat Kenaikan',

    href:
      '/dashboard/promotions/history',

    icon:
      History,

    category:
      'Data Master',
  },

  {
    title:
      'Kelas',

    href:
      '/dashboard/classes',

    icon:
      School,

    category:
      'Data Master',
  },

  {
    title:
      'Mata Pelajaran',

    href:
      '/dashboard/subjects',

    icon:
      BookOpen,

    category:
      'Data Master',
  },

  {
    title:
      'Penugasan Ustadz/Ustadzah',

    href:
      '/dashboard/assignments',

    icon:
      UserCheck,

    category:
      'Data Master',
  },

  {
    title:
      'Kurikulum (CP & TP)',

    href:
      '/dashboard/curriculum',

    icon:
      FileText,

    category:
      'Data Master',
  },

  /* ==========================================================
     AKADEMIK
  ========================================================== */

  {
    title:
      'Kehadiran',

    href:
      '/dashboard/attendance',

    icon:
      CalendarCheck,

    category:
      'Akademik',
  },

  {
    title:
      'Input Asesmen',

    href:
      '/dashboard/assessment',

    icon:
      ClipboardCheck,

    category:
      'Akademik',
  },

  {
    title:
      'Kepribadian',

    href:
      '/dashboard/personality',

    icon:
      Heart,

    category:
      'Akademik',
  },

  {
    title:
      'Catatan Wali Kelas',

    href:
      '/dashboard/notes',

    icon:
      MessageSquare,

    category:
      'Akademik',
  },

  /* ==========================================================
     RAPOR
  ========================================================== */

  {
    title:
      'Rapor Siswa',

    href:
      '/dashboard/report',

    icon:
      BarChart3,

    category:
      'Rapor',
  },
];

/* ============================================================
   CATEGORIES
============================================================ */

const categories: Category[] = [
  {
    title:
      'Data Master',

    icon:
      School,

    description:
      'Kelola data utama',
  },

  {
    title:
      'Akademik',

    icon:
      BookOpen,

    description:
      'Kegiatan pembelajaran',
  },

  {
    title:
      'Rapor',

    icon:
      BarChart3,

    description:
      'Penilaian & rapor siswa',
  },
];

/* ============================================================
   COMPONENT
============================================================ */

export default function DashboardLayout({
  children,
}: {
  children:
    React.ReactNode;
}) {
  const pathname =
    usePathname();

  const router =
    useRouter();

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false);

  /*
   * Default kategori tertutup.
   * Kategori halaman aktif otomatis terbuka.
   */
  const [
    openCategory,
    setOpenCategory,
  ] =
    useState<
      string | null
    >(null);

  /* ==========================================================
     ACTIVE MENU
  ========================================================== */

  const isActive = (
    href: string
  ) => {
    /*
     * Dashboard hanya aktif
     * pada /dashboard.
     */
    if (
      href ===
      '/dashboard'
    ) {
      return (
        pathname ===
        '/dashboard'
      );
    }

    /*
     * Riwayat Kenaikan
     * berdiri sendiri.
     */
    if (
      href ===
      '/dashboard/promotions/history'
    ) {
      return pathname.startsWith(
        '/dashboard/promotions/history'
      );
    }

    /*
     * Kenaikan Kelas jangan ikut aktif
     * saat berada di Riwayat Kenaikan.
     */
    if (
      href ===
      '/dashboard/promotions'
    ) {
      return (
        pathname ===
          '/dashboard/promotions' ||
        (
          pathname.startsWith(
            '/dashboard/promotions/'
          ) &&
          !pathname.startsWith(
            '/dashboard/promotions/history'
          )
        )
      );
    }

    return pathname.startsWith(
      href
    );
  };

  /* ==========================================================
     ACTIVE CATEGORY
  ========================================================== */

  const getActiveCategory =
    () => {
      const activeMenu =
        menus.find(
          (menu) =>
            isActive(
              menu.href
            )
        );

      return (
        activeMenu?.category ||
        null
      );
    };

  /* ==========================================================
     AUTO OPEN ACTIVE CATEGORY
  ========================================================== */

  useEffect(() => {
    const activeCategory =
      getActiveCategory();

    if (
      activeCategory
    ) {
      setOpenCategory(
        activeCategory
      );
    }
  }, [pathname]);

  /* ==========================================================
     CURRENT PAGE
  ========================================================== */

  const currentMenu =
    menus.find(
      (menu) =>
        isActive(
          menu.href
        )
    )?.title ||
    (
      pathname.startsWith(
        '/dashboard/settings'
      )
        ? 'Pengaturan'
        : 'Dashboard'
    );

  /* ==========================================================
     TOGGLE CATEGORY
  ========================================================== */

  const toggleCategory =
    (
      category: string
    ) => {
      setOpenCategory(
        (current) =>
          current ===
          category
            ? null
            : category
      );
    };

  /* ==========================================================
     LOGOUT
  ========================================================== */

  const handleLogout =
    async () => {
      if (
        loggingOut
      ) {
        return;
      }

      setLoggingOut(
        true
      );

      try {
        const response =
          await fetch(
            '/api/auth/logout',
            {
              method:
                'POST',

              credentials:
                'include',
            }
          );

        if (
          !response.ok
        ) {
          throw new Error(
            'Gagal keluar dari sistem'
          );
        }

        router.replace(
          '/login'
        );

        router.refresh();
      } catch (
        error
      ) {
        console.error(
          'Logout error:',
          error
        );

        setLoggingOut(
          false
        );

        alert(
          'Gagal keluar dari sistem. Silakan coba lagi.'
        );
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#f7f9f7] text-slate-800">

      {/* ======================================================
          MOBILE HEADER
      ======================================================= */}

      <header className="fixed inset-x-0 top-0 z-[60] flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/95 px-4 shadow-sm backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileOpen}
          aria-controls="dashboard-sidebar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/sdit.png"
            alt="Logo SDIT Khoiro Ummah"
            width={40}
            height={40}
            priority
            className="h-10 w-10 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <div className="text-base font-bold tracking-tight text-slate-800">E-Rapor</div>
            <div className="truncate text-xs font-medium text-emerald-700">{SCHOOL_SHORT_NAME}</div>
          </div>
        </div>
      </header>

      {/* ======================================================
          MOBILE OVERLAY
      ======================================================= */}

      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() =>
            setMobileOpen(
              false
            )
          }
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}

      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <aside
        id="dashboard-sidebar"
        className={[
          'fixed left-0 top-0 z-50',
          'flex h-screen w-[258px] flex-col pt-16 lg:pt-0',
          'overflow-hidden',
          'border-r border-slate-200 bg-white',
          'text-slate-900',
          'shadow-[8px_0_30px_rgba(15,23,42,0.10)]',
          'transition-transform duration-300 ease-out',
          'lg:translate-x-0',
          mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full',
        ].join(' ')}
      >

        {/* ====================================================
            DECORATION
        ===================================================== */}

        <div className="pointer-events-none absolute inset-0 overflow-hidden">

          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-50 blur-3xl" />

          <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-amber-300/[0.03] blur-3xl" />

          <div className="absolute left-1/2 top-[38%] h-48 w-48 -translate-x-1/2 rounded-full border border-slate-200" />

        </div>

        {/* ====================================================
            BRAND
        ===================================================== */}

        <div className="relative shrink-0 border-b border-slate-200 px-5 pb-5 pt-5">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white p-1">
              <Image
                src="/sdit.png"
                alt="Logo SDIT Khoiro Ummah"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </div>

            <div className="min-w-0">

              <div className="text-[15px] font-semibold tracking-tight text-slate-900">
                E-Rapor
              </div>

              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
                Sistem Akademik SD
              </div>

            </div>

          </div>

          {/* BASMALAH */}

          <div className="mt-5 flex items-center gap-3">

            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent" />

            <div
              dir="rtl"
              className="font-serif text-sm text-emerald-700"
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </div>

            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent" />

          </div>

          {/* SCHOOL */}

          <div className="mt-3 flex items-start gap-2 text-xs leading-4 text-emerald-700">

            <Sparkles
              size={11}
              strokeWidth={
                1.6
              }
              className="mt-0.5 shrink-0"
            />

            <span>
              {SCHOOL_NAME}
            </span>

          </div>

        </div>

        {/* ====================================================
            NAVIGATION
        ===================================================== */}

        <nav className="sidebar-scroll relative flex-1 overflow-y-auto px-3 py-4">

          {/* ==================================================
              DASHBOARD
          ================================================== */}

          <div className="mb-3">

            <Link
              href="/dashboard"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className={[
                'group relative flex min-h-[44px] items-center gap-3',
                'rounded-xl px-2.5',
                'text-sm',
                'transition-all duration-200',

                isActive(
                  '/dashboard'
                )
                  ? 'bg-emerald-50 text-emerald-800 shadow-[0_4px_18px_rgba(0,0,0,0.08)]'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')}
            >

              {isActive(
                '/dashboard'
              ) && (
                <span className="absolute bottom-2.5 left-0 top-2.5 w-[2px] rounded-full bg-gradient-to-b from-emerald-300 to-emerald-500" />
              )}

              <span
                className={[
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  'transition-all duration-200',

                  isActive(
                    '/dashboard'
                  )
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-50 text-emerald-700 group-hover:bg-emerald-50 group-hover:text-emerald-700',
                ].join(' ')}
              >

                <LayoutDashboard
                  size={16}
                  strokeWidth={
                    1.7
                  }
                />

              </span>

              <span
                className={[
                  'flex-1',

                  isActive(
                    '/dashboard'
                  )
                    ? 'font-semibold'
                    : 'font-medium',
                ].join(' ')}
              >
                Dashboard
              </span>

              {isActive(
                '/dashboard'
              ) && (
                <ChevronRight
                  size={13}
                  strokeWidth={
                    1.5
                  }
                  className="mr-0.5 text-emerald-700"
                />
              )}

            </Link>

          </div>

          {/* ==================================================
              GROUPED MENUS
          ================================================== */}

          <div className="space-y-2">

            {categories.map(
              (
                category
              ) => {
                const categoryMenus =
                  menus.filter(
                    (
                      menu
                    ) =>
                      menu.category ===
                      category.title
                  );

                if (
                  !categoryMenus.length
                ) {
                  return null;
                }

                const categoryOpen =
                  openCategory ===
                  category.title;

                const categoryActive =
                  categoryMenus.some(
                    (
                      menu
                    ) =>
                      isActive(
                        menu.href
                      )
                  );

                const CategoryIcon =
                  category.icon;

                return (
                  <div
                    key={
                      category.title
                    }
                  >

                    <button
                      type="button"
                      onClick={() =>
                        toggleCategory(
                          category.title
                        )
                      }
                      className={[
                        'group relative flex w-full items-center gap-3',
                        'rounded-xl px-2.5 py-2.5',
                        'text-left',
                        'transition-all duration-200',

                        categoryOpen ||
                        categoryActive
                          ? 'bg-slate-50'
                          : 'hover:bg-slate-50',
                      ].join(' ')}
                    >

                      {categoryActive && (
                        <span className="absolute bottom-2.5 left-0 top-2.5 w-[2px] rounded-full bg-emerald-400" />
                      )}

                      <span
                        className={[
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          'transition-all duration-200',

                          categoryActive ||
                          categoryOpen
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-50 text-emerald-700 group-hover:bg-slate-50 group-hover:text-emerald-700',
                        ].join(' ')}
                      >

                        <CategoryIcon
                          size={16}
                          strokeWidth={
                            1.7
                          }
                        />

                      </span>

                      <span className="min-w-0 flex-1">

                        <span
                          className={[
                            'block text-sm',

                            categoryActive ||
                            categoryOpen
                              ? 'font-semibold text-slate-900'
                              : 'font-semibold text-slate-600 group-hover:text-slate-900',
                          ].join(' ')}
                        >
                          {
                            category.title
                          }
                        </span>

                        <span className="mt-0.5 block text-xs text-slate-600">
                          {
                            category.description
                          }
                        </span>

                      </span>

                      <span
                        className={[
                          'mr-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5',
                          'text-xs font-bold',

                          categoryActive ||
                          categoryOpen
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-50 text-slate-600',
                        ].join(' ')}
                      >
                        {
                          categoryMenus.length
                        }
                      </span>

                      <ChevronDown
                        size={14}
                        strokeWidth={
                          1.7
                        }
                        className={[
                          'shrink-0 transition-transform duration-300',

                          categoryOpen
                            ? 'rotate-180 text-emerald-700'
                            : 'text-slate-600 group-hover:text-slate-600',
                        ].join(' ')}
                      />

                    </button>

                    <div
                      className={[
                        'grid transition-all duration-300 ease-out',

                        categoryOpen
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0',
                      ].join(' ')}
                    >

                      <div className="overflow-hidden">

                        <div className="relative ml-[18px] border-l border-slate-200 py-1 pl-3">

                          {categoryMenus.map(
                            (
                              menu
                            ) => {
                              const Icon =
                                menu.icon;

                              const active =
                                isActive(
                                  menu.href
                                );

                              return (
                                <Link
                                  key={
                                    menu.href
                                  }
                                  href={
                                    menu.href
                                  }
                                  onClick={() =>
                                    setMobileOpen(
                                      false
                                    )
                                  }
                                  className={[
                                    'group relative flex min-h-[38px] items-center gap-2.5',
                                    'rounded-lg px-2',
                                    'text-sm',
                                    'transition-all duration-200',

                                    active
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-600',
                                  ].join(' ')}
                                >

                                  {active && (
                                    <span className="absolute -left-[17px] h-1.5 w-1.5 rounded-full bg-emerald-400 ring-4 ring-white" />
                                  )}

                                  <span
                                    className={[
                                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',

                                      active
                                        ? 'text-emerald-700'
                                        : 'text-emerald-700 group-hover:text-emerald-700',
                                    ].join(' ')}
                                  >

                                    <Icon
                                      size={14}
                                      strokeWidth={
                                        1.7
                                      }
                                    />

                                  </span>

                                  <span
                                    className={[
                                      'min-w-0 flex-1 truncate',

                                      active
                                        ? 'font-semibold'
                                        : 'font-medium',
                                    ].join(' ')}
                                  >
                                    {
                                      menu.title
                                    }
                                  </span>

                                  {active && (
                                    <ChevronRight
                                      size={12}
                                      strokeWidth={
                                        1.5
                                      }
                                      className="text-emerald-700"
                                    />
                                  )}

                                </Link>
                              );
                            }
                          )}

                        </div>

                      </div>

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {/* ==================================================
              SYSTEM
          ================================================== */}

          <div className="mt-4 border-t border-slate-200 pt-4">

            <div className="mb-2 px-2">

              <span className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">
                Sistem
              </span>

            </div>

            <Link
              href="/dashboard/settings"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className={[
                'group relative flex min-h-[42px] items-center gap-3',
                'rounded-xl px-2.5',
                'text-sm',
                'transition-all duration-200',

                isActive(
                  '/dashboard/settings'
                )
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              ].join(' ')}
            >

              {isActive(
                '/dashboard/settings'
              ) && (
                <span className="absolute bottom-2.5 left-0 top-2.5 w-[2px] rounded-full bg-gradient-to-b from-emerald-300 to-emerald-500" />
              )}

              <span
                className={[
                  'flex h-8 w-8 items-center justify-center rounded-lg',

                  isActive(
                    '/dashboard/settings'
                  )
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-50 text-emerald-700 group-hover:text-emerald-700',
                ].join(' ')}
              >

                <Settings
                  size={16}
                  strokeWidth={
                    1.7
                  }
                />

              </span>

              <span
                className={
                  isActive(
                    '/dashboard/settings'
                  )
                    ? 'font-semibold'
                    : 'font-medium'
                }
              >
                Pengaturan
              </span>

              {isActive(
                '/dashboard/settings'
              ) && (
                <ChevronRight
                  size={13}
                  strokeWidth={
                    1.5
                  }
                  className="ml-auto text-emerald-700"
                />
              )}

            </Link>

          </div>

        </nav>

        {/* ====================================================
            SIDEBAR FOOTER
        ===================================================== */}

        <div className="relative shrink-0 border-t border-slate-200 p-3">

          <div className="mb-2.5 rounded-xl border border-emerald-100 bg-slate-50 p-3">

            <div className="flex items-center gap-2.5">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">

                <ShieldCheck
                  size={15}
                  strokeWidth={
                    1.6
                  }
                  className="text-emerald-700"
                />

              </div>

              <div className="min-w-0 flex-1">

                <div className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-600">
                  Status Sistem
                </div>

                <div className="mt-1 flex items-center gap-1.5">

                  <span className="relative flex h-1.5 w-1.5">

                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-50" />

                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-50" />

                  </span>

                  <span className="text-xs font-medium text-emerald-700">
                    Sistem Aktif
                  </span>

                </div>

              </div>

            </div>

          </div>

          <div className="flex items-center gap-2.5 rounded-xl px-1.5 py-2">

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-xs font-bold text-white shadow-sm ring-1 ring-white/10">
              A
            </div>

            <div className="min-w-0 flex-1">

              <div className="truncate text-sm font-semibold text-slate-600">
                Administrator
              </div>

              <div className="mt-0.5 truncate text-xs text-slate-600">
                Pengelola Sistem
              </div>

            </div>

            <button
              type="button"
              title="Keluar"
              onClick={
                handleLogout
              }
              disabled={
                loggingOut
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-all duration-200 hover:bg-red-500/10 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <LogOut
                size={16}
                strokeWidth={
                  1.65
                }
              />

            </button>

          </div>

        </div>

      </aside>

      {/* ======================================================
          MAIN
      ======================================================= */}

      <div className="lg:pl-[258px]">

        <div className="h-16 lg:hidden" />

        {/* ====================================================
            TOPBAR
        ===================================================== */}

        <header className="sticky top-0 z-30 hidden h-[58px] items-center border-b border-slate-200/70 bg-white/90 px-7 backdrop-blur-xl lg:flex">

          <div className="flex items-center gap-2.5">

            <div className="flex items-center gap-2">

              <span className="relative flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

              </span>

              <span className="text-[11px] font-medium text-slate-400">
                E-Rapor {SCHOOL_SHORT_NAME}
              </span>

            </div>

            <ChevronRight
              size={13}
              strokeWidth={
                1.5
              }
              className="text-slate-300"
            />

            <span className="text-[11px] font-semibold text-slate-700">
              {currentMenu}
            </span>

          </div>

          <div className="ml-auto flex items-center gap-3">

            <div className="hidden text-right xl:block">

              <div className="text-[10px] font-semibold text-slate-700">
                Administrator
              </div>

              <div className="mt-0.5 text-[8px] text-slate-400">
                Pengelola Sistem
              </div>

            </div>

            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#07543f] text-[10px] font-bold text-white shadow-sm">

              A

              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-white bg-emerald-500" />

            </div>

          </div>

        </header>

        {/* ====================================================
            PAGE
        ===================================================== */}

        <main>
          {children}
        </main>

      </div>

      {/* ======================================================
          GLOBAL STYLE
      ======================================================= */}

      <style jsx global>{`
        .sidebar-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 116, 139, 0.30) transparent;
        }

        .sidebar-scroll::-webkit-scrollbar {
          width: 3px;
        }

        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.30);
          border-radius: 999px;
        }

        .sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.50);
        }

        ::selection {
          background: rgba(16, 185, 129, 0.18);
          color: #064e3b;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

    </div>
  );
}