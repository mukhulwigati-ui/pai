'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  FileCheck2,
  HeartPulse,
  ListOrdered,
  Printer,
  RefreshCw,
  Save,
  Search,
  UserCheck,
  Users,
  UserX,
} from 'lucide-react';

/* ============================================================
   KONFIGURASI SEKOLAH
============================================================ */

const SCHOOL_NAME =
  'Sekolah Dasar Islam Terpadu Khoiro Ummah';

const SCHOOL_SHORT_NAME =
  'SDIT Khoiro Ummah';

const SCHOOL_LEVEL =
  'SD';

const MIN_GRADE = 1;
const MAX_GRADE = 6;

/* ============================================================
   TYPES
============================================================ */

type Student = {
  id: number;
  fullname: string;
  class_name?: string | null;
};

type ClassRoom = {
  id: number;
  name: string;
  level?: string | null;
  grade?: number | null;
  status?: string | null;
};

type AttendanceStudent = {
  id?: number;
  fullname?: string | null;
  class_name?: string | null;
};

type Attendance = {
  id: number;
  studentId: number;
  status: string;
  date: string;
  student?: AttendanceStudent | null;
};

type MessageType =
  | 'success'
  | 'error'
  | '';

/* ============================================================
   STATUS
============================================================ */

const STATUS_OPTIONS = [
  {
    value: 'HADIR',
    label: 'Hadir',
    icon: CheckCircle2,
  },
  {
    value: 'SAKIT',
    label: 'Sakit',
    icon: HeartPulse,
  },
  {
    value: 'IZIN',
    label: 'Izin',
    icon: FileCheck2,
  },
  {
    value: 'ALPA',
    label: 'Alpa',
    icon: UserX,
  },
] as const;

/* ============================================================
   HELPERS
============================================================ */

function normalizeArray<T>(
  data: unknown,
  possibleKeys: string[] = []
): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === 'object'
  ) {
    const objectData =
      data as Record<string, unknown>;

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

function getStatusLabel(
  status: string
) {
  const option =
    STATUS_OPTIONS.find(
      (item) =>
        item.value ===
        status
    );

  return (
    option?.label ||
    status
  );
}

/*
 * YYYY-MM-DD berdasarkan tanggal lokal browser.
 *
 * Tidak memakai:
 * new Date().toISOString().split('T')[0]
 *
 * agar tanggal tidak bergeser karena UTC.
 */
function getLocalDateString(
  date = new Date()
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );

  return `${year}-${month}-${day}`;
}

function getFirstDayOfMonth() {
  const now =
    new Date();

  return getLocalDateString(
    new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    )
  );
}

/*
 * Normalisasi tanggal attendance menjadi YYYY-MM-DD.
 *
 * Dibuat aman untuk:
 * - 2026-10-03
 * - ISO DateTime
 * - Date dari database
 */
