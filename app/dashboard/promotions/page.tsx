'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Loader2,
  RefreshCw,
  School,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_NAME =
  'Sekolah Dasar Islam Terpadu Khoiro Ummah';

const SCHOOL_SHORT_NAME =
  'SDIT Khoiro Ummah';

const SCHOOL_LEVEL = 'SD';

const VALID_GRADES = [
  1,
  2,
  3,
  4,
  5,
  6,
] as const;

type PromotionStatus =
  | 'NAIK'
  | 'TINGGAL'
  | 'LULUS';

type MessageType =
  | 'success'
  | 'error'
  | '';

/* ============================================================
   TYPES
============================================================ */

type Student = {
  id: number;
  nisn: string;
  fullname: string;
  gender: string;
  class_name: string;
};

type Classroom = {
  id: number;
  name: string;
  level?: string | null;
  grade?: number | null;
  status?: string | null;
};

type SettingsData = {
  schoolName?: string | null;
  academicYear?: string | null;
  semester?: string | null;
  principalName?: string | null;
};

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
) {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, ' ');
}

function isInactiveStatus(
  status?: string | null
) {
  const normalized =
    normalizeText(
      status
    ).toLowerCase();

  return (
    normalized ===
      'nonaktif' ||
    normalized ===
      'tidak aktif'
  );
}

