'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ElementType,
} from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  History,
  Loader2,
  Search,
  School,
  Users,
  X,
} from 'lucide-react';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_NAME =
  'Sekolah Dasar Islam Terpadu Khoiro Ummah';

const SCHOOL_SHORT_NAME =
  'SDIT Khoiro Ummah';

const SCHOOL_LEVEL =
  'SD';

/* ============================================================
   TYPES
============================================================ */

type PromotionStatus =
  | 'NAIK'
  | 'TINGGAL'
  | 'LULUS';

type StudentPromotion = {
  id: number;

  studentId: number;

  academicYear: string;

  fromClass: string;

  toClass:
    | string
    | null;

  status:
    | PromotionStatus
    | string;

  note:
    | string
    | null;

  promotedAt: string;

  student?: {
    id: number;
    nisn: string;
    fullname: string;
    gender: string;
    class_name: string;
  } | null;
};

/* ============================================================
   STATUS
============================================================ */

const STATUS_OPTIONS = [
  'SEMUA',
  'NAIK',
  'TINGGAL',
  'LULUS',
] as const;

const statusConfig: Record<
  string,
  {
    label: string;
    className: string;
  }
> = {
  NAIK: {
    label:
      'Naik Kelas',

    className:
      'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  },

  TINGGAL: {
    label:
      'Tinggal Kelas',

    className:
      'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15',
  },

  LULUS: {
    label:
      'Lulus',

    className:
      'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15',
  },
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeArray<T>(
  data: unknown,
  possibleKeys: string[] = []
): T[] {
  if (
    Array.isArray(
      data
    )
  ) {
    return data as T[];
  }

  if (
    data &&
    typeof data ===
      'object'
  ) {
    const objectData =
      data as Record<
        string,
        unknown
      >;

    for (
      const key of possibleKeys
    ) {
      if (
        Array.isArray(
          objectData[key]
        )
      ) {
        return objectData[
          key
        ] as T[];
      }
    }

    if (
      Array.isArray(
        objectData.data
      )
    ) {
      return objectData
        .data as T[];
    }
  }

  return [];
}

function normalizeText(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeLower(
  value: unknown
): string {
  return normalizeText(
    value
  ).toLowerCase();
}

function normalizeStatus(
  value: unknown
): string {
  return normalizeText(
    value
  ).toUpperCase();
}

async function getApiError(
  response: Response,
  fallback: string
) {
  try {
    const data =
      await response.json();

    return (
      data?.message ||
      data?.error ||
      fallback
    );
  } catch {
    return fallback;
  }
}

function formatDate(
  value: string
) {
  if (
    !value
  ) {
    return '-';
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return new Intl.DateTimeFormat(
    'id-ID',
    {
      day:
        '2-digit',

      month:
        'short',

      year:
        'numeric',
    }
  ).format(
    date
  );
}

function getStatusConfig(
  status: string
) {
  const normalized =
    normalizeStatus(
      status
    );

  return (
    statusConfig[
      normalized
    ] ?? {
      label:
        normalized ||
        '-',

      className:
        'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/10',
    }
  );
}

function getDestinationLabel(
  item: StudentPromotion
) {
  const status =
    normalizeStatus(
      item.status
    );

  if (
    status ===
    'LULUS'
  ) {
    return 'Lulus dari SD';
  }

  if (
    status ===
    'TINGGAL'
  ) {
    return (
      item.fromClass ||
      '-'
    );
  }

  return (
    item.toClass ||
    '-'
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function PromotionHistoryPage() {
  /* ==========================================================
     DATA
  ========================================================== */

  const [
    data,
    setData,
  ] =
    useState<
      StudentPromotion[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState('');

  /* ==========================================================
     FILTER
  ========================================================== */

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    status,
    setStatus,
  ] =
    useState(
      'SEMUA'
    );

  const [
    academicYear,
    setAcademicYear,
  ] =
    useState(
      'SEMUA'
    );

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const [
    page,
    setPage,
  ] =
    useState(
      1
    );

  const pageSize =
    10;

  /* ==========================================================
     MODAL
  ========================================================== */

  const [
    selected,
    setSelected,
  ] =
    useState<StudentPromotion | null>(
      null
    );

  /* ==========================================================
     LOAD DATA
  ========================================================== */

  useEffect(() => {
    let mounted =
      true;

    async function loadHistory() {
      try {
        setLoading(
          true
        );

        setError(
          ''
        );

        const response =
          await fetch(
            '/api/promotions/history',
            {
              method:
                'GET',

              credentials:
                'include',

              cache:
                'no-store',
            }
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await getApiError(
              response,
              `Gagal mengambil riwayat (${response.status}).`
            )
          );
        }

        const result =
          await response.json();

        const rows =
          normalizeArray<StudentPromotion>(
            result,
            [
              'promotions',
              'history',
            ]
          );

        const cleanRows =
          rows
            .filter(
              (
                item
              ) =>
                Number.isInteger(
                  Number(
                    item.id
                  )
                ) &&
                Number(
                  item.id
                ) > 0
            )
            .map(
              (
                item
              ) => ({
                ...item,

                academicYear:
                  normalizeText(
                    item.academicYear
                  ),

                fromClass:
                  normalizeText(
                    item.fromClass
                  ),

                toClass:
                  item.toClass
                    ? normalizeText(
                        item.toClass
                      )
                    : null,

                status:
                  normalizeStatus(
                    item.status
                  ),

                note:
                  item.note
                    ? normalizeText(
                        item.note
                      )
                    : null,
              })
            )
            .sort(
              (
                a,
                b
              ) => {
                const dateA =
                  new Date(
                    a.promotedAt
                  ).getTime();

                const dateB =
                  new Date(
                    b.promotedAt
                  ).getTime();

                if (
                  Number.isNaN(
                    dateA
                  ) ||
                  Number.isNaN(
                    dateB
                  )
                ) {
                  return (
                    Number(
                      b.id
                    ) -
                    Number(
                      a.id
                    )
                  );
                }

                return (
                  dateB -
                  dateA
                );
              }
            );

        if (
          mounted
        ) {
          setData(
            cleanRows
          );
        }
      } catch (
        err
      ) {
        console.error(
          'LOAD PROMOTION HISTORY ERROR:',
          err
        );

        if (
          mounted
        ) {
          setData(
            []
          );

          setError(
            err instanceof
              Error
              ? err.message
              : 'Gagal mengambil data riwayat kenaikan kelas.'
          );
        }
      } finally {
        if (
          mounted
        ) {
          setLoading(
            false
          );
        }
      }
    }

    loadHistory();

    return () => {
      mounted =
        false;
    };
  }, []);

  /* ==========================================================
     ACADEMIC YEARS
  ========================================================== */

  const academicYears =
    useMemo(
      () =>
        Array.from(
          new Set(
            data
              .map(
                (
                  item
                ) =>
                  item.academicYear
              )
              .filter(
                Boolean
              )
          )
        ).sort(
          (
            a,
            b
          ) =>
            b.localeCompare(
              a
            )
        ),
      [
        data,
      ]
    );

  /* ==========================================================
     FILTER
  ========================================================== */

  const filteredData =
    useMemo(() => {
      const keyword =
        normalizeLower(
          search
        );

      return data.filter(
        (
          item
        ) => {
          const student =
            item.student;

          const matchesSearch =
            !keyword ||
            normalizeLower(
              student?.fullname
            ).includes(
              keyword
            ) ||
            normalizeLower(
              student?.nisn
            ).includes(
              keyword
            ) ||
            normalizeLower(
              item.fromClass
            ).includes(
              keyword
            ) ||
            normalizeLower(
              item.toClass
            ).includes(
              keyword
            ) ||
            normalizeLower(
              item.note
            ).includes(
              keyword
            );

          const matchesStatus =
            status ===
              'SEMUA' ||
            normalizeStatus(
              item.status
            ) ===
              status;

          const matchesYear =
            academicYear ===
              'SEMUA' ||
            item.academicYear ===
              academicYear;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesYear
          );
        }
      );
    }, [
      data,
      search,
      status,
      academicYear,
    ]);

  /* ==========================================================
     PAGINATION
  ========================================================== */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredData.length /
          pageSize
      )
    );

  const currentPage =
    Math.min(
      page,
      totalPages
    );

  const paginatedData =
    useMemo(() => {
      const start =
        (
          currentPage -
          1
        ) *
        pageSize;

      return filteredData.slice(
        start,
        start +
          pageSize
      );
    }, [
      filteredData,
      currentPage,
    ]);

  useEffect(() => {
    setPage(
      1
    );
  }, [
    search,
    status,
    academicYear,
  ]);

  /* ==========================================================
     SUMMARY
  ========================================================== */

  const summary =
    useMemo(
      () => ({
        total:
          filteredData.length,

        naik:
          filteredData.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              'NAIK'
          ).length,

        tinggal:
          filteredData.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              'TINGGAL'
          ).length,

        lulus:
          filteredData.filter(
            (
              item
            ) =>
              normalizeStatus(
                item.status
              ) ===
              'LULUS'
          ).length,
      }),
      [
        filteredData,
      ]
    );

  /* ==========================================================
     RESET FILTER
  ========================================================== */

  const resetFilter =
    () => {
      setSearch(
        ''
      );

      setStatus(
        'SEMUA'
      );

      setAcademicYear(
        'SEMUA'
      );

      setPage(
        1
      );
    };

  const hasFilter =
    search.trim() !==
      '' ||
    status !==
      'SEMUA' ||
    academicYear !==
      'SEMUA';

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#f7f9f7]">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="border-b border-slate-200/70 bg-white">

        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">

              <Link
                href="/dashboard/promotions"
                className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                title="Kembali ke Kenaikan Kelas"
              >

                <ArrowLeft
                  size={17}
                  strokeWidth={
                    1.8
                  }
                />

              </Link>

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                    <History
                      size={18}
                      strokeWidth={
                        1.7
                      }
                    />

                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/60">
                    Akademik • Jenjang {SCHOOL_LEVEL}
                  </span>

                </div>

                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-800">
                  Riwayat Kenaikan &amp; Kelulusan
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Riwayat kenaikan kelas, tinggal kelas, dan kelulusan siswa {SCHOOL_SHORT_NAME}.
                </p>

              </div>

            </div>

            <div className="flex flex-col gap-2 sm:flex-row">

              <div className="hidden items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[10px] font-semibold text-emerald-700 xl:flex">

                <School
                  size={13}
                />

                {SCHOOL_SHORT_NAME}

              </div>

              <Link
                href="/dashboard/promotions"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#07543f] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#064735]"
              >

                <ArrowUpRight
                  size={15}
                  strokeWidth={
                    1.8
                  }
                />

                Kelola Kenaikan Kelas

              </Link>

            </div>

          </div>

        </div>

      </div>

      {/* ======================================================
          CONTENT
      ======================================================= */}

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* ====================================================
            SUMMARY
        ===================================================== */}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

          <SummaryCard
            icon={
              Users
            }
            label="Total Riwayat"
            value={
              summary.total
            }
          />

          <SummaryCard
            icon={
              ArrowUpRight
            }
            label="Naik Kelas"
            value={
              summary.naik
            }
            tone="emerald"
          />

          <SummaryCard
            icon={
              GraduationCap
            }
            label="Lulus"
            value={
              summary.lulus
            }
            tone="blue"
          />

          <SummaryCard
            icon={
              History
            }
            label="Tinggal Kelas"
            value={
              summary.tinggal
            }
            tone="amber"
          />

        </div>

        {/* ====================================================
            FILTER
        ===================================================== */}

        <div className="mt-5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.035)]">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* SEARCH */}

            <div className="relative flex-1">

              <Search
                size={16}
                strokeWidth={
                  1.8
                }
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={
                  search
                }
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Cari nama, NISN, kelas, atau catatan..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch(
                      ''
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >

                  <X
                    size={14}
                  />

                </button>
              )}

            </div>

            {/* YEAR */}

            <select
              value={
                academicYear
              }
              onChange={(
                event
              ) =>
                setAcademicYear(
                  event.target
                    .value
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10"
            >

              <option value="SEMUA">
                Semua Tahun Pelajaran
              </option>

              {academicYears.map(
                (
                  year
                ) => (
                  <option
                    key={
                      year
                    }
                    value={
                      year
                    }
                  >
                    {year}
                  </option>
                )
              )}

            </select>

            {/* STATUS */}

            <select
              value={
                status
              }
              onChange={(
                event
              ) =>
                setStatus(
                  event.target
                    .value
                )
              }
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10"
            >

              {STATUS_OPTIONS.map(
                (
                  item
                ) => (
                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item ===
                    'SEMUA'
                      ? 'Semua Status'
                      : getStatusConfig(
                          item
                        ).label}
                  </option>
                )
              )}

            </select>

            {hasFilter && (
              <button
                type="button"
                onClick={
                  resetFilter
                }
                className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
              >
                Reset
              </button>
            )}

          </div>

        </div>

        {/* ====================================================
            TABLE
        ===================================================== */}

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)]">

          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

            <div>

              <h2 className="text-sm font-bold text-slate-800">
                Data Riwayat
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-400">
                Menampilkan {filteredData.length} riwayat siswa
              </p>

            </div>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="flex flex-col items-center">

                <Loader2
                  size={25}
                  className="animate-spin text-emerald-600"
                />

                <p className="mt-3 text-xs text-slate-400">
                  Memuat riwayat...
                </p>

              </div>

            </div>
          )}

          {/* ERROR */}

          {!loading &&
            error && (
              <div className="p-6">

                <div className="rounded-xl border border-red-100 bg-red-50 p-4">

                  <p className="text-xs font-semibold text-red-700">
                    Gagal memuat data
                  </p>

                  <p className="mt-1 text-xs text-red-600/80">
                    {error}
                  </p>

                </div>

              </div>
            )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            paginatedData.length ===
              0 && (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-5 text-center">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">

                  <History
                    size={26}
                    strokeWidth={
                      1.5
                    }
                  />

                </div>

                <h3 className="mt-4 text-sm font-semibold text-slate-700">
                  Belum ada riwayat
                </h3>

                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Belum terdapat data kenaikan kelas, tinggal kelas, atau kelulusan yang sesuai dengan filter.
                </p>

                {hasFilter && (
                  <button
                    type="button"
                    onClick={
                      resetFilter
                    }
                    className="mt-4 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Hapus filter
                  </button>
                )}

              </div>
            )}

          {/* ==================================================
              DESKTOP TABLE
          ================================================== */}

          {!loading &&
            !error &&
            paginatedData.length >
              0 && (
              <>

                <div className="hidden overflow-x-auto md:block">

                  <table className="w-full min-w-[900px]">

                    <thead>

                      <tr className="border-b border-slate-100 bg-slate-50/60">

                        <th className="w-12 px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          #
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Siswa
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Tahun Pelajaran
                        </th>

                        <th className="px-3 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Kelas Asal
                        </th>

                        <th className="px-3 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Tujuan
                        </th>

                        <th className="px-3 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Status
                        </th>

                        <th className="px-3 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          Tanggal
                        </th>

                        <th className="w-16 px-4 py-3" />

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {paginatedData.map(
                        (
                          item,
                          index
                        ) => {
                          const config =
                            getStatusConfig(
                              item.status
                            );

                          const student =
                            item.student;

                          return (
                            <tr
                              key={
                                item.id
                              }
                              className="group transition hover:bg-emerald-50/[0.35]"
                            >

                              {/* NO */}

                              <td className="px-5 py-3.5 text-center text-[10px] text-slate-400">
                                {(currentPage -
                                  1) *
                                  pageSize +
                                  index +
                                  1}
                              </td>

                              {/* STUDENT */}

                              <td className="px-3 py-3.5">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[10px] font-bold text-emerald-700">
                                    {student?.fullname
                                      ?.charAt(
                                        0
                                      )
                                      ?.toUpperCase() ||
                                      '?'}
                                  </div>

                                  <div className="min-w-0">

                                    <div className="truncate text-xs font-semibold text-slate-700">
                                      {student?.fullname ||
                                        '-'}
                                    </div>

                                    <div className="mt-0.5 text-[10px] text-slate-400">
                                      NISN:{' '}
                                      {student?.nisn ||
                                        '-'}
                                    </div>

                                  </div>

                                </div>

                              </td>

                              {/* YEAR */}

                              <td className="px-3 py-3.5">

                                <div className="flex items-center gap-2">

                                  <CalendarDays
                                    size={14}
                                    className="text-slate-300"
                                  />

                                  <span className="text-xs font-medium text-slate-600">
                                    {item.academicYear ||
                                      '-'}
                                  </span>

                                </div>

                              </td>

                              {/* FROM */}

                              <td className="px-3 py-3.5 text-center">

                                <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                                  {item.fromClass ||
                                    '-'}
                                </span>

                              </td>

                              {/* DESTINATION */}

                              <td className="px-3 py-3.5 text-center">

                                <span
                                  className={`text-xs font-semibold ${
                                    normalizeStatus(
                                      item.status
                                    ) ===
                                    'LULUS'
                                      ? 'text-blue-700'
                                      : 'text-slate-600'
                                  }`}
                                >
                                  {
                                    getDestinationLabel(
                                      item
                                    )
                                  }
                                </span>

                              </td>

                              {/* STATUS */}

                              <td className="px-3 py-3.5 text-center">

                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${config.className}`}
                                >
                                  {
                                    config.label
                                  }
                                </span>

                              </td>

                              {/* DATE */}

                              <td className="px-3 py-3.5">

                                <span className="text-[10px] text-slate-400">
                                  {
                                    formatDate(
                                      item.promotedAt
                                    )
                                  }
                                </span>

                              </td>

                              {/* DETAIL */}

                              <td className="px-4 py-3.5 text-right">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelected(
                                      item
                                    )
                                  }
                                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700"
                                  title="Lihat detail"
                                >

                                  <ChevronRight
                                    size={16}
                                  />

                                </button>

                              </td>

                            </tr>
                          );
                        }
                      )}

                    </tbody>

                  </table>

                </div>

                {/* ============================================
                    MOBILE CARDS
                ============================================= */}

                <div className="divide-y divide-slate-100 md:hidden">

                  {paginatedData.map(
                    (
                      item
                    ) => {
                      const config =
                        getStatusConfig(
                          item.status
                        );

                      return (
                        <button
                          key={
                            item.id
                          }
                          type="button"
                          onClick={() =>
                            setSelected(
                              item
                            )
                          }
                          className="block w-full p-4 text-left transition hover:bg-slate-50"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <div className="truncate text-sm font-bold text-slate-800">
                                {item.student
                                  ?.fullname ||
                                  '-'}
                              </div>

                              <div className="mt-0.5 text-[10px] text-slate-400">
                                NISN:{' '}
                                {item.student
                                  ?.nisn ||
                                  '-'}
                              </div>

                            </div>

                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold ${config.className}`}
                            >
                              {
                                config.label
                              }
                            </span>

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">

                            <div className="rounded-lg bg-slate-50 p-2">

                              <div className="text-slate-400">
                                Kelas Asal
                              </div>

                              <div className="mt-0.5 font-semibold text-slate-700">
                                {item.fromClass ||
                                  '-'}
                              </div>

                            </div>

                            <div className="rounded-lg bg-slate-50 p-2">

                              <div className="text-slate-400">
                                Tujuan
                              </div>

                              <div className="mt-0.5 font-semibold text-slate-700">
                                {
                                  getDestinationLabel(
                                    item
                                  )
                                }
                              </div>

                            </div>

                          </div>

                          <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">

                            <span>
                              {item.academicYear ||
                                '-'}
                            </span>

                            <span>
                              {
                                formatDate(
                                  item.promotedAt
                                )
                              }
                            </span>

                          </div>

                        </button>
                      );
                    }
                  )}

                </div>

                {/* ============================================
                    PAGINATION
                ============================================= */}

                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5">

                  <p className="text-[10px] text-slate-400">

                    Menampilkan{' '}

                    <span className="font-semibold text-slate-600">
                      {filteredData.length ===
                      0
                        ? 0
                        : (currentPage -
                              1) *
                            pageSize +
                          1}
                    </span>

                    {' - '}

                    <span className="font-semibold text-slate-600">
                      {Math.min(
                        currentPage *
                          pageSize,
                        filteredData.length
                      )}
                    </span>

                    {' dari '}

                    <span className="font-semibold text-slate-600">
                      {
                        filteredData.length
                      }
                    </span>

                  </p>

                  <div className="flex items-center gap-1">

                    <button
                      type="button"
                      disabled={
                        currentPage <=
                        1
                      }
                      onClick={() =>
                        setPage(
                          (
                            value
                          ) =>
                            Math.max(
                              1,
                              value -
                                1
                            )
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                    >

                      <ChevronLeft
                        size={15}
                      />

                    </button>

                    <span className="px-2 text-[10px] font-semibold text-slate-500">
                      {currentPage} /{' '}
                      {
                        totalPages
                      }
                    </span>

                    <button
                      type="button"
                      disabled={
                        currentPage >=
                        totalPages
                      }
                      onClick={() =>
                        setPage(
                          (
                            value
                          ) =>
                            Math.min(
                              totalPages,
                              value +
                                1
                            )
                        )
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                    >

                      <ChevronRight
                        size={15}
                      />

                    </button>

                  </div>

                </div>

              </>
            )}

        </div>

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <footer className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-[9px] text-slate-400 sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_NAME}
          </span>

          <span>
            Riwayat Kenaikan &amp; Kelulusan • Jenjang SD
          </span>

        </footer>

      </main>

      {/* ======================================================
          DETAIL MODAL
      ======================================================= */}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelected(
                null
              );
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

              <div>

                <div className="text-sm font-bold text-slate-800">
                  Detail Riwayat
                </div>

                <div className="mt-0.5 text-[10px] text-slate-400">
                  Data perubahan status akademik siswa
                </div>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(
                    null
                  )
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >

                <X
                  size={16}
                />

              </button>

            </div>

            {/* BODY */}

            <div className="space-y-4 p-5">

              {/* STUDENT */}

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">
                  {selected.student
                    ?.fullname
                    ?.charAt(
                      0
                    )
                    ?.toUpperCase() ||
                    '?'}
                </div>

                <div className="min-w-0">

                  <div className="truncate text-sm font-bold text-slate-700">
                    {selected.student
                      ?.fullname ||
                      '-'}
                  </div>

                  <div className="mt-0.5 text-[10px] text-slate-400">
                    NISN:{' '}
                    {selected.student
                      ?.nisn ||
                      '-'}
                  </div>

                </div>

              </div>

              <DetailRow
                label="Tahun Pelajaran"
                value={
                  selected.academicYear ||
                  '-'
                }
              />

              <DetailRow
                label="Kelas Asal"
                value={
                  selected.fromClass ||
                  '-'
                }
              />

              <DetailRow
                label={
                  normalizeStatus(
                    selected.status
                  ) ===
                  'LULUS'
                    ? 'Tujuan'
                    : 'Kelas Tujuan'
                }
                value={
                  getDestinationLabel(
                    selected
                  )
                }
              />

              {/* STATUS */}

              <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                <span className="text-[11px] text-slate-400">
                  Status
                </span>

                <span
                  className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                    getStatusConfig(
                      selected.status
                    ).className
                  }`}
                >
                  {
                    getStatusConfig(
                      selected.status
                    ).label
                  }
                </span>

              </div>

              <DetailRow
                label="Tanggal"
                value={
                  formatDate(
                    selected.promotedAt
                  )
                }
              />

              {/* NOTE */}

              <div>

                <div className="mb-1.5 text-[11px] text-slate-400">
                  Catatan
                </div>

                <div className="min-h-[60px] rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  {selected.note ||
                    'Tidak ada catatan.'}
                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3 text-right">

              <button
                type="button"
                onClick={() =>
                  setSelected(
                    null
                  )
                }
                className="rounded-xl bg-[#07543f] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#064735]"
              >
                Tutup
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

/* ============================================================
   SUMMARY CARD
============================================================ */

function SummaryCard({
  icon: Icon,
  label,
  value,
  tone = 'slate',
}: {
  icon: ElementType;
  label: string;
  value: number;
  tone?:
    | 'slate'
    | 'emerald'
    | 'blue'
    | 'amber';
}) {
  const tones = {
    slate:
      'bg-slate-50 text-slate-500',

    emerald:
      'bg-emerald-50 text-emerald-600',

    blue:
      'bg-blue-50 text-blue-600',

    amber:
      'bg-amber-50 text-amber-600',
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.025)]">

      <div className="flex items-center justify-between">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${tones[tone]}`}
        >

          <Icon
            size={15}
            strokeWidth={
              1.7
            }
          />

        </div>

        <span className="text-lg font-bold tracking-tight text-slate-700">
          {value}
        </span>

      </div>

      <div className="mt-3 text-[10px] font-medium text-slate-400">
        {label}
      </div>

    </div>
  );
}

/* ============================================================
   DETAIL ROW
============================================================ */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 border-b border-slate-100 pb-3">

      <span className="text-[11px] text-slate-400">
        {label}
      </span>

      <span className="text-right text-xs font-semibold text-slate-600">
        {value}
      </span>

    </div>
  );
}