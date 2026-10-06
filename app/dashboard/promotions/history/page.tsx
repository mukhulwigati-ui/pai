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
    <div className="min-h-screen bg-[#f0f0f1]">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="mx-auto flex max-w-[1500px] flex-col gap-4 px-4 pt-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div>
          <h1 className="text-2xl font-normal text-[#1d2327] sm:text-3xl">Riwayat Kenaikan &amp; Kelulusan</h1>
          <p className="mt-2 text-base text-[#646970]">Telusuri riwayat siswa berdasarkan nama, tahun pelajaran, atau status.</p>
        </div>
        <Link href="/dashboard/promotions" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-sm border border-[#2271b1] bg-[#2271b1] px-4 py-2 text-sm font-semibold text-white hover:bg-[#135e96]">
          <ArrowLeft size={17} /> Kelola Kenaikan Kelas
        </Link>
      </header>

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

        <div className="mt-5 rounded-sm border border-[#dcdcde] bg-white p-4">

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

            {/* SEARCH */}

            <div className="relative flex-1">

              <Search
                size={16}
                strokeWidth={
                  1.8
                }
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#646970]"
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
                className="h-10 w-full rounded-sm border border-[#dcdcde] bg-[#f6f7f7] pl-10 pr-10 text-base text-[#1d2327] outline-none transition placeholder:text-[#646970] focus:border-[#2271b1] focus:bg-white focus:ring-2 focus:ring-[#2271b1]/20"
              />

              {search && (
                <button
                  type="button"
                  onClick={() =>
                    setSearch(
                      ''
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#646970] hover:text-[#646970]"
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
              className="h-10 rounded-sm border border-[#dcdcde] bg-white px-3 text-base font-medium text-[#646970] outline-none transition focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20"
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
              className="h-10 rounded-sm border border-[#dcdcde] bg-white px-3 text-base font-medium text-[#646970] outline-none transition focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20"
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
                className="h-10 rounded-sm border border-[#dcdcde] px-4 text-base font-semibold text-[#646970] transition hover:bg-[#f6f7f7] hover:text-[#1d2327]"
              >
                Reset
              </button>
            )}

          </div>

        </div>

        {/* ====================================================
            TABLE
        ===================================================== */}

        <div className="mt-5 overflow-hidden rounded-sm border border-[#dcdcde] bg-white">

          <div className="flex items-center justify-between border-b border-[#dcdcde] px-5 py-4">

            <div>

              <h2 className="text-sm font-bold text-[#1d2327]">
                Data Riwayat
              </h2>

              <p className="mt-0.5 text-sm text-[#646970]">
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

                <p className="mt-3 text-base text-[#646970]">
                  Memuat riwayat...
                </p>

              </div>

            </div>
          )}

          {/* ERROR */}

          {!loading &&
            error && (
              <div className="p-6">

                <div className="rounded-sm border border-red-100 bg-red-50 p-4">

                  <p className="text-base font-semibold text-red-700">
                    Gagal memuat data
                  </p>

                  <p className="mt-1 text-base text-red-600/80">
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

                <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-[#f6f7f7] text-[#646970]">

                  <History
                    size={26}
                    strokeWidth={
                      1.5
                    }
                  />

                </div>

                <h3 className="mt-4 text-sm font-semibold text-[#1d2327]">
                  Belum ada riwayat
                </h3>

                <p className="mt-1 max-w-sm text-base leading-5 text-[#646970]">
                  Belum terdapat data kenaikan kelas, tinggal kelas, atau kelulusan yang sesuai dengan filter.
                </p>

                {hasFilter && (
                  <button
                    type="button"
                    onClick={
                      resetFilter
                    }
                    className="mt-4 text-base font-semibold text-emerald-700 hover:text-emerald-800"
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

                      <tr className="border-b border-[#dcdcde] bg-[#f6f7f7]">

                        <th className="w-12 px-5 py-3 text-center text-sm font-bold  tracking-wider text-[#646970]">
                          #
                        </th>

                        <th className="px-3 py-3 text-left text-sm font-bold  tracking-wider text-[#646970]">
                          Siswa
                        </th>

                        <th className="px-3 py-3 text-left text-sm font-bold  tracking-wider text-[#646970]">
                          Tahun Pelajaran
                        </th>

                        <th className="px-3 py-3 text-center text-sm font-bold  tracking-wider text-[#646970]">
                          Kelas Asal
                        </th>

                        <th className="px-3 py-3 text-center text-sm font-bold  tracking-wider text-[#646970]">
                          Tujuan
                        </th>

                        <th className="px-3 py-3 text-center text-sm font-bold  tracking-wider text-[#646970]">
                          Status
                        </th>

                        <th className="px-3 py-3 text-left text-sm font-bold  tracking-wider text-[#646970]">
                          Tanggal
                        </th>

                        <th className="w-16 px-4 py-3" />

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-[#dcdcde]">

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
                              className="group transition hover:bg-[#f0f6fc]/[0.35]"
                            >

                              {/* NO */}

                              <td className="px-5 py-3.5 text-center text-sm text-[#646970]">
                                {(currentPage -
                                  1) *
                                  pageSize +
                                  index +
                                  1}
                              </td>

                              {/* STUDENT */}

                              <td className="px-3 py-3.5">

                                <div className="flex items-center gap-3">

                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-sm font-bold text-emerald-700">
                                    {student?.fullname
                                      ?.charAt(
                                        0
                                      )
                                      ?.toUpperCase() ||
                                      '?'}
                                  </div>

                                  <div className="min-w-0">

                                    <div className="break-words text-base font-semibold text-[#1d2327]">
                                      {student?.fullname ||
                                        '-'}
                                    </div>

                                    <div className="mt-0.5 text-sm text-[#646970]">
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
                                    className="text-[#646970]"
                                  />

                                  <span className="text-base font-medium text-[#646970]">
                                    {item.academicYear ||
                                      '-'}
                                  </span>

                                </div>

                              </td>

                              {/* FROM */}

                              <td className="px-3 py-3.5 text-center">

                                <span className="inline-flex rounded-sm bg-[#f6f7f7] px-2.5 py-1 text-sm font-semibold text-[#646970]">
                                  {item.fromClass ||
                                    '-'}
                                </span>

                              </td>

                              {/* DESTINATION */}

                              <td className="px-3 py-3.5 text-center">

                                <span
                                  className={`text-base font-semibold ${
                                    normalizeStatus(
                                      item.status
                                    ) ===
                                    'LULUS'
                                      ? 'text-blue-700'
                                      : 'text-[#646970]'
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
                                  className={`inline-flex rounded-sm px-2.5 py-1 text-sm font-bold ${config.className}`}
                                >
                                  {
                                    config.label
                                  }
                                </span>

                              </td>

                              {/* DATE */}

                              <td className="px-3 py-3.5">

                                <span className="text-sm text-[#646970]">
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
                                  className="flex h-8 w-8 items-center justify-center rounded-sm text-[#646970] transition hover:bg-[#f0f6fc] hover:text-[#2271b1]"
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

                <div className="divide-y divide-[#dcdcde] md:hidden">

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
                          className="block w-full p-4 text-left transition hover:bg-[#f6f7f7]"
                        >

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <div className="break-words text-sm font-bold text-[#1d2327]">
                                {item.student
                                  ?.fullname ||
                                  '-'}
                              </div>

                              <div className="mt-0.5 text-sm text-[#646970]">
                                NISN:{' '}
                                {item.student
                                  ?.nisn ||
                                  '-'}
                              </div>

                            </div>

                            <span
                              className={`shrink-0 rounded-sm px-2.5 py-1 text-sm font-bold ${config.className}`}
                            >
                              {
                                config.label
                              }
                            </span>

                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">

                            <div className="rounded-sm bg-[#f6f7f7] p-2">

                              <div className="text-[#646970]">
                                Kelas Asal
                              </div>

                              <div className="mt-0.5 font-semibold text-[#1d2327]">
                                {item.fromClass ||
                                  '-'}
                              </div>

                            </div>

                            <div className="rounded-sm bg-[#f6f7f7] p-2">

                              <div className="text-[#646970]">
                                Tujuan
                              </div>

                              <div className="mt-0.5 font-semibold text-[#1d2327]">
                                {
                                  getDestinationLabel(
                                    item
                                  )
                                }
                              </div>

                            </div>

                          </div>

                          <div className="mt-3 flex items-center justify-between text-sm text-[#646970]">

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

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#dcdcde] px-4 py-3 sm:px-5">

                  <p className="text-sm text-[#646970]">

                    Menampilkan{' '}

                    <span className="font-semibold text-[#646970]">
                      {filteredData.length ===
                      0
                        ? 0
                        : (currentPage -
                              1) *
                            pageSize +
                          1}
                    </span>

                    {' - '}

                    <span className="font-semibold text-[#646970]">
                      {Math.min(
                        currentPage *
                          pageSize,
                        filteredData.length
                      )}
                    </span>

                    {' dari '}

                    <span className="font-semibold text-[#646970]">
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
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#dcdcde] text-[#646970] transition hover:bg-[#f6f7f7] disabled:cursor-not-allowed disabled:opacity-30"
                    >

                      <ChevronLeft
                        size={15}
                      />

                    </button>

                    <span className="px-2 text-sm font-semibold text-[#646970]">
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
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-[#dcdcde] text-[#646970] transition hover:bg-[#f6f7f7] disabled:cursor-not-allowed disabled:opacity-30"
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

        <footer className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-[#dcdcde] pt-4 text-sm text-[#646970] sm:flex-row">

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

          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm bg-white">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-[#dcdcde] px-5 py-4">

              <div>

                <div className="text-sm font-bold text-[#1d2327]">
                  Detail Riwayat
                </div>

                <div className="mt-0.5 text-sm text-[#646970]">
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
                className="flex h-8 w-8 items-center justify-center rounded-sm text-[#646970] transition hover:bg-[#f6f7f7] hover:text-[#646970]"
              >

                <X
                  size={16}
                />

              </button>

            </div>

            {/* BODY */}

            <div className="space-y-4 p-5">

              {/* STUDENT */}

              <div className="flex items-center gap-3 rounded-sm bg-[#f6f7f7] p-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-sm bg-emerald-100 text-sm font-bold text-emerald-700">
                  {selected.student
                    ?.fullname
                    ?.charAt(
                      0
                    )
                    ?.toUpperCase() ||
                    '?'}
                </div>

                <div className="min-w-0">

                  <div className="break-words text-sm font-bold text-[#1d2327]">
                    {selected.student
                      ?.fullname ||
                      '-'}
                  </div>

                  <div className="mt-0.5 text-sm text-[#646970]">
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

              <div className="flex items-center justify-between border-b border-[#dcdcde] pb-3">

                <span className="text-sm text-[#646970]">
                  Status
                </span>

                <span
                  className={`rounded-sm px-2.5 py-1 text-sm font-bold ${
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

                <div className="mb-1.5 text-sm text-[#646970]">
                  Catatan
                </div>

                <div className="min-h-[60px] rounded-sm bg-[#f6f7f7] p-3 text-base leading-5 text-[#646970]">
                  {selected.note ||
                    'Tidak ada catatan.'}
                </div>

              </div>

            </div>

            {/* FOOTER */}

            <div className="border-t border-[#dcdcde] bg-[#f6f7f7] px-5 py-3 text-right">

              <button
                type="button"
                onClick={() =>
                  setSelected(
                    null
                  )
                }
                className="rounded-sm bg-[#2271b1] px-4 py-2 text-base font-semibold text-white transition hover:bg-[#135e96]"
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
    <div className="rounded-sm border border-[#dcdcde] bg-white p-4">

      <div className="flex items-center justify-between">

        <div
          className={`flex h-8 w-8 items-center justify-center rounded-sm ${tones[tone]}`}
        >

          <Icon
            size={15}
            strokeWidth={
              1.7
            }
          />

        </div>

        <span className="text-lg font-bold  text-[#1d2327]">
          {value}
        </span>

      </div>

      <div className="mt-3 text-sm font-medium text-[#646970]">
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
    <div className="flex items-center justify-between gap-5 border-b border-[#dcdcde] pb-3">

      <span className="text-sm text-[#646970]">
        {label}
      </span>

      <span className="text-right text-base font-semibold text-[#646970]">
        {value}
      </span>

    </div>
  );
}