function getDateKey(
  value: string
) {
  if (!value) {
    return '';
  }

  /*
   * Kalau sudah YYYY-MM-DD,
   * jangan ubah menjadi UTC.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return value;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '';
  }

  return getLocalDateString(
    date
  );
}

function formatDate(
  dateValue: string
) {
  if (!dateValue) {
    return '-';
  }

  /*
   * Tambahkan jam lokal supaya YYYY-MM-DD
   * tidak bergeser ke tanggal sebelumnya.
   */
  const normalized =
    /^\d{4}-\d{2}-\d{2}$/.test(
      dateValue
    )
      ? `${dateValue}T12:00:00`
      : dateValue;

  const date =
    new Date(
      normalized
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-';
  }

  return date.toLocaleDateString(
    'id-ID',
    {
      weekday:
        'short',
      day:
        '2-digit',
      month:
        'short',
      year:
        'numeric',
    }
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function AttendancePage() {
  /* ==========================================================
     DATA STATE
  ========================================================== */

  const [
    attendances,
    setAttendances,
  ] =
    useState<Attendance[]>(
      []
    );

  const [
    students,
    setStudents,
  ] =
    useState<Student[]>(
      []
    );

  const [
    classes,
    setClasses,
  ] =
    useState<ClassRoom[]>(
      []
    );

  /* ==========================================================
     INPUT ABSENSI
  ========================================================== */

  const [
    selectedClass,
    setSelectedClass,
  ] =
    useState('');

  const [
    attendanceDate,
    setAttendanceDate,
  ] =
    useState(
      getLocalDateString
    );

  const [
    classAttendanceMap,
    setClassAttendanceMap,
  ] =
    useState<
      Record<
        number,
        string
      >
    >({});

  /* ==========================================================
     TAB
  ========================================================== */

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<
      'input' | 'rekap'
    >('input');

  /* ==========================================================
     FILTER REKAP
  ========================================================== */

  const [
    rekapStartDate,
    setRekapStartDate,
  ] =
    useState(
      getFirstDayOfMonth
    );

  const [
    rekapEndDate,
    setRekapEndDate,
  ] =
    useState(
      getLocalDateString
    );

  /* ==========================================================
     FILTER RIWAYAT
  ========================================================== */

  const [
    search,
    setSearch,
  ] =
    useState('');

  const [
    filterClass,
    setFilterClass,
  ] =
    useState(
      'SEMUA'
    );

  const [
    filterStatus,
    setFilterStatus,
  ] =
    useState(
      'SEMUA'
    );

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    message,
    setMessage,
  ] =
    useState('');

  const [
    messageType,
    setMessageType,
  ] =
    useState<MessageType>(
      ''
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    loadingData,
    setLoadingData,
  ] =
    useState(false);

  /* ==========================================================
     PRINT REF
  ========================================================== */

  const printRef =
    useRef<HTMLDivElement>(
      null
    );

  /* ==========================================================
     FETCH DATA
  ========================================================== */

  const fetchData =
    useCallback(
      async () => {
        setLoadingData(
          true
        );

        try {
          const attendanceUrl =
            `/api/attendance?startDate=${encodeURIComponent(
              rekapStartDate
            )}&endDate=${encodeURIComponent(
              rekapEndDate
            )}`;

          const [
            attendanceRes,
            studentRes,
            classRes,
          ] =
            await Promise.all([
              fetch(
                attendanceUrl,
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                '/api/students',
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                '/api/classes',
                {
                  cache:
                    'no-store',
                }
              ),
            ]);

          /* ================================================
             ATTENDANCE
          ================================================ */

          if (
            !attendanceRes.ok
          ) {
            throw new Error(
              await getApiError(
                attendanceRes,
                'Gagal memuat data kehadiran.'
              )
            );
          }

          const attendanceData =
            await attendanceRes.json();

          const attendanceList =
            normalizeArray<Attendance>(
              attendanceData,
              [
                'attendances',
                'attendance',
              ]
            );

          setAttendances(
            attendanceList
          );

          /* ================================================
             STUDENTS
          ================================================ */

          if (
            !studentRes.ok
          ) {
            throw new Error(
              await getApiError(
                studentRes,
                'Gagal memuat data siswa.'
              )
            );
          }

          const studentData =
            await studentRes.json();

          const studentList =
            normalizeArray<Student>(
              studentData,
              [
                'students',
                'student',
              ]
            );

          setStudents(
            studentList
          );

          /* ================================================
             CLASSES
          ================================================ */

          if (
            !classRes.ok
          ) {
            throw new Error(
              await getApiError(
                classRes,
                'Gagal memuat data kelas.'
              )
            );
          }

          const classData =
            await classRes.json();

          const classList =
            normalizeArray<ClassRoom>(
              classData,
              [
                'classes',
                'classRooms',
                'classrooms',
              ]
            );

          const sdClasses =
            classList
              .filter(
                (
                  item
                ) =>
                  !item.level ||
                  String(
                    item.level
                  ).toUpperCase() ===
                    SCHOOL_LEVEL
              )
              .filter(
                (
                  item
                ) => {
                  const grade =
                    Number(
                      item.grade
                    );

                  return (
                    !item.grade ||
                    (
                      grade >=
                        MIN_GRADE &&
                      grade <=
                        MAX_GRADE
                    )
                  );
                }
              )
              .filter(
                (
                  item
                ) =>
                  String(
                    item.status ||
                      'Aktif'
                  ).toLowerCase() !==
                  'tidak aktif'
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  Number(
                    a.grade ||
                      0
                  ) -
                    Number(
                      b.grade ||
                        0
                    ) ||
                  a.name.localeCompare(
                    b.name,
                    'id',
                    {
                      numeric:
                        true,
                    }
                  )
              );

          setClasses(
            sdClasses
          );

          /*
           * Pilih kelas pertama otomatis
           * hanya bila belum ada kelas aktif.
           */
          setSelectedClass(
            (
              current
            ) => {
              if (
                current &&
                sdClasses.some(
                  (
                    item
                  ) =>
                    item.name ===
                    current
                )
              ) {
                return current;
              }

              return (
                sdClasses[0]
                  ?.name ||
                ''
              );
            }
          );
        } catch (
          error
        ) {
          console.error(
            'Gagal mengambil data kehadiran:',
            error
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal memuat data.'
          );

          setMessageType(
            'error'
          );

          setAttendances(
            []
          );

          setStudents(
            []
          );

          setClasses(
            []
          );
        } finally {
          setLoadingData(
            false
          );
        }
      },
      [
        rekapStartDate,
        rekapEndDate,
      ]
    );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ==========================================================
     CLASS LIST

     Bersumber dari tabel ClassRoom,
     bukan disimpulkan dari data siswa.
  ========================================================== */

  const classList =
    useMemo(
      () =>
        classes.map(
          (
            item
          ) =>
            item.name
        ),
      [classes]
    );

  /* ==========================================================
     SISWA PER KELAS
  ========================================================== */

  const filteredStudentsByClass =
    useMemo(() => {
      if (
        !selectedClass
      ) {
        return [];
      }

      return students
        .filter(
          (
            student
          ) =>
            student.class_name ===
            selectedClass
        )
        .slice()
        .sort(
          (
            a,
            b
          ) =>
            a.fullname.localeCompare(
              b.fullname,
              'id'
            )
        );
    }, [
      students,
      selectedClass,
    ]);

  /* ==========================================================
     SINKRON STATUS ABSENSI
  ========================================================== */

  useEffect(() => {
    if (
      !selectedClass
    ) {
      setClassAttendanceMap(
        {}
      );

      return;
    }

    const initialMap:
      Record<
        number,
        string
      > = {};

    filteredStudentsByClass.forEach(
      (
        student
      ) => {
        const existing =
          attendances.find(
            (
              attendance
            ) => {
              if (
                attendance.studentId !==
                student.id
              ) {
                return false;
              }

              return (
                getDateKey(
                  attendance.date
                ) ===
                attendanceDate
              );
            }
          );

        initialMap[
          student.id
        ] =
          existing?.status ||
          'HADIR';
      }
    );

    setClassAttendanceMap(
      initialMap
    );
  }, [
    selectedClass,
    attendanceDate,
    filteredStudentsByClass,
    attendances,
  ]);

  /* ==========================================================
     CHANGE STATUS
  ========================================================== */

  const handleStatusChange =
    (
      studentId: number,
      newStatus: string
    ) => {
      setClassAttendanceMap(
        (
          previous
        ) => ({
          ...previous,
          [studentId]:
            newStatus,
        })
      );
    };

  /* ==========================================================
     SET SEMUA STATUS
  ========================================================== */

  const handleSetAllStatus =
    (
      statusValue: string
    ) => {
      const updatedMap:
        Record<
          number,
          string
        > = {};

      filteredStudentsByClass.forEach(
        (
          student
        ) => {
          updatedMap[
            student.id
          ] =
            statusValue;
        }
      );

      setClassAttendanceMap(
        updatedMap
      );
    };

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics =
    useMemo(() => {
      return {
        total:
          attendances.length,

        hadir:
          attendances.filter(
            (
              item
            ) =>
              item.status ===
              'HADIR'
          ).length,

        sakit:
          attendances.filter(
            (
              item
            ) =>
              item.status ===
              'SAKIT'
          ).length,

        izin:
          attendances.filter(
            (
              item
            ) =>
              item.status ===
              'IZIN'
          ).length,

        alpa:
          attendances.filter(
            (
              item
            ) =>
              item.status ===
              'ALPA'
          ).length,
      };
    }, [
      attendances,
    ]);

  /* ==========================================================
     REKAP PER SISWA
  ========================================================== */

  const studentRecapList =
    useMemo(() => {
      if (
        !selectedClass
      ) {
        return [];
      }

      return filteredStudentsByClass.map(
        (
          student
        ) => {
          const studentRecords =
            attendances.filter(
              (
                attendance
              ) => {
                if (
                  attendance.studentId !==
                  student.id
                ) {
                  return false;
                }

                const dateKey =
                  getDateKey(
                    attendance.date
                  );

                if (
                  rekapStartDate &&
                  dateKey <
                    rekapStartDate
                ) {
                  return false;
                }

                if (
                  rekapEndDate &&
                  dateKey >
                    rekapEndDate
                ) {
                  return false;
                }

                return true;
              }
            );

          const hadir =
            studentRecords.filter(
              (
                attendance
              ) =>
                attendance.status ===
                'HADIR'
            ).length;

          const sakit =
            studentRecords.filter(
              (
                attendance
              ) =>
                attendance.status ===
                'SAKIT'
            ).length;

          const izin =
            studentRecords.filter(
              (
                attendance
              ) =>
                attendance.status ===
                'IZIN'
            ).length;

          const alpa =
            studentRecords.filter(
              (
                attendance
              ) =>
                attendance.status ===
                'ALPA'
            ).length;

          return {
            ...student,
            hadir,
            sakit,
            izin,
            alpa,
            total:
              hadir +
              sakit +
              izin +
              alpa,
          };
        }
      );
    }, [
      filteredStudentsByClass,
      attendances,
      selectedClass,
      rekapStartDate,
      rekapEndDate,
    ]);

  /* ==========================================================
     FILTER RIWAYAT
  ========================================================== */

  const filteredAttendances =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return attendances.filter(
        (
          attendance
        ) => {
          const studentName =
            attendance.student
              ?.fullname ||
            `Siswa ID: ${attendance.studentId}`;

          const className =
            attendance.student
              ?.class_name ||
            '';

          const matchesSearch =
            !keyword ||
            studentName
              .toLowerCase()
              .includes(
                keyword
              ) ||
            className
              .toLowerCase()
              .includes(
                keyword
              );

          const matchesClass =
            filterClass ===
              'SEMUA' ||
            className ===
              filterClass;

          const matchesStatus =
            filterStatus ===
              'SEMUA' ||
            attendance.status ===
              filterStatus;

          return (
            matchesSearch &&
            matchesClass &&
            matchesStatus
          );
        }
      );
    }, [
      attendances,
      search,
      filterClass,
      filterStatus,
    ]);

  /* ==========================================================
     VALIDASI PERIODE REKAP
  ========================================================== */

  const invalidRekapPeriod =
    Boolean(
      rekapStartDate &&
        rekapEndDate &&
        rekapStartDate >
          rekapEndDate
    );

  /* ==========================================================
     SUBMIT BATCH
  ========================================================== */

  const handleSubmitBatch =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setMessage('');

      if (
        !selectedClass
      ) {
        setMessage(
          'Silakan pilih kelas terlebih dahulu.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      if (
        !attendanceDate
      ) {
        setMessage(
          'Silakan tentukan tanggal absensi.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      if (
        filteredStudentsByClass.length ===
        0
      ) {
        setMessage(
          'Tidak ada siswa di kelas ini.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      const payload =
        filteredStudentsByClass.map(
          (
            student
          ) => ({
            studentId:
              student.id,

            status:
              classAttendanceMap[
                student.id
              ] ||
              'HADIR',

            date:
              attendanceDate,
          })
        );

      setMessageType(
        ''
      );

      setLoading(
        true
      );

      try {
        const response =
          await fetch(
            '/api/attendance',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  payload
                ),
            }
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await getApiError(
              response,
              'Gagal menyimpan kehadiran.'
            )
          );
        }

        setMessage(
          `Kehadiran ${filteredStudentsByClass.length} siswa kelas ${selectedClass} berhasil disimpan.`
        );

        setMessageType(
          'success'
        );

        await fetchData();
      } catch (
        error
      ) {
        console.error(
          'Gagal menyimpan kehadiran:',
          error
        );

        setMessage(
          error instanceof
            Error
            ? error.message
            : 'Terjadi kesalahan saat menyimpan data kehadiran.'
        );

        setMessageType(
          'error'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* ==========================================================
     PRINT
  ========================================================== */

  const handleDirectPrint =
    () => {
      if (
        invalidRekapPeriod
      ) {
        setMessage(
          'Periode rekap tidak valid. Tanggal awal tidak boleh melebihi tanggal akhir.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      if (
        !selectedClass
      ) {
        setMessage(
          'Silakan pilih kelas terlebih dahulu.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      const printContent =
        printRef.current
          ?.innerHTML;

      if (
        !printContent
      ) {
        return;
      }

      const printWindow =
        window.open(
          '',
          '_blank',
          'width=900,height=700'
        );

      if (
        !printWindow
      ) {
        setMessage(
          'Jendela cetak tidak dapat dibuka. Pastikan popup diizinkan pada browser.'
        );

        setMessageType(
          'error'
        );

        return;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="id">
          <head>
            <meta charset="UTF-8" />

            <title>
              Rekap Kehadiran Kelas ${selectedClass}
            </title>

            <style>
              * {
                box-sizing: border-box;
              }

              body {
                font-family: Arial, Helvetica, sans-serif;
                padding: 24px;
                color: #000;
                background: #fff;
              }

              .header-print {
                text-align: center;
                border-bottom: 3px double #000;
                padding-bottom: 14px;
                margin-bottom: 20px;
              }

              .header-print h2 {
                margin: 0;
                font-size: 18px;
              }

              .header-print h3 {
                margin: 6px 0 0;
                font-size: 15px;
              }

              .header-print p {
                margin: 7px 0 0;
                font-size: 11px;
              }

              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                font-size: 11px;
              }

              th,
              td {
                border: 1px solid #333;
                padding: 7px;
              }

              th {
                background: #f2f2f2;
                text-align: center;
              }

              td:not(:nth-child(2)) {
                text-align: center;
              }

              .text-center {
                text-align: center;
              }

              .font-bold {
                font-weight: bold;
              }

              @page {
                size: A4 portrait;
                margin: 15mm;
              }

              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>

          <body>
            <div class="header-print">
              <h2>
                ${SCHOOL_NAME}
              </h2>

              <h3>
                Laporan Rekapitulasi Kehadiran Siswa
              </h3>

              <p>
                Kelas: ${selectedClass || '-'}
                |
                Periode:
                ${formatDate(rekapStartDate)}
                s.d.
                ${formatDate(rekapEndDate)}
              </p>
            </div>

            ${printContent}
          </body>
        </html>
      `);

      printWindow.document.close();

      printWindow.focus();

      setTimeout(
        () => {
          printWindow.print();

          printWindow.close();
        },
        400
      );
    };

  /* ==========================================================
     STATUS STYLE
  ========================================================== */

  const getStatusStyle =
    (
      value: string
    ) => {
      switch (
        value
      ) {
        case 'HADIR':
          return {
            wrapper:
              'bg-emerald-50 border-emerald-100 text-emerald-700',

            dot:
              'bg-emerald-500',
          };

        case 'SAKIT':
          return {
            wrapper:
              'bg-blue-50 border-blue-100 text-blue-700',

            dot:
              'bg-blue-500',
          };

        case 'IZIN':
          return {
            wrapper:
              'bg-amber-50 border-amber-100 text-amber-700',

            dot:
              'bg-amber-500',
          };

        case 'ALPA':
          return {
            wrapper:
              'bg-red-50 border-red-100 text-red-700',

            dot:
              'bg-red-500',
          };

        default:
          return {
            wrapper:
              'bg-slate-50 border-slate-100 text-slate-600',

            dot:
              'bg-slate-400',
          };
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#f5f7f6]">

      {/* ======================================================
          HERO
      ======================================================= */}

      <section className="relative overflow-hidden bg-[#063c30]">

        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-emerald-200/10" />

        <div className="pointer-events-none absolute -right-8 -top-12 h-48 w-48 rounded-full border border-amber-200/10" />

        <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-3 flex items-center gap-2">

                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-emerald-200">

                  <CalendarCheck
                    size={15}
                    strokeWidth={
                      1.7
                    }
                  />

                </span>

                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                  Akademik • Kehadiran
                </span>

              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Kehadiran Siswa
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/55">
                Catat kehadiran seluruh siswa dalam satu kelas sekaligus dan pantau rekapitulasi kehadiran setiap siswa.
              </p>

            </div>

            <div className="hidden text-right lg:block">

              <p className="text-xs font-semibold text-emerald-100/80">
                {SCHOOL_SHORT_NAME}
              </p>

              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-emerald-100/40">
                Jenjang Sekolah Dasar
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          MAIN
      ======================================================= */}

      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">

        {/* ====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={[
              'mb-6 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm',

              messageType ===
              'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700',
            ].join(
              ' '
            )}
          >

            <div
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',

                messageType ===
                'success'
                  ? 'bg-emerald-100'
                  : 'bg-red-100',
              ].join(
                ' '
              )}
            >

              {messageType ===
              'success' ? (
                <CheckCircle2
                  size={15}
                />
              ) : (
                <AlertCircle
                  size={15}
                />
              )}

            </div>

            <span className="flex-1">
              {message}
            </span>

          </div>
        )}

        {/* ====================================================
            STATISTICS
        ===================================================== */}

        <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-5">

          <StatisticCard
            label="Total Catatan"
            value={
              statistics.total
            }
            icon={
              Users
            }
            accent="slate"
          />

          <StatisticCard
            label="Hadir"
            value={
              statistics.hadir
            }
            icon={
              CheckCircle2
            }
            accent="emerald"
          />

          <StatisticCard
            label="Sakit"
            value={
              statistics.sakit
            }
            icon={
              HeartPulse
            }
            accent="blue"
          />

          <StatisticCard
            label="Izin"
            value={
              statistics.izin
            }
            icon={
              FileCheck2
            }
            accent="amber"
          />

          <StatisticCard
            label="Alpa"
            value={
              statistics.alpa
            }
            icon={
              UserX
            }
            accent="red"
          />

        </div>

        {/* ====================================================
            CONTENT GRID
        ===================================================== */}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">

          {/* ==================================================
              INPUT / REKAP
          =================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

            {/* TABS */}

            <div className="flex gap-4 overflow-x-auto border-b border-slate-100 bg-slate-50/50 px-6 pt-4">

              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    'input'
                  )
                }
                className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-xs font-bold transition ${
                  activeTab ===
                  'input'
                    ? 'border-[#063c30] text-[#063c30]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >

                <ListOrdered
                  size={15}
                />

                Lembar Kehadiran Harian

              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab(
                    'rekap'
                  )
                }
                className={`flex shrink-0 items-center gap-1.5 border-b-2 pb-3 text-xs font-bold transition ${
                  activeTab ===
                  'rekap'
                    ? 'border-[#063c30] text-[#063c30]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >

                <BarChart3
                  size={15}
                />

                Rekap Kehadiran Per Siswa

              </button>

            </div>

            {/* HEADER */}

            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#063c30] text-emerald-200">

                    <UserCheck
                      size={18}
                      strokeWidth={
                        1.7
                      }
                    />

                  </div>

                  <div>

                    <h2 className="text-sm font-semibold text-slate-800">

                      {activeTab ===
                      'input'
                        ? 'Lembar Kehadiran Kelas'
                        : 'Rekapitulasi Kehadiran Siswa'}

                    </h2>

                    <p className="mt-0.5 text-[11px] text-slate-400">

                      {activeTab ===
                      'input'
                        ? 'Pilih status kehadiran setiap siswa di bawah.'
                        : `Akumulasi kehadiran kelas ${selectedClass || '...'}`}

                    </p>

                  </div>

                </div>

                {activeTab ===
                  'input' &&
                  filteredStudentsByClass.length >
                    0 && (
                    <div className="flex flex-wrap items-center gap-1.5">

                      <span className="mr-1 text-[10px] font-semibold text-slate-400">
                        Set Semua:
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleSetAllStatus(
                            'HADIR'
                          )
                        }
                        className="rounded bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800 hover:bg-emerald-200"
                      >
                        Hadir
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSetAllStatus(
                            'SAKIT'
                          )
                        }
                        className="rounded bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-800 hover:bg-blue-200"
                      >
                        Sakit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSetAllStatus(
                            'IZIN'
                          )
                        }
                        className="rounded bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-800 hover:bg-amber-200"
                      >
                        Izin
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleSetAllStatus(
                            'ALPA'
                          )
                        }
                        className="rounded bg-red-100 px-2.5 py-1 text-[10px] font-bold text-red-800 hover:bg-red-200"
                      >
                        Alpa
                      </button>

                    </div>
                  )}

                {activeTab ===
                  'rekap' &&
                  studentRecapList.length >
                    0 && (
                    <button
                      type="button"
                      onClick={
                        handleDirectPrint
                      }
                      disabled={
                        invalidRekapPeriod
                      }
                      className="flex items-center gap-2 rounded-xl bg-[#063c30] px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-[#042a21] disabled:cursor-not-allowed disabled:opacity-50"
                    >

                      <Printer
                        size={14}
                      />

                      Cetak Rekap

                    </button>
                  )}

              </div>

              {/* ==============================================
                  FILTER
              =============================================== */}

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2">

                <div>

                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Pilih Kelas *
                  </label>

                  <select
                    value={
                      selectedClass
                    }
                    onChange={(
                      event
                    ) =>
                      setSelectedClass(
                        event.target
                          .value
                      )
                    }
                    required
                    disabled={
                      loadingData ||
                      classList.length ===
                        0
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <option value="">
                      {loadingData
                        ? 'Memuat kelas...'
                        : classList.length ===
                            0
                          ? 'Belum ada kelas SD'
                          : '-- Pilih Kelas --'}
                    </option>

                    {classes.map(
                      (
                        classRoom
                      ) => (
                        <option
                          key={
                            classRoom.id
                          }
                          value={
                            classRoom.name
                          }
                        >
                          Kelas{' '}
                          {
                            classRoom.name
                          }

                          {classRoom.grade
                            ? ` — Tingkat ${classRoom.grade}`
                            : ''}
                        </option>
                      )
                    )}

                  </select>

                </div>

                {activeTab ===
                'input' ? (
                  <div>

                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Tanggal Kehadiran *
                    </label>

                    <input
                      type="date"
                      value={
                        attendanceDate
                      }
                      onChange={(
                        event
                      ) =>
                        setAttendanceDate(
                          event.target
                            .value
                        )
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                    />

                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">

                    <div>

                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Dari Tanggal
                      </label>

                      <input
                        type="date"
                        value={
                          rekapStartDate
                        }
                        onChange={(
                          event
                        ) =>
                          setRekapStartDate(
                            event.target
                              .value
                          )
                        }
                        className={`w-full rounded-xl border bg-slate-50 px-2.5 py-2 text-xs text-slate-700 outline-none focus:bg-white ${
                          invalidRekapPeriod
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-slate-200 focus:border-emerald-500'
                        }`}
                      />

                    </div>

                    <div>

                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Sampai Tanggal
                      </label>

                      <input
                        type="date"
                        value={
                          rekapEndDate
                        }
                        onChange={(
                          event
                        ) =>
                          setRekapEndDate(
                            event.target
                              .value
                          )
                        }
                        className={`w-full rounded-xl border bg-slate-50 px-2.5 py-2 text-xs text-slate-700 outline-none focus:bg-white ${
                          invalidRekapPeriod
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-slate-200 focus:border-emerald-500'
                        }`}
                      />

                    </div>

                  </div>
                )}

              </div>

              {invalidRekapPeriod &&
                activeTab ===
                  'rekap' && (
                  <p className="mt-2 text-[10px] font-medium text-red-600">
                    Tanggal awal tidak boleh melebihi tanggal akhir.
                  </p>
                )}

            </div>

            {/* ================================================
                CONTENT
            ================================================= */}

            <div className="overflow-x-auto p-5">

              {!selectedClass ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  Silakan pilih kelas terlebih dahulu.
                </div>
              ) : activeTab ===
                'input' ? (
                filteredStudentsByClass.length ===
                0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    Tidak ada siswa di kelas ini.
                  </div>
                ) : (
                  <form
                    onSubmit={
                      handleSubmitBatch
                    }
                    className="space-y-4"
                  >

                    <table className="w-full min-w-[620px] border-collapse text-left text-xs">

                      <thead>

                        <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600">

                          <th className="w-12 p-3 text-center">
                            No
                          </th>

                          <th className="p-3">
                            Nama Siswa
                          </th>

                          <th className="w-72 p-3 text-center">
                            Status Kehadiran
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {filteredStudentsByClass.map(
                          (
                            student,
                            index
                          ) => {
                            const currentStatus =
                              classAttendanceMap[
                                student.id
                              ] ||
                              'HADIR';

                            return (
                              <tr
                                key={
                                  student.id
                                }
                                className="hover:bg-slate-50/50"
                              >

                                <td className="p-3 text-center text-slate-400">
                                  {
                                    index +
                                    1
                                  }
                                </td>

                                <td className="p-3 font-semibold text-slate-800">
                                  {
                                    student.fullname
                                  }
                                </td>

                                <td className="p-3 text-center">

                                  <div className="inline-flex gap-1 rounded-xl bg-slate-100 p-1">

                                    {STATUS_OPTIONS.map(
                                      (
                                        option
                                      ) => {
                                        const isSelected =
                                          currentStatus ===
                                          option.value;

                                        return (
                                          <button
                                            key={
                                              option.value
                                            }
                                            type="button"
                                            onClick={() =>
                                              handleStatusChange(
                                                student.id,
                                                option.value
                                              )
                                            }
                                            className={[
                                              'rounded-lg px-3 py-1.5 text-[11px] font-bold transition',

                                              isSelected
                                                ? option.value ===
                                                  'HADIR'
                                                  ? 'bg-emerald-600 text-white shadow-sm'
                                                  : option.value ===
                                                      'SAKIT'
                                                    ? 'bg-blue-600 text-white shadow-sm'
                                                    : option.value ===
                                                        'IZIN'
                                                      ? 'bg-amber-600 text-white shadow-sm'
                                                      : 'bg-red-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-200',
                                            ].join(
                                              ' '
                                            )}
                                          >
                                            {
                                              option.label
                                            }
                                          </button>
                                        );
                                      }
                                    )}

                                  </div>

                                </td>

                              </tr>
                            );
                          }
                        )}

                      </tbody>

                    </table>

                    <div className="flex justify-end pt-3">

                      <button
                        type="submit"
                        disabled={
                          loading ||
                          filteredStudentsByClass.length ===
                            0
                        }
                        className="flex items-center gap-2 rounded-xl bg-[#064e3b] px-6 py-3 text-xs font-bold text-white shadow-md transition hover:bg-[#053d2e] disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        {loading ? (
                          <RefreshCw
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Save
                            size={14}
                          />
                        )}

                        {loading
                          ? 'Menyimpan...'
                          : 'Simpan Kehadiran Satu Kelas'}

                      </button>

                    </div>

                  </form>
                )
              ) : invalidRekapPeriod ? (
                <div className="py-12 text-center text-xs text-red-500">
                  Periode rekap tidak valid.
                </div>
              ) : (
                <div
                  ref={
                    printRef
                  }
                >

                  {studentRecapList.length ===
                  0 ? (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Tidak ada data rekap untuk kelas dan rentang tanggal ini.
                    </div>
                  ) : (
                    <table className="w-full min-w-[620px] border-collapse text-left text-xs">

                      <thead>

                        <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600">

                          <th className="w-12 border border-slate-300 p-3 text-center">
                            No
                          </th>

                          <th className="border border-slate-300 p-3">
                            Nama Siswa
                          </th>

                          <th className="border border-slate-300 p-3 text-center text-emerald-700">
                            Hadir
                          </th>

                          <th className="border border-slate-300 p-3 text-center text-blue-700">
                            Sakit
                          </th>

                          <th className="border border-slate-300 p-3 text-center text-amber-700">
                            Izin
                          </th>

                          <th className="border border-slate-300 p-3 text-center text-red-700">
                            Alpa
                          </th>

                          <th className="border border-slate-300 p-3 text-center font-bold">
                            Total
                          </th>

                        </tr>

                      </thead>

                      <tbody>

                        {studentRecapList.map(
                          (
                            item,
                            index
                          ) => (
                            <tr
                              key={
                                item.id
                              }
                            >

                              <td className="border border-slate-300 p-3 text-center text-slate-500">
                                {
                                  index +
                                  1
                                }
                              </td>

                              <td className="border border-slate-300 p-3 font-semibold text-slate-800">
                                {
                                  item.fullname
                                }
                              </td>

                              <td className="border border-slate-300 bg-emerald-50/40 p-3 text-center font-bold text-emerald-700">
                                {
                                  item.hadir
                                }
                              </td>

                              <td className="border border-slate-300 bg-blue-50/40 p-3 text-center font-bold text-blue-700">
                                {
                                  item.sakit
                                }
                              </td>

                              <td className="border border-slate-300 bg-amber-50/40 p-3 text-center font-bold text-amber-700">
                                {
                                  item.izin
                                }
                              </td>

                              <td className="border border-slate-300 bg-red-50/40 p-3 text-center font-bold text-red-700">
                                {
                                  item.alpa
                                }
                              </td>

                              <td className="border border-slate-300 p-3 text-center font-bold text-slate-800">
                                {
                                  item.total
                                }
                              </td>

                            </tr>
                          )
                        )}

                      </tbody>

                    </table>
                  )}

                </div>
              )}

            </div>

          </section>

          {/* ==================================================
              RIWAYAT
          =================================================== */}

          <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">

            <div className="border-b border-slate-100 px-5 py-5 sm:px-6">

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">

                  <Clock3
                    size={17}
                    className="text-emerald-600"
                    strokeWidth={
                      1.7
                    }
                  />

                  <h2 className="text-sm font-semibold text-slate-800">
                    Riwayat Kehadiran
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={
                    fetchData
                  }
                  disabled={
                    loadingData
                  }
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >

                  <RefreshCw
                    size={13}
                    className={
                      loadingData
                        ? 'animate-spin'
                        : ''
                    }
                  />

                  Perbarui

                </button>

              </div>

              {/* ==============================================
                  CLASS FILTER
              =============================================== */}

              <div className="mt-3 flex flex-wrap gap-1.5">

                <button
                  type="button"
                  onClick={() =>
                    setFilterClass(
                      'SEMUA'
                    )
                  }
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                    filterClass ===
                    'SEMUA'
                      ? 'bg-[#063c30] text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua Kelas
                </button>

                {classList.map(
                  (
                    className
                  ) => (
                    <button
                      key={
                        className
                      }
                      type="button"
                      onClick={() =>
                        setFilterClass(
                          className
                        )
                      }
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                        filterClass ===
                        className
                          ? 'bg-[#063c30] text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Kelas{' '}
                      {
                        className
                      }
                    </button>
                  )
                )}

              </div>

              {/* SEARCH */}

              <div className="mt-3 flex gap-2">

                <div className="relative flex-1">

                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
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
                    placeholder="Cari siswa..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:bg-white"
                  />

                </div>

                <select
                  value={
                    filterStatus
                  }
                  onChange={(
                    event
                  ) =>
                    setFilterStatus(
                      event.target
                        .value
                    )
                  }
                  className="w-28 rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-slate-600 outline-none"
                >

                  <option value="SEMUA">
                    Status
                  </option>

                  <option value="HADIR">
                    Hadir
                  </option>

                  <option value="SAKIT">
                    Sakit
                  </option>

                  <option value="IZIN">
                    Izin
                  </option>

                  <option value="ALPA">
                    Alpa
                  </option>

                </select>

              </div>

            </div>

            {/* HISTORY LIST */}

            <div className="max-h-[500px] overflow-y-auto">

              {loadingData ? (
                <div className="flex flex-col items-center justify-center px-6 py-16">

                  <RefreshCw
                    size={22}
                    className="animate-spin text-emerald-600"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Memuat riwayat...
                  </p>

                </div>
              ) : filteredAttendances.length ===
                0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">

                  <CalendarCheck
                    size={24}
                    className="text-slate-300"
                    strokeWidth={
                      1.5
                    }
                  />

                  <h3 className="mt-3 text-xs font-semibold text-slate-600">
                    Belum ada catatan
                  </h3>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Data kehadiran belum tersedia untuk filter yang dipilih.
                  </p>

                </div>
              ) : (
                <div className="divide-y divide-slate-100">

                  {filteredAttendances.map(
                    (
                      attendance
                    ) => {
                      const style =
                        getStatusStyle(
                          attendance.status
                        );

                      const fullname =
                        attendance.student
                          ?.fullname ||
                        `Siswa ID: ${attendance.studentId}`;

                      const initial =
                        fullname
                          .charAt(
                            0
                          )
                          .toUpperCase();

                      return (
                        <div
                          key={
                            attendance.id
                          }
                          className="flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50"
                        >

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e9f2ef] text-xs font-bold text-[#07543f]">
                            {
                              initial
                            }
                          </div>

                          <div className="min-w-0 flex-1">

                            <div className="truncate text-xs font-semibold text-slate-800">
                              {
                                fullname
                              }
                            </div>

                            <div className="text-[10px] text-slate-400">
                              Kelas{' '}
                              {attendance.student
                                ?.class_name ||
                                '-'}{' '}
                              •{' '}
                              {formatDate(
                                attendance.date
                              )}
                            </div>

                          </div>

                          <div
                            className={[
                              'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide',
                              style.wrapper,
                            ].join(
                              ' '
                            )}
                          >

                            <span
                              className={[
                                'h-1.5 w-1.5 rounded-full',
                                style.dot,
                              ].join(
                                ' '
                              )}
                            />

                            <span>
                              {getStatusLabel(
                                attendance.status
                              )}
                            </span>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              )}

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

/* ============================================================
   STATISTIC CARD
============================================================ */

function StatisticCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon:
    React.ElementType;
  accent:
    | 'slate'
    | 'emerald'
    | 'blue'
    | 'amber'
    | 'red';
}) {
  const styles = {
    slate: {
      icon:
        'bg-slate-100 text-slate-500',

      value:
        'text-slate-800',
    },

    emerald: {
      icon:
        'bg-emerald-50 text-emerald-600',

      value:
        'text-emerald-700',
    },

    blue: {
      icon:
        'bg-blue-50 text-blue-600',

      value:
        'text-blue-700',
    },

    amber: {
      icon:
        'bg-amber-50 text-amber-600',

      value:
        'text-amber-700',
    },

    red: {
      icon:
        'bg-red-50 text-red-600',

      value:
        'text-red-700',
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.035)]">

      <div className="flex items-center justify-between gap-2">

        <div
          className={[
            'flex h-9 w-9 items-center justify-center rounded-xl',
            styles[
              accent
            ].icon,
          ].join(
            ' '
          )}
        >

          <Icon
            size={17}
            strokeWidth={
              1.7
            }
          />

        </div>

      </div>

      <div className="mt-3">

        <div
          className={[
            'text-xl font-semibold tracking-tight',
            styles[
              accent
            ].value,
          ].join(
            ' '
          )}
        >
          {value}
        </div>

        <div className="mt-0.5 text-[10px] font-medium text-slate-400">
          {label}
        </div>

      </div>

    </div>
  );
}