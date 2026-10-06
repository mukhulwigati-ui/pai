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
  GraduationCap,
  Menu,
  X,
  School,
  UserCheck,
  CalendarCheck,
  Heart,
  MessageSquare,
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
    <div className="min-h-screen bg-[#f0f0f1] text-[#1d2327]">
      <header className="fixed inset-x-0 top-0 z-[60] flex h-12 items-center gap-3 bg-[#1d2327] px-3 text-white lg:h-10 lg:px-5">
        <button
          type="button"
          onClick={() => setMobileOpen((current) => !current)}
          aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          aria-expanded={mobileOpen}
          aria-controls="dashboard-sidebar"
          className="flex h-10 w-10 shrink-0 items-center justify-center text-[#a7aaad] hover:bg-[#2c3338] hover:text-[#72aee6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#72aee6] lg:hidden"
        >
          {mobileOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
        <Image src="/sdit.png" alt="Logo SDIT Khoiro Ummah" width={28} height={28} className="h-7 w-7 shrink-0 object-contain" />
        <Link href="/dashboard" className="min-w-0 truncate text-sm font-medium hover:text-[#72aee6]">E-Rapor · {SCHOOL_SHORT_NAME}</Link>
        <span className="ml-auto hidden text-sm sm:block">Administrator</span>
        <button type="button" onClick={handleLogout} disabled={loggingOut} aria-label="Keluar dari sistem" title="Keluar" className="flex h-9 w-9 shrink-0 items-center justify-center text-[#a7aaad] hover:text-white disabled:opacity-50">
          <LogOut size={18} />
        </button>
      </header>

      {mobileOpen && (
        <button type="button" aria-label="Tutup menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
      )}

      <aside id="dashboard-sidebar" className={[
        'fixed bottom-0 left-0 top-12 z-50 flex w-[258px] flex-col bg-[#1d2327] text-[#f0f0f1] transition-transform duration-200 lg:top-10 lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <Image src="/sdit.png" alt="Logo SDIT Khoiro Ummah" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
          <div>
            <p className="text-lg font-semibold text-white">E-Rapor</p>
            <p className="mt-1 text-sm text-[#a7aaad]">{SCHOOL_SHORT_NAME}</p>
          </div>
        </div>

        <nav aria-label="Menu dashboard" className="sidebar-scroll flex-1 overflow-y-auto py-3">
          <Link href="/dashboard" onClick={() => setMobileOpen(false)} aria-current={isActive('/dashboard') ? 'page' : undefined} className={[
            'relative flex min-h-11 items-center gap-3 px-4 py-3 text-sm',
            isActive('/dashboard') ? 'bg-[#2271b1] font-semibold text-white' : 'text-[#f0f0f1] hover:bg-[#2c3338] hover:text-[#72aee6]',
          ].join(' ')}>
            <LayoutDashboard size={20} className={isActive('/dashboard') ? 'text-white' : 'text-[#a7aaad]'} />
            Dashboard
            {isActive('/dashboard') && <span aria-hidden="true" className="absolute right-0 top-1/2 hidden -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-[#f0f0f1] lg:block" />}
          </Link>

          {categories.map((category) => {
            const categoryMenus = menus.filter((menu) => menu.category === category.title);
            const categoryOpen = openCategory === category.title;
            const categoryActive = categoryMenus.some((menu) => isActive(menu.href));
            const CategoryIcon = category.icon;
            const groupId = `menu-group-${category.title.replace(/\s+/g, '-').toLowerCase()}`;
            return (
              <div key={category.title}>
                <button type="button" onClick={() => toggleCategory(category.title)} aria-expanded={categoryOpen} aria-controls={groupId} className={[
                  'relative flex min-h-11 w-full items-center gap-3 px-4 py-3 text-left text-sm',
                  categoryActive ? 'bg-[#2271b1] font-semibold text-white' : 'text-[#f0f0f1] hover:bg-[#2c3338] hover:text-[#72aee6]',
                ].join(' ')}>
                  <CategoryIcon size={20} className={categoryActive ? 'text-white' : 'text-[#a7aaad]'} />
                  <span className="flex-1">{category.title}</span>
                  <ChevronDown size={16} className={categoryOpen ? 'rotate-180' : ''} />
                  {categoryActive && <span aria-hidden="true" className="absolute right-0 top-1/2 hidden -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-[#f0f0f1] lg:block" />}
                </button>
                <div id={groupId} hidden={!categoryOpen} className="bg-[#2c3338] py-2">
                  {categoryMenus.map((menu) => {
                    const active = isActive(menu.href);
                    return (
                      <Link key={menu.href} href={menu.href} onClick={() => setMobileOpen(false)} aria-current={active ? 'page' : undefined} className={[
                        'block px-5 py-2.5 pl-12 text-sm leading-5',
                        active ? 'font-semibold text-[#72aee6]' : 'text-[#c3c4c7] hover:text-[#72aee6]',
                      ].join(' ')}>{menu.title}</Link>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div className="mt-3 border-t border-white/10 pt-3">
            <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)} aria-current={isActive('/dashboard/settings') ? 'page' : undefined} className={[
              'relative flex min-h-11 items-center gap-3 px-4 py-3 text-sm',
              isActive('/dashboard/settings') ? 'bg-[#2271b1] font-semibold text-white' : 'text-[#f0f0f1] hover:bg-[#2c3338] hover:text-[#72aee6]',
            ].join(' ')}>
              <Settings size={20} className={isActive('/dashboard/settings') ? 'text-white' : 'text-[#a7aaad]'} />
              Pengaturan
              {isActive('/dashboard/settings') && <span aria-hidden="true" className="absolute right-0 top-1/2 hidden -translate-y-1/2 border-y-8 border-r-8 border-y-transparent border-r-[#f0f0f1] lg:block" />}
            </Link>
          </div>
        </nav>

        <div className="border-t border-white/10 px-4 py-4 text-sm text-[#a7aaad]">Sistem Akademik Sekolah</div>
      </aside>

      <div className="pt-12 lg:pl-[258px] lg:pt-10">
        <div className="flex min-h-14 items-center border-b border-[#dcdcde] bg-[#f6f7f7] px-5 sm:px-7">
          <span className="text-sm text-[#646970]">Dashboard</span>
          {currentMenu !== 'Dashboard' && <><ChevronRight size={16} className="mx-2 text-[#8c8f94]" /><span className="text-sm font-medium">{currentMenu}</span></>}
        </div>
        <main>{children}</main>
      </div>

      <style jsx global>{`
        .sidebar-scroll { scrollbar-width: thin; scrollbar-color: #50575e #1d2327; }
        .sidebar-scroll::-webkit-scrollbar { width: 5px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: #1d2327; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: #50575e; }
        ::selection { background: #c5d9ed; color: #1d2327; }
      `}</style>
    </div>
  );
}
