'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
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

const JILIDS = [1, 2, 3, 4, 5, 6, 7];

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
  jilid?: number | null;
  grouping?: 'JILID' | 'KELAS';

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

function isTartili(value: unknown) {
  return normalizeText(value) === 'tartili';
}

function formatGrade(grade: number, tartili: boolean) {
  return tartili
    ? (grade === 7 ? 'Jilid 7 — Ghorib' : `Jilid ${grade}`)
    : `Kelas ${grade}`;
}

async function readApi(response: Response, fallback: string) {
  let data;
  try { data = await response.json(); }
  catch { throw new Error(`${fallback} Respons server tidak valid (HTTP ${response.status}).`); }
  if (!response.ok || data?.success === false) {
    throw new Error(typeof data?.message === 'string' ? data.message : fallback);
  }
  return data;
}

/* ============================================================
   PAGE
============================================================ */

export default function CurriculumPage() {
  const fetchVersion = useRef(0);
  const mutationBusy = useRef(false);
  const referenceController = useRef<AbortController | null>(null);
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

  const tartili = isTartili(selectedSubject?.name);
  const gradeOptions = tartili ? JILIDS : GRADES;
  const gradeLabel = tartili ? 'Jilid' : 'Kelas';
  const selectedGradeLabel = formatGrade(selectedGrade, tartili);

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
        referenceController.current?.abort();
        const controller = new AbortController();
        referenceController.current = controller;
        const version = ++fetchVersion.current;
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
                  signal: controller.signal,
                }
              ),

              fetch(
                `/api/subjects?level=${encodeURIComponent(
                  SCHOOL_LEVEL
                )}`,
                {
                  cache:
                    'no-store',
                  signal: controller.signal,
                }
              ),
            ]);

          const [subjectsData, curriculumData] = await Promise.all([
            readApi(subjectsRes, 'Gagal memuat mata pelajaran.'),
            readApi(curriculumRes, 'Gagal memuat data kurikulum.'),
          ]);
          if (version !== fetchVersion.current || controller.signal.aborted) return;

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

          const curriculumList =
            normalizeArray<CP>(
              curriculumData,
              [
                'cps',
                'curriculum',
                'curriculums',
              ]
            );

          const sdCurriculum = curriculumList.filter(cp => {
            const subject = sdSubjects.find(item => item.id === Number(cp.subjectId ?? cp.subject?.id));
            if (!subject || !SEMESTERS.includes(Number(cp.semester))) return false;
            const grade = Number(cp.grade);
            return Number.isSafeInteger(grade) &&
              (isTartili(subject.name) ? JILIDS : GRADES).includes(grade);
          });

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
          if (version !== fetchVersion.current || controller.signal.aborted) return;
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
          if (version === fetchVersion.current) setLoadingData(
            false
          );
        }
      },
      []
    );

  useEffect(() => {
    void fetchData();
    return () => {
      fetchVersion.current++;
      referenceController.current?.abort();
    };
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

            const matchByName =
              normalizeText(
                cp.subject?.name
              ) ===
              normalizeText(
                selectedSubject.name
              );

            const matchSubject = cp.subjectId != null || cp.subject?.id != null
              ? Number(cp.subjectId ?? cp.subject?.id) === selectedSubject.id
              : matchByName;

            /* ----------------------------------------------
               GRADE
            ---------------------------------------------- */

            const matchGrade = Number(cp.grade) === selectedGrade;

            /* ----------------------------------------------
               SEMESTER
            ---------------------------------------------- */

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
      if (mutationBusy.current) return;
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
      if (mutationBusy.current) return;
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
      if (mutationBusy.current) return;
      if (
        !gradeOptions.includes(
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
      if (mutationBusy.current) return;
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
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();
      if (mutationBusy.current || loadingData) return;

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
        !gradeOptions.includes(
          selectedGrade
        )
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          `${gradeLabel} tidak valid.`
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

      mutationBusy.current = true;
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

                    grade: selectedGrade,
                    ...(tartili ? { jilid: selectedGrade } : {}),

                    semester:
                      selectedSemester,

                    description:
                      cpDesc.trim(),
                  }
                ),
            }
          );

        await readApi(response, 'Gagal menyimpan Capaian Pembelajaran.');

        setMessageType(
          'success'
        );

        setMessage(
          `Capaian Pembelajaran ${selectedSubject.name} ${selectedGradeLabel} Semester ${selectedSemester} berhasil ditambahkan.`
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
        mutationBusy.current = false;
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
      if (mutationBusy.current || loadingData) return;
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

      mutationBusy.current = true;
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

        await readApi(response, 'Gagal menyimpan Tujuan Pembelajaran.');

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
        mutationBusy.current = false;
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
      if (mutationBusy.current || loadingData) return;
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

      mutationBusy.current = true;
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

        await readApi(response, `Gagal menghapus ${type}.`);

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
        mutationBusy.current = false;
        setLoading(
          false
        );
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f0f0f1]">

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <section>
          <h1 className="text-2xl font-normal text-[#1d2327]">Kurikulum CP &amp; TP</h1>
          <p className="mt-2 text-base leading-6 text-[#646970]">Kelola CP dan TP per kelas atau jilid Tartili dan semester.</p>
        </section>

        {/* ====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`flex items-start gap-3 rounded-sm border px-4 py-3 ${
              messageType ===
              'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >

            <div
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm ${
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

              <div className="text-base font-bold">
                {messageType ===
                'success'
                  ? 'Berhasil'
                  : 'Terjadi Kesalahan'}
              </div>

              <div className="mt-0.5 text-base opacity-80">
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

            <section className="flex flex-col gap-4 rounded-sm border border-emerald-100 bg-white p-5  sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700">

                  <GraduationCap
                    size={20}
                  />

                </div>

                <div>

                  <div className="text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">
                    Jenjang Aktif
                  </div>

                  <div className="mt-0.5 text-sm font-semibold text-[#1d2327]">
                    Sekolah Dasar
                  </div>

                  <div className="mt-0.5 text-sm text-[#646970]">
                    Kelas 1–6 • Tartili Jilid 1–6 dan Jilid 7 — Ghorib
                  </div>

                </div>

              </div>

              <span className="inline-flex w-fit rounded-sm bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                LEVEL: SD
              </span>

            </section>

            {/* SUBJECT LIST */}

            <section className="rounded-sm border border-[#c3c4c7] bg-white p-5  sm:p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>

                  <h2 className="flex items-center gap-2 text-sm font-bold text-[#1d2327]">

                    <BookOpen
                      size={16}
                      className="text-emerald-700"
                    />

                    Pilih Mata Pelajaran

                  </h2>

                  <p className="mt-1 text-sm text-[#646970]">
                    Mata pelajaran jenjang SD yang tersedia pada Manajemen Mata Pelajaran.
                  </p>

                </div>

                {!loadingData && (
                  <span className="rounded-sm bg-slate-50 px-2.5 py-1 text-sm font-semibold text-[#646970]">
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

                  <p className="mt-3 text-base text-[#646970]">
                    Memuat mata pelajaran...
                  </p>

                </div>
              ) : subjects.length ===
                0 ? (
                <div className="rounded-sm border border-dashed border-[#c3c4c7] bg-slate-50 py-12 text-center">

                  <BookOpen
                    size={28}
                    className="mx-auto text-[#646970]"
                  />

                  <p className="mt-3 text-base font-semibold text-slate-600">
                    Belum ada mata pelajaran SD
                  </p>

                  <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-[#646970]">
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
                        className="group flex min-h-[90px] items-center justify-between rounded-sm border border-[#c3c4c7] p-4 text-left  transition hover:border-emerald-400 hover:bg-emerald-50/50"
                      >

                        <div className="min-w-0">

                          <div className="truncate text-base font-bold text-[#1d2327] group-hover:text-emerald-900">
                            {
                              subject.name
                            }
                          </div>

                          <span className="mt-1 block text-sm text-[#646970]">
                            Kelola CP &amp; TP • SD
                          </span>

                        </div>

                        <span className="ml-3 shrink-0 rounded-sm bg-emerald-100 px-2.5 py-1 text-sm font-bold text-emerald-700">
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
              className="inline-flex items-center gap-2 rounded-sm bg-slate-100 px-4 py-2 text-base font-bold text-slate-700 transition hover:bg-slate-200"
            >

              <ArrowLeft
                size={14}
              />

              Kembali ke Daftar Mapel

            </button>

            {/* SUBJECT / GRADE / SEMESTER */}

            <section className="border border-[#c3c4c7] bg-white p-5 text-[#1d2327]">

              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-[#646970]">
                    Mata Pelajaran Aktif
                  </span>

                  <h2 className="mt-1 text-lg font-bold">
                    {
                      selectedSubject.name
                    }
                  </h2>

                  <div className="mt-1 text-sm text-[#646970]">
                    {selectedGradeLabel}{' '}
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

                    <span className="whitespace-nowrap text-base font-medium text-[#646970]">
                      {gradeLabel}:
                    </span>

                    <div className="relative">

                      <select
                        disabled={loading || loadingData}
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
                        className="appearance-none rounded-sm border border-[#8c8f94] bg-white py-2 pl-3 pr-8 text-base font-bold text-[#1d2327]  outline-none"
                      >

                        {gradeOptions.map(
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
                              {formatGrade(grade, tartili)}
                            </option>
                          )
                        )}

                      </select>

                      <ChevronDown
                        size={13}
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#646970]"
                      />

                    </div>

                  </div>

                  {/* SEMESTER */}

                  <div className="flex items-center gap-2">

                    <span className="whitespace-nowrap text-base font-medium text-[#646970]">
                      Semester:
                    </span>

                    <div className="relative">

                      <select
                        disabled={loading || loadingData}
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
                        className="appearance-none rounded-sm border border-[#8c8f94] bg-white py-2 pl-3 pr-8 text-base font-bold text-[#1d2327]  outline-none"
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
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#646970]"
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
              className="space-y-4 rounded-sm border border-[#c3c4c7] bg-white p-5  sm:p-6"
            >

              <div className="flex items-start gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700">

                  <Layers3
                    size={17}
                  />

                </div>

                <div>

                  <h3 className="text-base font-bold uppercase tracking-wider text-[#1d2327]">
                    Tambah Capaian Pembelajaran (CP)
                  </h3>

                  <p className="mt-1 text-sm text-[#646970]">
                    {
                      selectedSubject.name
                    }{' '}
                    • {selectedGradeLabel}{' '}
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
                placeholder={`Tuliskan Capaian Pembelajaran ${selectedSubject.name} untuk ${selectedGradeLabel} Semester ${selectedSemester}...`}
                maxLength={5000}
                disabled={loading || loadingData}
                rows={4}
                required
                className="w-full resize-y rounded-sm border border-[#c3c4c7] bg-slate-50/40 p-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-[#2271b1] focus:bg-white focus:ring-4 focus:ring-[#2271b1]/20"
              />

              <div className="flex justify-end">

                <button
                  type="submit"
                  disabled={
                    loading || loadingData ||
                    !cpDesc.trim()
                  }
                  className="inline-flex items-center gap-2 rounded-sm bg-[#2271b1] px-5 py-2.5 text-base font-bold text-white  transition hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-50"
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
                    : `Simpan CP ${selectedGradeLabel}`}

                </button>

              </div>

            </form>

            {/* =================================================
                CP LIST
            ================================================== */}

            <section className="space-y-5 rounded-sm border border-[#c3c4c7] bg-white p-5  sm:p-6">

              <div className="flex flex-col gap-3 border-b border-[#dcdcde] pb-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h3 className="text-sm font-bold text-[#1d2327]">
                    Daftar CP &amp; TP —{' '}
                    {
                      selectedSubject.name
                    }
                  </h3>

                  <p className="mt-1 text-sm text-[#646970]">
                    {selectedGradeLabel}{' '}
                    • Semester{' '}
                    {
                      selectedSemester
                    }
                  </p>

                </div>

                <span className="w-fit rounded-sm bg-slate-50 px-2.5 py-1 text-sm font-semibold text-[#646970]">
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

                  <p className="mt-3 text-base text-[#646970]">
                    Memuat kurikulum...
                  </p>

                </div>
              ) : currentSubjectCPs.length ===
                0 ? (
                <div className="rounded-sm border border-dashed border-[#c3c4c7] bg-slate-50 px-4 py-12 text-center">

                  <BookOpen
                    size={28}
                    className="mx-auto mb-3 text-[#646970]"
                  />

                  <div className="text-base font-semibold text-[#646970]">
                    Belum ada Capaian Pembelajaran
                  </div>

                  <div className="mt-1 text-sm text-[#646970]">
                    {
                      selectedSubject.name
                    }{' '}
                    • {selectedGradeLabel}{' '}
                    • Semester{' '}
                    {
                      selectedSemester
                    }
                  </div>

                  <div className="mt-2 text-sm text-[#646970]">
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
                          className="space-y-4 rounded-sm border border-[#c3c4c7] bg-slate-50/50 p-4"
                        >

                          {/* CP HEADER */}

                          <div className="flex items-start justify-between gap-3">

                            <div className="min-w-0">

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="rounded bg-emerald-100 px-2 py-0.5 text-sm font-bold text-emerald-800">
                                  CP:{' '}
                                  {
                                    cp.code
                                  }
                                </span>

                                <span className="rounded bg-slate-200 px-2 py-0.5 text-sm font-semibold text-slate-700">
                                  {formatGrade(Number(cp.grade ?? selectedGrade), tartili)}
                                </span>

                                <span className="rounded bg-blue-100 px-2 py-0.5 text-sm font-semibold text-blue-700">
                                  Semester{' '}
                                  {
                                    cpSemester
                                  }
                                </span>

                              </div>

                              <p className="mt-2 whitespace-pre-line text-base font-semibold leading-6 text-[#1d2327]">
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
                              className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-red-50 px-2.5 py-1.5 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >

                              <Trash2
                                size={11}
                              />

                              Hapus CP

                            </button>

                          </div>

                          {/* TP */}

                          <div className="space-y-2 border-l-2 border-[#dcdcde] pl-4">

                            <div className="flex items-center justify-between gap-3">

                              <span className="text-sm font-bold uppercase tracking-wider text-[#646970]">
                                Tujuan Pembelajaran (TP)
                              </span>

                              <button
                                type="button"
                                disabled={loading || loadingData}
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
                                className="flex shrink-0 items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
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
                              <div className="my-2 space-y-2 rounded-sm border border-amber-200 bg-white p-3 ">

                                <input
                                  type="text"
                                  maxLength={2000}
                                  disabled={loading || loadingData}
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
                                  className="h-10 w-full rounded-sm border border-[#c3c4c7] px-3 text-base outline-none transition focus:border-[#2271b1] focus:ring-4 focus:ring-[#2271b1]/20"
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
                                    className="h-8 rounded-sm bg-slate-100 px-3 text-base font-bold text-slate-600 hover:bg-slate-200"
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
                                      loading || loadingData ||
                                      !tpDesc.trim()
                                    }
                                    className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-[#2271b1] px-4 text-base font-bold text-white hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-50"
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
                              <div className="py-1 text-sm italic text-[#646970]">
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
                                      className="flex items-start justify-between gap-3 rounded-sm border border-[#c3c4c7] bg-white p-2.5"
                                    >

                                      <div className="min-w-0">

                                        <span className="mr-2 rounded bg-amber-100 px-1.5 py-0.5 text-sm font-bold text-amber-800">
                                          {
                                            tp.code
                                          }
                                        </span>

                                        <span className="text-sm leading-relaxed text-slate-700">
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
                                        className="inline-flex shrink-0 items-center gap-1 rounded-sm bg-red-50 px-2 py-1 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
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

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#c3c4c7] pt-4 text-sm text-[#646970] sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_SHORT_NAME}
          </span>

          <span>
            Kurikulum SD • Tartili Jilid 1–6 dan Ghorib
          </span>

        </footer>

      </div>

    </main>
  );
}