function isValidAcademicYear(
  value: string
) {
  const match =
    value.match(
      /^(\d{4})\/(\d{4})$/
    );

  if (!match) {
    return false;
  }

  const first =
    Number(match[1]);

  const second =
    Number(match[2]);

  return (
    Number.isInteger(first) &&
    Number.isInteger(second) &&
    second === first + 1
  );
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

/* ============================================================
   PAGE
============================================================ */

export default function PromotionsPage() {
  /* ==========================================================
     MASTER DATA
  ========================================================== */

  const [
    classrooms,
    setClassrooms,
  ] =
    useState<Classroom[]>(
      []
    );

  const [
    students,
    setStudents,
  ] =
    useState<Student[]>(
      []
    );

  /* ==========================================================
     FORM
  ========================================================== */

  const [
    fromClass,
    setFromClass,
  ] =
    useState('');

  const [
    toClass,
    setToClass,
  ] =
    useState('');

  const [
    academicYear,
    setAcademicYear,
  ] =
    useState('');

  const [
    status,
    setStatus,
  ] =
    useState<PromotionStatus>(
      'NAIK'
    );

  const [
    note,
    setNote,
  ] =
    useState('');

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<number[]>(
      []
    );

  /* ==========================================================
     UI
  ========================================================== */

  const [
    loadingClasses,
    setLoadingClasses,
  ] =
    useState(true);

  const [
    loadingStudents,
    setLoadingStudents,
  ] =
    useState(false);

  const [
    processing,
    setProcessing,
  ] =
    useState(false);

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

  /* ==========================================================
     MESSAGE
  ========================================================== */

  const showMessage =
    (
      text: string,
      type: MessageType
    ) => {
      setMessage(text);
      setMessageType(type);
    };

  const clearMessage =
    () => {
      setMessage('');
      setMessageType('');
    };

  /* ==========================================================
     SELECTED SOURCE CLASS
  ========================================================== */

  const selectedSourceClass =
    useMemo(
      () =>
        classrooms.find(
          (
            classroom
          ) =>
            classroom.name ===
            fromClass
        ) || null,
      [
        classrooms,
        fromClass,
      ]
    );

  const sourceGrade =
    Number(
      selectedSourceClass
        ?.grade || 0
    );

  const isGradeSix =
    sourceGrade === 6;

  /* ==========================================================
     LOAD MASTER DATA
  ========================================================== */

  const fetchClassrooms =
    useCallback(
      async () => {
        try {
          setLoadingClasses(
            true
          );

          clearMessage();

          const [
            classResponse,
            settingsResponse,
          ] =
            await Promise.all([
              fetch(
                '/api/classes',
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                '/api/settings',
                {
                  cache:
                    'no-store',
                }
              ),
            ]);

          /* ----------------------------------------------
             CLASSES
          ---------------------------------------------- */

          if (
            !classResponse.ok
          ) {
            throw new Error(
              await getApiError(
                classResponse,
                'Gagal mengambil daftar kelas.'
              )
            );
          }

          const classData =
            await classResponse.json();

          const classList =
            normalizeArray<Classroom>(
              classData,
              [
                'classes',
                'classrooms',
                'classRooms',
              ]
            );

          const sdClasses =
            classList
              .filter(
                (
                  classroom
                ) => {
                  const level =
                    String(
                      classroom.level ??
                        SCHOOL_LEVEL
                    )
                      .trim()
                      .toUpperCase();

                  const grade =
                    Number(
                      classroom.grade
                    );

                  return (
                    level ===
                      SCHOOL_LEVEL &&
                    VALID_GRADES.includes(
                      grade as
                        | 1
                        | 2
                        | 3
                        | 4
                        | 5
                        | 6
                    ) &&
                    !isInactiveStatus(
                      classroom.status
                    )
                  );
                }
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  Number(
                    a.grade
                  ) -
                    Number(
                      b.grade
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

          setClassrooms(
            sdClasses
          );

          /* ----------------------------------------------
             SETTINGS
          ---------------------------------------------- */

          if (
            settingsResponse.ok
          ) {
            const settingsData =
              await settingsResponse.json();

            const settings =
              (
                settingsData?.data ||
                settingsData ||
                {}
              ) as SettingsData;

            const year =
              normalizeText(
                settings.academicYear
              );

            setAcademicYear(
              year ||
                '2026/2027'
            );
          } else {
            setAcademicYear(
              '2026/2027'
            );
          }

          /* ----------------------------------------------
             VALIDASI FILTER LAMA
          ---------------------------------------------- */

          setFromClass(
            (
              current
            ) =>
              sdClasses.some(
                (
                  item
                ) =>
                  item.name ===
                  current
              )
                ? current
                : ''
          );
        } catch (
          error
        ) {
          console.error(
            'LOAD PROMOTION MASTER ERROR:',
            error
          );

          setClassrooms(
            []
          );

          showMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal mengambil daftar kelas.',
            'error'
          );
        } finally {
          setLoadingClasses(
            false
          );
        }
      },
      []
    );

  /* ==========================================================
     LOAD STUDENTS
  ========================================================== */

  const fetchStudents =
    useCallback(
      async (
        className: string
      ) => {
        if (
          !className
        ) {
          setStudents(
            []
          );

          setSelectedIds(
            []
          );

          return;
        }

        try {
          setLoadingStudents(
            true
          );

          clearMessage();

          setSelectedIds(
            []
          );

          const response =
            await fetch(
              `/api/promotions?className=${encodeURIComponent(
                className
              )}`,
              {
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
                'Gagal mengambil data siswa.'
              )
            );
          }

          const result =
            await response.json();

          const list =
            normalizeArray<Student>(
              result,
              [
                'students',
              ]
            )
              .filter(
                (
                  student
                ) =>
                  student.class_name ===
                  className
              )
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

          setStudents(
            list
          );
        } catch (
          error
        ) {
          console.error(
            'LOAD PROMOTION STUDENTS ERROR:',
            error
          );

          setStudents(
            []
          );

          showMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal mengambil data siswa.',
            'error'
          );
        } finally {
          setLoadingStudents(
            false
          );
        }
      },
      []
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  useEffect(() => {
    fetchStudents(
      fromClass
    );
  }, [
    fromClass,
    fetchStudents,
  ]);

  /* ==========================================================
     STATUS OTOMATIS BERDASARKAN KELAS
  ========================================================== */

  useEffect(() => {
    if (
      !selectedSourceClass
    ) {
      setStatus(
        'NAIK'
      );

      setToClass(
        ''
      );

      return;
    }

    /*
     * Kelas 6 default ke LULUS.
     */
    if (
      Number(
        selectedSourceClass.grade
      ) === 6
    ) {
      setStatus(
        'LULUS'
      );

      setToClass(
        ''
      );

      return;
    }

    /*
     * Kelas 1–5 default NAIK.
     */
    setStatus(
      'NAIK'
    );

    setToClass(
      ''
    );
  }, [
    selectedSourceClass,
  ]);

  /* ==========================================================
     KELAS TUJUAN
  ========================================================== */

  const availableTargetClasses =
    useMemo(() => {
      if (
        !selectedSourceClass ||
        status !== 'NAIK'
      ) {
        return [];
      }

      const currentGrade =
        Number(
          selectedSourceClass.grade
        );

      const targetGrade =
        currentGrade + 1;

      return classrooms.filter(
        (
          classroom
        ) =>
          Number(
            classroom.grade
          ) ===
          targetGrade
      );
    }, [
      classrooms,
      selectedSourceClass,
      status,
    ]);

  /* ==========================================================
     AUTO SELECT TARGET
     Bila tingkat berikutnya hanya punya satu rombel.
  ========================================================== */

  useEffect(() => {
    if (
      status !== 'NAIK'
    ) {
      setToClass('');
      return;
    }

    if (
      availableTargetClasses.length ===
      1
    ) {
      setToClass(
        availableTargetClasses[0]
          .name
      );

      return;
    }

    setToClass(
      (
        current
      ) =>
        availableTargetClasses.some(
          (
            item
          ) =>
            item.name ===
            current
        )
          ? current
          : ''
    );
  }, [
    status,
    availableTargetClasses,
  ]);

  /* ==========================================================
     SELECT ALL
  ========================================================== */

  const allSelected =
    students.length > 0 &&
    selectedIds.length ===
      students.length;

  const handleSelectAll =
    (
      checked: boolean
    ) => {
      if (
        checked
      ) {
        setSelectedIds(
          students.map(
            (
              student
            ) =>
              student.id
          )
        );
      } else {
        setSelectedIds(
          []
        );
      }
    };

  /* ==========================================================
     SELECT STUDENT
  ========================================================== */

  const handleSelectStudent =
    (
      id: number
    ) => {
      setSelectedIds(
        (
          current
        ) =>
          current.includes(
            id
          )
            ? current.filter(
                (
                  studentId
                ) =>
                  studentId !==
                  id
              )
            : [
                ...current,
                id,
              ]
      );
    };

  /* ==========================================================
     RESET
  ========================================================== */

  const resetSelection =
    () => {
      setSelectedIds(
        []
      );

      clearMessage();
    };

  /* ==========================================================
     CHANGE STATUS
  ========================================================== */

  const handleStatusChange =
    (
      value: PromotionStatus
    ) => {
      clearMessage();

      /*
       * LULUS hanya untuk kelas 6.
       */
      if (
        value ===
          'LULUS' &&
        sourceGrade !== 6
      ) {
        showMessage(
          'Status Lulus hanya dapat digunakan untuk siswa kelas 6.',
          'error'
        );

        return;
      }

      /*
       * NAIK tidak berlaku untuk kelas 6.
       */
      if (
        value ===
          'NAIK' &&
        sourceGrade === 6
      ) {
        showMessage(
          'Siswa kelas 6 tidak dapat dinaikkan ke kelas internal berikutnya. Gunakan status Lulus.',
          'error'
        );

        return;
      }

      setStatus(
        value
      );

      setToClass(
        ''
      );
    };

  /* ==========================================================
     PROCESS
  ========================================================== */

  const handlePromotion =
    async () => {
      clearMessage();

      /* ----------------------------------------------
         STUDENTS
      ---------------------------------------------- */

      if (
        selectedIds.length ===
        0
      ) {
        showMessage(
          'Pilih minimal satu siswa terlebih dahulu.',
          'error'
        );

        return;
      }

      /* ----------------------------------------------
         SOURCE CLASS
      ---------------------------------------------- */

      if (
        !selectedSourceClass
      ) {
        showMessage(
          'Kelas asal tidak valid.',
          'error'
        );

        return;
      }

      /* ----------------------------------------------
         ACADEMIC YEAR
      ---------------------------------------------- */

      const cleanAcademicYear =
        normalizeText(
          academicYear
        );

      if (
        !isValidAcademicYear(
          cleanAcademicYear
        )
      ) {
        showMessage(
          'Format tahun pelajaran tidak valid. Gunakan format seperti 2026/2027.',
          'error'
        );

        return;
      }

      /* ----------------------------------------------
         NAIK
      ---------------------------------------------- */

      if (
        status ===
        'NAIK'
      ) {
        if (
          sourceGrade >= 6
        ) {
          showMessage(
            'Kelas 6 tidak dapat diproses sebagai Naik Kelas. Gunakan status Lulus.',
            'error'
          );

          return;
        }

        if (
          !toClass
        ) {
          showMessage(
            `Pilih kelas tujuan tingkat ${sourceGrade + 1}.`,
            'error'
          );

          return;
        }

        const target =
          classrooms.find(
            (
              classroom
            ) =>
              classroom.name ===
              toClass
          );

        if (
          !target
        ) {
          showMessage(
            'Kelas tujuan tidak ditemukan.',
            'error'
          );

          return;
        }

        if (
          Number(
            target.grade
          ) !==
          sourceGrade + 1
        ) {
          showMessage(
            `Siswa kelas ${sourceGrade} hanya boleh dinaikkan ke kelas tingkat ${sourceGrade + 1}.`,
            'error'
          );

          return;
        }

        if (
          fromClass ===
          toClass
        ) {
          showMessage(
            'Kelas tujuan tidak boleh sama dengan kelas asal.',
            'error'
          );

          return;
        }
      }

      /* ----------------------------------------------
         LULUS
      ---------------------------------------------- */

      if (
        status ===
          'LULUS' &&
        sourceGrade !== 6
      ) {
        showMessage(
          'Kelulusan hanya dapat diproses untuk siswa kelas 6.',
          'error'
        );

        return;
      }

      /* ----------------------------------------------
         CONFIRMATION
      ---------------------------------------------- */

      const selectedStudents =
        students.filter(
          (
            student
          ) =>
            selectedIds.includes(
              student.id
            )
        );

      const names =
        selectedStudents
          .slice(
            0,
            3
          )
          .map(
            (
              student
            ) =>
              student.fullname
          )
          .join(
            ', '
          );

      const more =
        selectedStudents.length >
        3
          ? ` dan ${selectedStudents.length - 3} lainnya`
          : '';

      let actionText =
        '';

      if (
        status ===
        'NAIK'
      ) {
        actionText =
          `dinaikkan dari kelas ${fromClass} ke kelas ${toClass}`;
      } else if (
        status ===
        'TINGGAL'
      ) {
        actionText =
          `ditetapkan tetap di kelas ${fromClass}`;
      } else {
        actionText =
          'dinyatakan lulus dari SD';
      }

      const confirmed =
        window.confirm(
          `Yakin memproses ${selectedIds.length} siswa untuk ${actionText}?\n\n${names}${more}`
        );

      if (
        !confirmed
      ) {
        return;
      }

      /* ----------------------------------------------
         REQUEST
      ---------------------------------------------- */

      try {
        setProcessing(
          true
        );

        const response =
          await fetch(
            '/api/promotions',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              body:
                JSON.stringify(
                  {
                    studentIds:
                      selectedIds,

                    /*
                     * Dikirim juga supaya backend
                     * bisa memvalidasi kelas asal.
                     */
                    fromClass,

                    /*
                     * NAIK = nama kelas tujuan
                     * TINGGAL / LULUS = null
                     */
                    toClass:
                      status ===
                      'NAIK'
                        ? toClass
                        : null,

                    status,

                    academicYear:
                      cleanAcademicYear,

                    note:
                      normalizeText(
                        note
                      ),
                  }
                ),
            }
          );

        if (
          !response.ok
        ) {
          throw new Error(
            await getApiError(
              response,
              'Gagal memproses kenaikan kelas atau kelulusan.'
            )
          );
        }

        const result =
          await response.json();

        showMessage(
          result?.message ||
            'Proses kenaikan kelas/kelulusan berhasil diselesaikan.',
          'success'
        );

        /*
         * Muat ulang siswa dari kelas asal.
         * Siswa yang naik/lulus seharusnya
         * tidak lagi muncul bila backend
         * sudah memperbarui class_name.
         */
        await fetchStudents(
          fromClass
        );

        setSelectedIds(
          []
        );

        setNote(
          ''
        );
      } catch (
        error
      ) {
        console.error(
          'PROCESS PROMOTION ERROR:',
          error
        );

        showMessage(
          error instanceof
            Error
            ? error.message
            : 'Gagal memproses kenaikan kelas atau kelulusan.',
          'error'
        );
      } finally {
        setProcessing(
          false
        );
      }
    };

  /* ==========================================================
     ACTION LABEL
  ========================================================== */

  const actionLabel =
    status === 'NAIK'
      ? `Naikkan ${selectedIds.length} Siswa`
      : status ===
          'TINGGAL'
        ? `Tetapkan ${selectedIds.length} Siswa Tinggal Kelas`
        : `Luluskan ${selectedIds.length} Siswa`;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f0f0f1]">

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-normal text-[#1d2327] sm:text-3xl">Kenaikan Kelas &amp; Kelulusan</h1>
            <p className="mt-2 text-base text-[#646970]">Pilih siswa dan tentukan kenaikan kelas, tinggal kelas, atau kelulusan.</p>
          </div>
          <div className="text-sm text-[#646970]">
            Tahun Pelajaran <span className="ml-2 font-semibold text-[#1d2327]">{academicYear || 'Belum diatur'}</span>
          </div>
        </header>

        {/* ====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-sm font-medium ${
              messageType ===
              'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >

            {messageType ===
            'success' ? (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />
            )}

            {message}

          </div>
        )}

        {/* ====================================================
            FILTER / FORM
        ===================================================== */}

        <section className="rounded-sm border border-[#c3c4c7] bg-white p-5">

          <div className="mb-5 flex items-center justify-between gap-4">

            <div>

              <h2 className="text-sm font-bold text-[#1d2327]">
                Pengaturan Proses
              </h2>

              <p className="mt-1 text-sm text-[#646970]">
                Pilih kelas asal dan keputusan kenaikan/kelulusan.
              </p>

            </div>

            <button
              type="button"
              onClick={
                fetchClassrooms
              }
              disabled={
                loadingClasses
              }
              className="inline-flex items-center gap-2 rounded-sm border border-[#c3c4c7] px-3 py-2 text-sm font-semibold text-[#646970] transition hover:bg-[#f6f7f7] disabled:opacity-50"
            >

              <RefreshCw
                size={12}
                className={
                  loadingClasses
                    ? 'animate-spin'
                    : ''
                }
              />

              Perbarui

            </button>

          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            {/* ACADEMIC YEAR */}

            <div>

              <label className="mb-1.5 block text-sm font-bold text-[#1d2327]">
                Tahun Pelajaran
              </label>

              <input
                type="text"
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
                maxLength={9}
                placeholder="2026/2027"
                className="h-11 w-full rounded-sm border border-[#c3c4c7] px-3 text-base outline-none transition focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20"
              />

            </div>

            {/* SOURCE */}

            <div>

              <label className="mb-1.5 block text-sm font-bold text-[#1d2327]">
                Kelas Asal
              </label>

              <select
                value={
                  fromClass
                }
                onChange={(
                  event
                ) => {
                  setFromClass(
                    event.target
                      .value
                  );

                  setSelectedIds(
                    []
                  );

                  clearMessage();
                }}
                disabled={
                  loadingClasses
                }
                className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-white px-3 text-base outline-none transition focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 disabled:bg-[#f6f7f7]"
              >

                <option value="">
                  -- Pilih Kelas Asal --
                </option>

                {classrooms.map(
                  (
                    classroom
                  ) => (
                    <option
                      key={
                        classroom.id
                      }
                      value={
                        classroom.name
                      }
                    >
                      Kelas{' '}
                      {
                        classroom.name
                      }{' '}
                      • Tingkat{' '}
                      {
                        classroom.grade
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            {/* TARGET */}

            <div>

              <label className="mb-1.5 block text-sm font-bold text-[#1d2327]">
                Kelas Tujuan
              </label>

              {status ===
              'TINGGAL' ? (
                <div className="flex h-11 items-center rounded-sm border border-[#c3c4c7] bg-[#f6f7f7] px-3 text-sm text-[#646970]">
                  Tetap di {fromClass || 'kelas asal'}
                </div>
              ) : status ===
                'LULUS' ? (
                <div className="flex h-11 items-center rounded-sm border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-700">
                  Lulus dari SD
                </div>
              ) : (
                <select
                  value={
                    toClass
                  }
                  onChange={(
                    event
                  ) =>
                    setToClass(
                      event.target
                        .value
                    )
                  }
                  disabled={
                    !fromClass ||
                    loadingClasses ||
                    isGradeSix
                  }
                  className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-white px-3 text-base outline-none transition focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 disabled:bg-[#f6f7f7] disabled:text-[#646970]"
                >

                  <option value="">
                    {selectedSourceClass
                      ? `-- Pilih Kelas Tingkat ${sourceGrade + 1} --`
                      : '-- Pilih Kelas Asal Dulu --'}
                  </option>

                  {availableTargetClasses.map(
                    (
                      classroom
                    ) => (
                      <option
                        key={
                          classroom.id
                        }
                        value={
                          classroom.name
                        }
                      >
                        Kelas{' '}
                        {
                          classroom.name
                        }
                      </option>
                    )
                  )}

                </select>
              )}

            </div>

            {/* STATUS */}

            <div>

              <label className="mb-1.5 block text-sm font-bold text-[#1d2327]">
                Status Keputusan
              </label>

              <select
                value={
                  status
                }
                onChange={(
                  event
                ) =>
                  handleStatusChange(
                    event.target
                      .value as PromotionStatus
                  )
                }
                disabled={
                  !fromClass
                }
                className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-white px-3 text-base outline-none transition focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20 disabled:bg-[#f6f7f7]"
              >

                {sourceGrade <
                  6 && (
                  <option value="NAIK">
                    Naik Kelas
                  </option>
                )}

                <option value="TINGGAL">
                  Tinggal Kelas
                </option>

                {sourceGrade ===
                  6 && (
                  <option value="LULUS">
                    Lulus
                  </option>
                )}

              </select>

            </div>

          </div>

          {/* NOTE */}

          <div className="mt-4">

            <label className="mb-1.5 block text-sm font-bold text-[#1d2327]">
              Catatan{' '}

              <span className="font-normal text-[#646970]">
                (opsional)
              </span>
            </label>

            <textarea
              value={
                note
              }
              onChange={(
                event
              ) =>
                setNote(
                  event.target
                    .value
                )
              }
              rows={2}
              maxLength={1000}
              placeholder={
                status === 'LULUS'
                  ? 'Contoh: Dinyatakan lulus dari SDIT Khoiro Ummah.'
                  : status === 'TINGGAL'
                    ? 'Contoh: Memerlukan penguatan dan pendampingan pada beberapa kompetensi.'
                    : 'Contoh: Dinyatakan naik ke tingkat berikutnya.'
              }
              className="w-full min-h-[100px] resize-y rounded-sm border border-[#c3c4c7] p-3 text-base outline-none transition focus:border-[#2271b1] focus:ring-2 focus:ring-[#2271b1]/20"
            />

          </div>

        </section>

        {/* ====================================================
            STUDENTS
        ===================================================== */}

        <section className="overflow-hidden rounded-sm border border-[#c3c4c7] bg-white">

          <div className="flex flex-col justify-between gap-3 border-b border-[#c3c4c7] p-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="font-bold text-[#1d2327]">
                Daftar Siswa
              </h2>

              <p className="mt-0.5 text-sm text-[#646970]">
                {fromClass
                  ? `Siswa kelas ${fromClass} • Tingkat ${sourceGrade}`
                  : 'Pilih kelas asal terlebih dahulu'}
              </p>

            </div>

            <div className="flex items-center gap-2">

              {selectedIds.length >
                0 && (
                <span className="rounded-sm bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                  {
                    selectedIds.length
                  }{' '}
                  siswa dipilih
                </span>
              )}

              {selectedIds.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    resetSelection
                  }
                  className="rounded-sm border border-[#c3c4c7] px-3 py-2 text-sm font-semibold text-[#646970] hover:bg-[#f6f7f7]"
                >
                  Batal Pilih
                </button>
              )}

            </div>

          </div>

          {!fromClass ? (
            <div className="p-14 text-center">

              <School
                size={34}
                className="mx-auto text-[#646970]"
              />

              <p className="mt-3 font-semibold text-[#646970]">
                Pilih kelas asal
              </p>

              <p className="mt-1 text-sm text-[#646970]">
                Daftar siswa akan muncul setelah kelas dipilih.
              </p>

            </div>
          ) : loadingStudents ? (
            <div className="flex flex-col items-center justify-center p-14 text-sm text-[#646970]">

              <Loader2
                size={22}
                className="animate-spin text-[#2271b1]"
              />

              <span className="mt-3">
                Memuat data siswa...
              </span>

            </div>
          ) : students.length ===
            0 ? (
            <div className="p-14 text-center">

              <Users
                size={34}
                className="mx-auto text-[#646970]"
              />

              <p className="mt-3 font-semibold text-[#646970]">
                Belum ada siswa
              </p>

              <p className="mt-1 text-sm text-[#646970]">
                Tidak ditemukan siswa pada kelas ini.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[720px] text-base">

                <thead>

                  <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7] text-sm text-[#646970]">

                    <th className="w-12 p-3 text-center">

                      <input
                        type="checkbox"
                        checked={
                          allSelected
                        }
                        onChange={(
                          event
                        ) =>
                          handleSelectAll(
                            event
                              .target
                              .checked
                          )
                        }
                        className="h-4 w-4 rounded-sm accent-[#2271b1] text-[#2271b1]"
                      />

                    </th>

                    <th className="p-3 text-left">
                      No.
                    </th>

                    <th className="p-3 text-left">
                      NISN
                    </th>

                    <th className="p-3 text-left">
                      Nama Lengkap
                    </th>

                    <th className="p-3 text-left">
                      L/P
                    </th>

                    <th className="p-3 text-left">
                      Kelas
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-[#dcdcde]">

                  {students.map(
                    (
                      student,
                      index
                    ) => {
                      const checked =
                        selectedIds.includes(
                          student.id
                        );

                      return (
                        <tr
                          key={
                            student.id
                          }
                          className={`transition ${
                            checked
                              ? 'bg-[#f0f6fc]'
                              : 'hover:bg-[#f6f7f7]'
                          }`}
                        >

                          <td className="p-3 text-center">

                            <input
                              type="checkbox"
                              checked={
                                checked
                              }
                              onChange={() =>
                                handleSelectStudent(
                                  student.id
                                )
                              }
                              className="h-4 w-4 rounded-sm accent-[#2271b1] text-[#2271b1]"
                            />

                          </td>

                          <td className="p-3 text-[#646970]">
                            {
                              index +
                              1
                            }
                          </td>

                          <td className="p-3 font-mono text-sm text-[#646970]">
                            {student.nisn ||
                              '-'}
                          </td>

                          <td className="p-3">

                            <div className="font-semibold text-[#1d2327]">
                              {
                                student.fullname
                              }
                            </div>

                          </td>

                          <td className="p-3">
                            {
                              student.gender
                            }
                          </td>

                          <td className="p-3">

                            <span className="inline-flex rounded-sm bg-[#f6f7f7] px-2.5 py-1 text-sm font-semibold text-[#646970]">
                              {
                                student.class_name
                              }
                            </span>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

        </section>

        {/* ====================================================
            ACTION BAR
        ===================================================== */}

        {students.length >
          0 && (
          <section className="sticky bottom-4 z-20">

            <div className="rounded-sm border border-[#c3c4c7] bg-white p-4">

              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

                <div>

                  <div className="text-sm text-[#646970]">
                    Siswa yang akan diproses
                  </div>

                  <div className="text-lg font-bold text-[#1d2327]">
                    {
                      selectedIds.length
                    }{' '}

                    <span className="text-sm font-normal text-[#646970]">
                      siswa
                    </span>
                  </div>

                  {selectedSourceClass && (
                    <div className="mt-1 text-sm text-[#646970]">

                      {status ===
                      'NAIK'
                        ? `Kelas ${fromClass} → ${toClass || `tingkat ${sourceGrade + 1}`}`
                        : status ===
                            'TINGGAL'
                          ? `Tetap di kelas ${fromClass}`
                          : 'Lulus dari jenjang Sekolah Dasar'}

                    </div>
                  )}

                </div>

                <button
                  type="button"
                  onClick={
                    handlePromotion
                  }
                  disabled={
                    processing ||
                    selectedIds.length ===
                      0
                  }
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border border-[#2271b1] bg-[#2271b1] px-6 py-2 text-base font-semibold text-white transition hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {processing ? (
                    <>
                      <Loader2
                        size={16}
                        className="animate-spin"
                      />

                      Memproses...
                    </>
                  ) : (
                    <>
                      <UserCheck
                        size={16}
                      />

                      {
                        actionLabel
                      }
                    </>
                  )}

                </button>

              </div>

            </div>

          </section>
        )}

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#c3c4c7] pt-4 text-sm text-[#646970] sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_NAME}
          </span>

          <span>
            Kenaikan Kelas &amp; Kelulusan • Jenjang SD
          </span>

        </footer>

      </div>

    </main>
  );
}