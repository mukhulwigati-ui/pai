'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  FileText,
  GraduationCap,
  Layers3,
  Loader2,
  Plus,
  Save,
  School,
  Sparkles,
  Trash2,
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

const GRADES = [
  1,
  2,
  3,
  4,
  5,
  6,
];

const SEMESTERS = [
  1,
  2,
];

/* ============================================================
   TYPES
============================================================ */

type TP = {
  id: number;
  code: string;
  description: string;
};

type CP = {
  id: number;
  code: string;
  description: string;

  subjectId?: number | null;

  grade?: number | null;

  semester?: number | null;

  subject?: {
    id?: number;
    name: string;
    level?: string | null;
  } | null;

  tps?: TP[];
};

type Subject = {
  id: number;
  name: string;
  level?: string | null;
};

type MessageType =
  | 'success'
  | 'error'
  | '';

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
) {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
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

export default function CurriculumPage() {
  /* ==========================================================
     PILIHAN UTAMA
  ========================================================== */

  const [
    selectedGrade,
    setSelectedGrade,
  ] =
    useState<number>(
      1
    );

  const [
    selectedSemester,
    setSelectedSemester,
  ] =
    useState<number>(
      1
    );

  const [
    subjects,
    setSubjects,
  ] =
    useState<Subject[]>(
      []
    );

  const [
    cps,
    setCps,
  ] =
    useState<CP[]>(
      []
    );

  const [
    selectedSubject,
    setSelectedSubject,
  ] =
    useState<Subject | null>(
      null
    );

  /* ==========================================================
     FORM CP
  ========================================================== */

  const [
    cpDesc,
    setCpDesc,
  ] =
    useState('');

  /* ==========================================================
     FORM TP
  ========================================================== */

  const [
    activeCpIdForTp,
    setActiveCpIdForTp,
  ] =
    useState<number | null>(
      null
    );

  const [
    tpDesc,
    setTpDesc,
  ] =
    useState('');

  /* ==========================================================
     UI
  ========================================================== */

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    loadingData,
    setLoadingData,
  ] =
    useState(true);

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
     CLEAR MESSAGE
  ========================================================== */

  const clearMessage =
    () => {
      setMessage('');
      setMessageType('');
    };

  /* ==========================================================
     FETCH DATA
  ========================================================== */

  const fetchData =
    useCallback(
      async () => {
        try {
          setLoadingData(
            true
          );

          const [
            curriculumRes,
            subjectsRes,
          ] =
            await Promise.all([
              fetch(
                '/api/curriculum',
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/subjects?level=${encodeURIComponent(
                  SCHOOL_LEVEL
                )}`,
                {
                  cache:
                    'no-store',
                }
              ),
            ]);

          /* ================================================
             SUBJECTS
          ================================================ */

          if (
            !subjectsRes.ok
          ) {
            throw new Error(
              await getApiError(
                subjectsRes,
                'Gagal memuat mata pelajaran.'
              )
            );
          }

          const subjectsData =
            await subjectsRes.json();

          const subjectList =
            normalizeArray<Subject>(
              subjectsData,
              [
                'subjects',
                'subject',
              ]
            );

          const sdSubjects =
            subjectList
              .filter(
                (
                  subject
                ) =>
                  !subject.level ||
                  String(
                    subject.level
                  )
                    .trim()
                    .toUpperCase() ===
                    SCHOOL_LEVEL
              )
              .sort(
                (
                  a,
                  b
                ) =>
                  a.name.localeCompare(
                    b.name,
                    'id'
                  )
              );

          setSubjects(
            sdSubjects
          );

          /* ================================================
             CURRICULUM
          ================================================ */

          if (
            !curriculumRes.ok
          ) {
            throw new Error(
              await getApiError(
                curriculumRes,
                'Gagal memuat data kurikulum.'
              )
            );
          }

          const curriculumData =
            await curriculumRes.json();

          const curriculumList =
            normalizeArray<CP>(
              curriculumData,
              [
                'cps',
                'curriculum',
                'curriculums',
              ]
            );

          /*
           * Karena sistem sekarang SD,
           * CP dengan grade di luar 1–6
           * tidak ditampilkan.
           *
           * Data lama tanpa grade masih dibiarkan
           * agar tidak hilang secara paksa.
           */
          const sdCurriculum =
            curriculumList.filter(
              (
                cp
              ) => {
                if (
                  cp.grade ===
                    undefined ||
                  cp.grade ===
                    null
                ) {
                  return true;
                }

                const grade =
                  Number(
                    cp.grade
                  );

                return (
                  Number.isInteger(
                    grade
                  ) &&
                  grade >= 1 &&
                  grade <= 6
                );
              }
            );

          setCps(
            sdCurriculum
          );

          /*
           * Jika mata pelajaran terpilih
           * sudah tidak tersedia,
           * keluarkan dari detail.
           */
          setSelectedSubject(
            (
              current
            ) => {
              if (
                !current
              ) {
                return null;
              }

              return (
                sdSubjects.find(
                  (
                    item
                  ) =>
                    item.id ===
                    current.id
                ) ||
                null
              );
            }
          );
        } catch (
          error
        ) {
          console.error(
            'FETCH CURRICULUM ERROR:',
            error
          );

          setSubjects(
            []
          );

          setCps(
            []
          );

          setMessageType(
            'error'
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal mengambil data kurikulum dari server.'
          );
        } finally {
          setLoadingData(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ==========================================================
     CP UNTUK MAPEL + KELAS + SEMESTER AKTIF
  ========================================================== */

  const currentSubjectCPs =
    useMemo(() => {
      if (
        !selectedSubject
      ) {
        return [];
      }

      return cps
        .filter(
          (
            cp
          ) => {
            /* ----------------------------------------------
               SUBJECT
            ---------------------------------------------- */

            const matchById =
              Number(
                cp.subjectId
              ) ===
              Number(
                selectedSubject.id
              );

            const matchByName =
              normalizeText(
                cp.subject?.name
              ) ===
              normalizeText(
                selectedSubject.name
              );

            const matchSubject =
              matchById ||
              matchByName;

            /* ----------------------------------------------
               GRADE
            ---------------------------------------------- */

            /*
             * Data lama tanpa grade dianggap
             * mengikuti tingkat yang dipilih.
             *
             * Bila nantinya database sudah bersih,
             * bagian null ini bisa diperketat.
             */
            const matchGrade =
              cp.grade ===
                undefined ||
              cp.grade ===
                null ||
              Number(
                cp.grade
              ) ===
                selectedGrade;

            /* ----------------------------------------------
               SEMESTER
            ---------------------------------------------- */

            /*
             * Data lama tanpa semester
             * dianggap Semester 1.
             */
            const cpSemester =
              cp.semester ===
                undefined ||
              cp.semester ===
                null
                ? 1
                : Number(
                    cp.semester
                  );

            const matchSemester =
              cpSemester ===
              selectedSemester;

            return (
              matchSubject &&
              matchGrade &&
              matchSemester
            );
          }
        )
        .sort(
          (
            a,
            b
          ) =>
            a.id -
            b.id
        );
    }, [
      cps,
      selectedSubject,
      selectedGrade,
      selectedSemester,
    ]);

  /* ==========================================================
     PILIH SUBJECT
  ========================================================== */

  const handleSelectSubject =
    (
      subject: Subject
    ) => {
      setSelectedSubject(
        subject
      );

      setSelectedGrade(
        1
      );

      setSelectedSemester(
        1
      );

      setCpDesc('');
      setTpDesc('');

      setActiveCpIdForTp(
        null
      );

      clearMessage();
    };

  /* ==========================================================
     KEMBALI KE DAFTAR SUBJECT
  ========================================================== */

  const handleBack =
    () => {
      setSelectedSubject(
        null
      );

      setSelectedGrade(
        1
      );

      setSelectedSemester(
        1
      );

      setCpDesc('');
      setTpDesc('');

      setActiveCpIdForTp(
        null
      );

      clearMessage();
    };

  /* ==========================================================
     CHANGE GRADE
  ========================================================== */

  const handleGradeChange =
    (
      value: number
    ) => {
      if (
        !GRADES.includes(
          value
        )
      ) {
        return;
      }

      setSelectedGrade(
        value
      );

      setCpDesc('');
      setTpDesc('');

      setActiveCpIdForTp(
        null
      );

      clearMessage();
    };

  /* ==========================================================
     CHANGE SEMESTER
  ========================================================== */

  const handleSemesterChange =
    (
      value: number
    ) => {
      if (
        !SEMESTERS.includes(
          value
        )
      ) {
        return;
      }

      setSelectedSemester(
        value
      );

      setCpDesc('');
      setTpDesc('');

      setActiveCpIdForTp(
        null
      );

      clearMessage();
    };

  /* ==========================================================
     SAVE CP
  ========================================================== */

  const handleSaveCP =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      clearMessage();

      if (
        !selectedSubject
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Silakan pilih mata pelajaran terlebih dahulu.'
        );

        return;
      }

      if (
        !GRADES.includes(
          selectedGrade
        )
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Tingkat kelas tidak valid.'
        );

        return;
      }

      if (
        !SEMESTERS.includes(
          selectedSemester
        )
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Semester tidak valid.'
        );

        return;
      }

      if (
        !cpDesc.trim()
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Deskripsi Capaian Pembelajaran belum diisi.'
        );

        return;
      }

      setLoading(
        true
      );

      try {
        const response =
          await fetch(
            '/api/curriculum',
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
                    action:
                      'CREATE_CP',

                    subjectId:
                      selectedSubject.id,

                    grade:
                      selectedGrade,

                    semester:
                      selectedSemester,

                    description:
                      cpDesc.trim(),
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
              'Gagal menyimpan Capaian Pembelajaran.'
            )
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          `Capaian Pembelajaran ${selectedSubject.name} Kelas ${selectedGrade} Semester ${selectedSemester} berhasil ditambahkan.`
        );

        setCpDesc('');

        await fetchData();
      } catch (
        error
      ) {
        console.error(
          'CREATE CP ERROR:',
          error
        );

        setMessageType(
          'error'
        );

        setMessage(
          error instanceof
            Error
            ? error.message
            : 'Terjadi kesalahan saat menyimpan CP.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* ==========================================================
     SAVE TP
  ========================================================== */

  const handleSaveTP =
    async (
      cpId: number
    ) => {
      clearMessage();

      if (
        !Number.isInteger(
          cpId
        ) ||
        cpId <= 0
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'ID Capaian Pembelajaran tidak valid.'
        );

        return;
      }

      if (
        !tpDesc.trim()
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Deskripsi Tujuan Pembelajaran belum diisi.'
        );

        return;
      }

      setLoading(
        true
      );

      try {
        const response =
          await fetch(
            '/api/curriculum',
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
                    action:
                      'CREATE_TP',

                    cpId,

                    description:
                      tpDesc.trim(),
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
              'Gagal menyimpan Tujuan Pembelajaran.'
            )
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          'Tujuan Pembelajaran (TP) berhasil ditambahkan.'
        );

        setTpDesc('');

        setActiveCpIdForTp(
          null
        );

        await fetchData();
      } catch (
        error
      ) {
        console.error(
          'CREATE TP ERROR:',
          error
        );

        setMessageType(
          'error'
        );

        setMessage(
          error instanceof
            Error
            ? error.message
            : 'Terjadi kesalahan saat menyimpan TP.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* ==========================================================
     DELETE CP / TP
  ========================================================== */

  const handleDelete =
    async (
      id: number,
      type:
        | 'CP'
        | 'TP'
    ) => {
      if (
        !Number.isInteger(
          id
        ) ||
        id <= 0
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          `ID ${type} tidak valid.`
        );

        return;
      }

      const confirmed =
        window.confirm(
          `Apakah Anda yakin ingin menghapus ${type} ini?`
        );

      if (
        !confirmed
      ) {
        return;
      }

      clearMessage();

      setLoading(
        true
      );

      try {
        const response =
          await fetch(
            '/api/curriculum',
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
                    action:
                      'DELETE',

                    type,

                    id,
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
              `Gagal menghapus ${type}.`
            )
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          `${type} berhasil dihapus.`
        );

        if (
          type ===
            'CP' &&
          activeCpIdForTp ===
            id
        ) {
          setActiveCpIdForTp(
            null
          );

          setTpDesc('');
        }

        await fetchData();
      } catch (
        error
      ) {
        console.error(
          `DELETE ${type} ERROR:`,
          error
        );

        setMessageType(
          'error'
        );

        setMessage(
          error instanceof
            Error
            ? error.message
            : `Terjadi kesalahan saat menghapus ${type}.`
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f5f8f6]">

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <section className="relative overflow-hidden rounded-2xl bg-[#063d31] px-5 py-6 text-white shadow-[0_12px_35px_rgba(6,61,49,0.12)] sm:px-7">

          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-300/[0.07] blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-amber-300/[0.04] blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">

                <BookOpenCheck
                  size={23}
                  strokeWidth={
                    1.6
                  }
                  className="text-emerald-200"
                />

              </div>

              <div>

                <div className="mb-1 flex items-center gap-2">

                  <Sparkles
                    size={11}
                    className="text-amber-200"
                  />

                  <span className="text-[9px] font-semibold uppercase tracking-[0.22em] text-emerald-200/60">
                    Akademik • Kurikulum SD
                  </span>

                </div>

                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  Kurikulum CP &amp; TP
                </h1>

                <p className="mt-1.5 max-w-2xl text-xs leading-5 text-emerald-50/55">
                  Kelola Capaian Pembelajaran dan Tujuan Pembelajaran berdasarkan mata pelajaran, tingkat kelas, dan semester.
                </p>

              </div>

            </div>

            <div className="hidden items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.035] px-4 py-3 lg:flex">

              <School
                size={18}
                strokeWidth={
                  1.5
                }
                className="text-emerald-200/70"
              />

              <div>

                <div className="text-[8px] font-semibold uppercase tracking-[0.16em] text-emerald-100/35">
                  Institusi
                </div>

                <div className="mt-0.5 text-[11px] font-medium text-white/75">
                  {SCHOOL_NAME}
                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
              messageType ===
              'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >

            <div
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                messageType ===
                'success'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-red-500 text-white'
              }`}
            >
              {messageType ===
              'success'
                ? '✓'
                : '!'}
            </div>

            <div>

              <div className="text-xs font-bold">
                {messageType ===
                'success'
                  ? 'Berhasil'
                  : 'Terjadi Kesalahan'}
              </div>

              <div className="mt-0.5 text-xs opacity-80">
                {message}
              </div>

            </div>

          </div>
        )}

        {/* ====================================================
            STEP 1 - SUBJECT LIST
        ===================================================== */}

        {!selectedSubject ? (
          <div className="space-y-5">

            {/* SD INFORMATION */}

            <section className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                  <GraduationCap
                    size={20}
                  />

                </div>

                <div>

                  <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-600">
                    Jenjang Aktif
                  </div>

                  <div className="mt-0.5 text-sm font-semibold text-slate-800">
                    Sekolah Dasar
                  </div>

                  <div className="mt-0.5 text-[10px] text-slate-400">
                    Tingkat 1 sampai 6
                  </div>

                </div>

              </div>

              <span className="inline-flex w-fit rounded-lg bg-emerald-50 px-3 py-1.5 text-[10px] font-bold text-emerald-700">
                LEVEL: SD
              </span>

            </section>

            {/* SUBJECT LIST */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">

                    <BookOpen
                      size={16}
                      className="text-emerald-700"
                    />

                    Pilih Mata Pelajaran

                  </h2>

                  <p className="mt-1 text-[10px] text-slate-400">
                    Mata pelajaran jenjang SD yang tersedia pada Manajemen Mata Pelajaran.
                  </p>

                </div>

                {!loadingData && (
                  <span className="rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                    {subjects.length}{' '}
                    mapel
                  </span>
                )}

              </div>

              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-14">

                  <Loader2
                    size={22}
                    className="animate-spin text-emerald-600"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Memuat mata pelajaran...
                  </p>

                </div>
              ) : subjects.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-12 text-center">

                  <BookOpen
                    size={28}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    Belum ada mata pelajaran SD
                  </p>

                  <p className="mx-auto mt-1 max-w-sm text-[10px] leading-5 text-slate-400">
                    Tambahkan mata pelajaran terlebih dahulu melalui menu Manajemen Mata Pelajaran.
                  </p>

                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">

                  {subjects.map(
                    (
                      subject
                    ) => (
                      <button
                        key={
                          subject.id
                        }
                        type="button"
                        onClick={() =>
                          handleSelectSubject(
                            subject
                          )
                        }
                        className="group flex min-h-[90px] items-center justify-between rounded-xl border border-slate-200 p-4 text-left shadow-sm transition hover:border-emerald-400 hover:bg-emerald-50/50"
                      >

                        <div className="min-w-0">

                          <div className="truncate text-xs font-bold text-slate-800 group-hover:text-emerald-900">
                            {
                              subject.name
                            }
                          </div>

                          <span className="mt-1 block text-[10px] text-slate-400">
                            Kelola CP &amp; TP • SD
                          </span>

                        </div>

                        <span className="ml-3 shrink-0 rounded-lg bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                          Pilih →
                        </span>

                      </button>
                    )
                  )}

                </div>
              )}

            </section>

          </div>
        ) : (
          /* ==================================================
             STEP 2 - MANAGE CP & TP
          ================================================== */

          <div className="space-y-6">

            {/* BACK */}

            <button
              type="button"
              onClick={
                handleBack
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
            >

              <ArrowLeft
                size={14}
              />

              Kembali ke Daftar Mapel

            </button>

            {/* SUBJECT / GRADE / SEMESTER */}

            <section className="rounded-2xl bg-[#064e3b] p-5 text-white shadow-sm">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
                    Mata Pelajaran Aktif
                  </span>

                  <h2 className="mt-1 text-lg font-bold">
                    {
                      selectedSubject.name
                    }
                  </h2>

                  <div className="mt-1 text-[11px] text-emerald-200">
                    Kelas{' '}
                    {
                      selectedGrade
                    }{' '}
                    • Semester{' '}
                    {
                      selectedSemester
                    }{' '}
                    • SD
                  </div>

                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                  {/* GRADE */}

                  <div className="flex items-center gap-2">

                    <span className="whitespace-nowrap text-xs font-medium text-emerald-100">
                      Tingkat:
                    </span>

                    <div className="relative">

                      <select
                        value={
                          selectedGrade
                        }
                        onChange={(
                          event
                        ) =>
                          handleGradeChange(
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                        className="appearance-none rounded-xl bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-sm outline-none"
                      >

                        {GRADES.map(
                          (
                            grade
                          ) => (
                            <option
                              key={
                                grade
                              }
                              value={
                                grade
                              }
                            >
                              Kelas{' '}
                              {
                                grade
                              }
                            </option>
                          )
                        )}

                      </select>

                      <ChevronDown
                        size={13}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                    </div>

                  </div>

                  {/* SEMESTER */}

                  <div className="flex items-center gap-2">

                    <span className="whitespace-nowrap text-xs font-medium text-emerald-100">
                      Semester:
                    </span>

                    <div className="relative">

                      <select
                        value={
                          selectedSemester
                        }
                        onChange={(
                          event
                        ) =>
                          handleSemesterChange(
                            Number(
                              event
                                .target
                                .value
                            )
                          )
                        }
                        className="appearance-none rounded-xl bg-white py-2 pl-3 pr-8 text-xs font-bold text-slate-800 shadow-sm outline-none"
                      >

                        <option value={1}>
                          Semester 1
                        </option>

                        <option value={2}>
                          Semester 2
                        </option>

                      </select>

                      <ChevronDown
                        size={13}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                      />

                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                CREATE CP
            ================================================== */}

            <form
              onSubmit={
                handleSaveCP
              }
              className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">

                  <Layers3
                    size={17}
                  />

                </div>

                <div>

                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Tambah Capaian Pembelajaran (CP)
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {
                      selectedSubject.name
                    }{' '}
                    • Kelas{' '}
                    {
                      selectedGrade
                    }{' '}
                    • Semester{' '}
                    {
                      selectedSemester
                    }
                  </p>

                </div>

              </div>

              <textarea
                value={
                  cpDesc
                }
                onChange={(
                  event
                ) =>
                  setCpDesc(
                    event.target
                      .value
                  )
                }
                placeholder={`Tuliskan Capaian Pembelajaran ${selectedSubject.name} untuk Kelas ${selectedGrade} Semester ${selectedSemester}...`}
                rows={4}
                required
                className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50/40 p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
              />

              <div className="flex justify-end">

                <button
                  type="submit"
                  disabled={
                    loading ||
                    !cpDesc.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-[#064e3b] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#053d2e] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {loading ? (
                    <Loader2
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
                    : `Simpan CP Kelas ${selectedGrade}`}

                </button>

              </div>

            </form>

            {/* =================================================
                CP LIST
            ================================================== */}

            <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h3 className="text-sm font-bold text-slate-800">
                    Daftar CP &amp; TP —{' '}
                    {
                      selectedSubject.name
                    }
                  </h3>

                  <p className="mt-1 text-[11px] text-slate-500">
                    Kelas{' '}
                    {
                      selectedGrade
                    }{' '}
                    • Semester{' '}
                    {
                      selectedSemester
                    }
                  </p>

                </div>

                <span className="w-fit rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                  {
                    currentSubjectCPs.length
                  }{' '}
                  CP ditemukan
                </span>

              </div>

              {loadingData ? (
                <div className="flex flex-col items-center justify-center py-14">

                  <Loader2
                    size={22}
                    className="animate-spin text-emerald-600"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Memuat kurikulum...
                  </p>

                </div>
              ) : currentSubjectCPs.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center">

                  <BookOpen
                    size={28}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <div className="text-xs font-semibold text-slate-500">
                    Belum ada Capaian Pembelajaran
                  </div>

                  <div className="mt-1 text-[11px] text-slate-400">
                    {
                      selectedSubject.name
                    }{' '}
                    • Kelas{' '}
                    {
                      selectedGrade
                    }{' '}
                    • Semester{' '}
                    {
                      selectedSemester
                    }
                  </div>

                  <div className="mt-2 text-[10px] text-slate-400">
                    Tambahkan CP melalui formulir di atas.
                  </div>

                </div>
              ) : (
                <div className="space-y-4">

                  {currentSubjectCPs.map(
                    (
                      cp
                    ) => {
                      const cpSemester =
                        cp.semester ===
                          undefined ||
                        cp.semester ===
                          null
                          ? 1
                          : Number(
                              cp.semester
                            );

                      const tpList =
                        Array.isArray(
                          cp.tps
                        )
                          ? cp.tps
                          : [];

                      return (
                        <article
                          key={
                            cp.id
                          }
                          className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                        >

                          {/* CP HEADER */}

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                                  CP:{' '}
                                  {
                                    cp.code
                                  }
                                </span>

                                <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                  Kelas{' '}
                                  {cp.grade ||
                                    selectedGrade}
                                </span>

                                <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                                  Semester{' '}
                                  {
                                    cpSemester
                                  }
                                </span>

                              </div>

                              <p className="mt-2 whitespace-pre-line text-xs font-semibold leading-6 text-slate-800">
                                {
                                  cp.description
                                }
                              </p>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  cp.id,
                                  'CP'
                                )
                              }
                              disabled={
                                loading
                              }
                              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-[10px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >

                              <Trash2
                                size={11}
                              />

                              Hapus CP

                            </button>

                          </div>

                          {/* TP */}

                          <div className="space-y-2 border-l-2 border-amber-400 pl-4">

                            <div className="flex items-center justify-between gap-3">

                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Tujuan Pembelajaran (TP)
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  setActiveCpIdForTp(
                                    (
                                      current
                                    ) =>
                                      current ===
                                      cp.id
                                        ? null
                                        : cp.id
                                  );

                                  setTpDesc('');
                                  clearMessage();
                                }}
                                className="flex shrink-0 items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 transition hover:bg-amber-100"
                              >

                                <Plus
                                  size={10}
                                />

                                Tambah TP

                              </button>

                            </div>

                            {/* ADD TP FORM */}

                            {activeCpIdForTp ===
                              cp.id && (
                              <div className="my-2 space-y-2 rounded-xl border border-amber-200 bg-white p-3 shadow-inner">

                                <input
                                  type="text"
                                  value={
                                    tpDesc
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    setTpDesc(
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  placeholder="Tuliskan deskripsi Tujuan Pembelajaran..."
                                  autoFocus
                                  onKeyDown={(
                                    event
                                  ) => {
                                    if (
                                      event.key ===
                                      'Enter'
                                    ) {
                                      event.preventDefault();

                                      if (
                                        tpDesc.trim() &&
                                        !loading
                                      ) {
                                        handleSaveTP(
                                          cp.id
                                        );
                                      }
                                    }
                                  }}
                                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
                                />

                                <div className="flex justify-end gap-2">

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCpIdForTp(
                                        null
                                      );

                                      setTpDesc('');
                                    }}
                                    className="h-8 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-600 hover:bg-slate-200"
                                  >
                                    Batal
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveTP(
                                        cp.id
                                      )
                                    }
                                    disabled={
                                      loading ||
                                      !tpDesc.trim()
                                    }
                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-600 px-4 text-xs font-bold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >

                                    {loading && (
                                      <Loader2
                                        size={11}
                                        className="animate-spin"
                                      />
                                    )}

                                    Simpan TP

                                  </button>

                                </div>

                              </div>
                            )}

                            {/* TP LIST */}

                            {tpList.length ===
                            0 ? (
                              <div className="py-1 text-[10px] italic text-slate-400">
                                Belum ada TP untuk CP ini.
                              </div>
                            ) : (
                              <div className="space-y-2">

                                {tpList.map(
                                  (
                                    tp
                                  ) => (
                                    <div
                                      key={
                                        tp.id
                                      }
                                      className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2.5"
                                    >

                                      <div className="min-w-0">

                                        <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                          {
                                            tp.code
                                          }
                                        </span>

                                        <span className="text-[11px] leading-relaxed text-slate-700">
                                          {
                                            tp.description
                                          }
                                        </span>

                                      </div>

                                      <button
                                        type="button"
                                        disabled={
                                          loading
                                        }
                                        onClick={() =>
                                          handleDelete(
                                            tp.id,
                                            'TP'
                                          )
                                        }
                                        className="inline-flex shrink-0 items-center gap-1 rounded-md bg-red-50 px-2 py-1 text-[9px] font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                      >

                                        <Trash2
                                          size={10}
                                        />

                                        Hapus

                                      </button>

                                    </div>
                                  )
                                )}

                              </div>
                            )}

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>
              )}

            </section>

          </div>
        )}

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 pt-4 text-[9px] text-slate-400 sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_SHORT_NAME}
          </span>

          <span>
            Kurikulum Jenjang SD • Kelas 1–6
          </span>

        </footer>

      </div>

    </main>
  );
}