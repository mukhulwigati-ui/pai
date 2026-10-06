'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  RefreshCw,
  School,
  Users,
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

const MIN_GRADE = 1;
const MAX_GRADE = 6;

/* ============================================================
   TYPES
============================================================ */

type AssessmentStudent = {
  id: number;
  fullname: string;
  class_name?: string | null;
};

type AssessmentSubject = {
  id?: number;
  name?: string | null;
  level?: string | null;
};

type AssessmentCP = {
  id?: number;
  code?: string | null;
  grade?: number | null;
  semester?: number | null;
  subjectId?: number | null;
  subject?: AssessmentSubject | null;
};

type AssessmentTP = {
  id: number;
  code?: string | null;
  description?: string | null;
  cpId?: number | null;
  cp?: AssessmentCP | null;
};

type AssessmentItem = {
  id: number;
  studentId: number;
  tpId: number;
  score: number;
  type: string;

  student?: AssessmentStudent | null;

  tp?: AssessmentTP | null;
};

type ClassRoom = {
  id: number;
  name: string;
  level?: string | null;
  grade?: number | null;
  status?: string | null;
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

function normalizeText(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase();
}

function getPredicate(
  score: number
) {
  if (
    score >= 90
  ) {
    return {
      label:
        'Sangat Baik',
      arabic:
        'Mumtaz',
      style:
        'bg-emerald-50 text-emerald-700 border-emerald-100',
    };
  }

  if (
    score >= 80
  ) {
    return {
      label:
        'Baik',
      arabic:
        'Jeid Jiddan',
      style:
        'bg-teal-50 text-teal-700 border-teal-100',
    };
  }

  if (
    score >= 70
  ) {
    return {
      label:
        'Cukup Baik',
      arabic:
        'Jeid',
      style:
        'bg-sky-50 text-sky-700 border-sky-100',
    };
  }

  if (
    score >= 60
  ) {
    return {
      label:
        'Cukup',
      arabic:
        'Maqbul',
      style:
        'bg-amber-50 text-amber-700 border-amber-100',
    };
  }

  return {
    label:
      'Perlu Bimbingan',
    arabic:
      '',
    style:
      'bg-red-50 text-red-700 border-red-100',
  };
}

function getAssessmentTypeLabel(
  type: string
) {
  const normalized =
    String(
      type || ''
    ).toUpperCase();

  if (
    normalized ===
    'FORMATIVE'
  ) {
    return 'Formatif';
  }

  if (
    normalized ===
    'SUMMATIVE'
  ) {
    return 'Sumatif';
  }

  if (
    normalized ===
    'SUMATIVE'
  ) {
    return 'Sumatif';
  }

  return (
    type ||
    '-'
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function NilaiPage() {
  /* ==========================================================
     DATA
  ========================================================== */

  const [
    assessments,
    setAssessments,
  ] =
    useState<
      AssessmentItem[]
    >([]);

  const [
    classes,
    setClasses,
  ] =
    useState<
      ClassRoom[]
    >([]);

  const [
    subjects,
    setSubjects,
  ] =
    useState<
      Subject[]
    >([]);

  /* ==========================================================
     FILTER
  ========================================================== */

  const [
    selectedClass,
    setSelectedClass,
  ] =
    useState('');

  const [
    selectedSubject,
    setSelectedSubject,
  ] =
    useState('');

  const [
    selectedType,
    setSelectedType,
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
     FETCH DATA
  ========================================================== */

  const fetchData =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setMessage('');
          setMessageType('');

          const [
            classRes,
            subjectRes,
            assessmentRes,
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
                `/api/subjects?level=${encodeURIComponent(
                  SCHOOL_LEVEL
                )}`,
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                '/api/assessment',
                {
                  cache:
                    'no-store',
                }
              ),
            ]);

          /* ================================================
             CLASSES
          ================================================ */

          if (
            !classRes.ok
          ) {
            throw new Error(
              await getApiError(
                classRes,
                'Gagal memuat daftar kelas.'
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
                  )
                    .trim()
                    .toUpperCase() ===
                    SCHOOL_LEVEL
              )
              .filter(
                (
                  item
                ) => {
                  if (
                    item.grade ===
                      null ||
                    item.grade ===
                      undefined
                  ) {
                    return true;
                  }

                  const grade =
                    Number(
                      item.grade
                    );

                  return (
                    Number.isInteger(
                      grade
                    ) &&
                    grade >=
                      MIN_GRADE &&
                    grade <=
                      MAX_GRADE
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
                  )
                    .trim()
                    .toLowerCase() !==
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

          /* ================================================
             SUBJECTS
          ================================================ */

          if (
            !subjectRes.ok
          ) {
            throw new Error(
              await getApiError(
                subjectRes,
                'Gagal memuat mata pelajaran.'
              )
            );
          }

          const subjectData =
            await subjectRes.json();

          const subjectList =
            normalizeArray<Subject>(
              subjectData,
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
             ASSESSMENTS
          ================================================ */

          if (
            !assessmentRes.ok
          ) {
            throw new Error(
              await getApiError(
                assessmentRes,
                'Gagal memuat rekapitulasi nilai asesmen.'
              )
            );
          }

          const assessmentData =
            await assessmentRes.json();

          const assessmentList =
            normalizeArray<AssessmentItem>(
              assessmentData,
              [
                'assessments',
                'assessment',
              ]
            );

          const cleanAssessmentList =
            assessmentList.filter(
              (
                item
              ) =>
                Number.isFinite(
                  Number(
                    item.score
                  )
                )
            );

          setAssessments(
            cleanAssessmentList
          );
        } catch (
          error
        ) {
          console.error(
            'Gagal memuat rekap nilai:',
            error
          );

          setClasses(
            []
          );

          setSubjects(
            []
          );

          setAssessments(
            []
          );

          setMessageType(
            'error'
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal memuat rekapitulasi nilai asesmen.'
          );
        } finally {
          setLoading(
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
     FILTER ASSESSMENT
  ========================================================== */

  const filteredAssessments =
    useMemo(() => {
      return assessments.filter(
        (
          item
        ) => {
          /* ----------------------------------------------
             CLASS
          ---------------------------------------------- */

          const className =
            item.student
              ?.class_name ||
            '';

          const matchClass =
            !selectedClass ||
            className ===
              selectedClass;

          /* ----------------------------------------------
             SUBJECT
          ---------------------------------------------- */

          const subjectName =
            item.tp?.cp
              ?.subject?.name ||
            '';

          const matchSubject =
            !selectedSubject ||
            normalizeText(
              subjectName
            ) ===
              normalizeText(
                selectedSubject
              );

          /* ----------------------------------------------
             TYPE
          ---------------------------------------------- */

          const normalizedType =
            String(
              item.type ||
                ''
            ).toUpperCase();

          const selectedTypeNormalized =
            selectedType.toUpperCase();

          const matchType =
            !selectedType ||
            normalizedType ===
              selectedTypeNormalized ||
            (
              selectedTypeNormalized ===
                'SUMMATIVE' &&
              normalizedType ===
                'SUMATIVE'
            );

          return (
            matchClass &&
            matchSubject &&
            matchType
          );
        }
      );
    }, [
      assessments,
      selectedClass,
      selectedSubject,
      selectedType,
    ]);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const statistics =
    useMemo(() => {
      const total =
        filteredAssessments.length;

      if (
        total === 0
      ) {
        return {
          total:
            0,
          average:
            0,
          highest:
            0,
          lowest:
            0,
        };
      }

      const scores =
        filteredAssessments.map(
          (
            item
          ) =>
            Number(
              item.score
            )
        );

      const sum =
        scores.reduce(
          (
            accumulator,
            value
          ) =>
            accumulator +
            value,
          0
        );

      return {
        total,

        average:
          Math.round(
            (
              sum /
              total
            ) *
              100
          ) /
          100,

        highest:
          Math.max(
            ...scores
          ),

        lowest:
          Math.min(
            ...scores
          ),
      };
    }, [
      filteredAssessments,
    ]);

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f0f0f1]">

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-normal text-[#1d2327]">Rekapitulasi Nilai Asesmen</h1>
            <p className="mt-2 text-base leading-6 text-[#646970]">Lihat nilai siswa berdasarkan kelas, mata pelajaran, dan jenis asesmen.</p>
          </div>
          <button type="button" onClick={fetchData} disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-sm border border-[#2271b1] bg-[#f6f7f7] px-4 py-2 text-base text-[#2271b1] hover:bg-[#f0f6fc] disabled:cursor-not-allowed disabled:opacity-50">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Perbarui Data
          </button>
        </header>

        {/* ====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`flex items-start gap-3 rounded-sm border p-4 text-sm ${
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

            <span>
              {message}
            </span>

          </div>
        )}

        {/* ====================================================
            STATISTICS
        ===================================================== */}

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">

          <StatCard
            label="Total Nilai"
            value={
              statistics.total
            }
            icon={
              Users
            }
          />

          <StatCard
            label="Rata-rata"
            value={
              statistics.average
            }
            icon={
              BookOpen
            }
          />

          <StatCard
            label="Nilai Tertinggi"
            value={
              statistics.highest
            }
            icon={
              Award
            }
          />

          <StatCard
            label="Nilai Terendah"
            value={
              statistics.lowest
            }
            icon={
              FileText
            }
          />

        </section>

        {/* ====================================================
            FILTER
        ===================================================== */}

        <section className="rounded-sm border border-[#c3c4c7] bg-white p-5  sm:p-6">

          <div className="mb-4 flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

              <GraduationCap
                size={18}
              />

            </div>

            <div>

              <h2 className="text-sm font-bold text-[#1d2327]">
                Filter Rekapitulasi
              </h2>

              <p className="mt-0.5 text-sm text-[#646970]">
                Tampilkan nilai berdasarkan kelas, mata pelajaran, dan jenis asesmen.
              </p>

            </div>

          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* CLASS */}

            <div>

              <label className="mb-1.5 block text-base font-semibold text-slate-700">
                Filter Kelas
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
                className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-white px-3 text-sm outline-none focus:border-[#2271b1] focus:ring-4 focus:ring-[#2271b1]/20"
              >

                <option value="">
                  -- Semua Kelas --
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
                        ? ` • Tingkat ${classRoom.grade}`
                        : ''}
                    </option>
                  )
                )}

              </select>

            </div>

            {/* SUBJECT */}

            <div>

              <label className="mb-1.5 block text-base font-semibold text-slate-700">
                Filter Mata Pelajaran
              </label>

              <select
                value={
                  selectedSubject
                }
                onChange={(
                  event
                ) =>
                  setSelectedSubject(
                    event.target
                      .value
                  )
                }
                className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-white px-3 text-sm outline-none focus:border-[#2271b1] focus:ring-4 focus:ring-[#2271b1]/20"
              >

                <option value="">
                  -- Semua Mata Pelajaran --
                </option>

                {subjects.map(
                  (
                    subject
                  ) => (
                    <option
                      key={
                        subject.id
                      }
                      value={
                        subject.name
                      }
                    >
                      {
                        subject.name
                      }
                    </option>
                  )
                )}

              </select>

            </div>

            {/* TYPE */}

            <div>

              <label className="mb-1.5 block text-base font-semibold text-slate-700">
                Jenis Asesmen
              </label>

              <select
                value={
                  selectedType
                }
                onChange={(
                  event
                ) =>
                  setSelectedType(
                    event.target
                      .value
                  )
                }
                className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-white px-3 text-sm outline-none focus:border-[#2271b1] focus:ring-4 focus:ring-[#2271b1]/20"
              >

                <option value="">
                  -- Semua Jenis --
                </option>

                <option value="FORMATIVE">
                  Formatif
                </option>

                <option value="SUMMATIVE">
                  Sumatif
                </option>

              </select>

            </div>

          </div>

        </section>

        {/* ====================================================
            TABLE
        ===================================================== */}

        <section className="overflow-hidden rounded-sm border border-[#c3c4c7] bg-white ">

          <div className="flex flex-col gap-2 border-b border-[#c3c4c7] bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-sm font-bold text-[#1d2327]">
                Daftar Nilai Berdasarkan Asesmen
              </h2>

              <p className="mt-0.5 text-sm text-[#646970]">
                Jenjang SD • Kelas 1–6
              </p>

            </div>

            <span className="text-base font-normal text-[#646970]">
              Total Rekap:{' '}
              {
                filteredAssessments.length
              }{' '}
              catatan
            </span>

          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center p-14 text-sm text-[#646970]">

              <RefreshCw
                size={22}
                className="animate-spin text-emerald-600"
              />

              <p className="mt-3">
                Memuat rekapitulasi nilai...
              </p>

            </div>
          ) : filteredAssessments.length ===
            0 ? (
            <div className="p-12 text-center">

              <BookOpen
                size={28}
                className="mx-auto text-[#646970]"
              />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Belum ada data asesmen
              </p>

              <p className="mx-auto mt-1 max-w-lg text-base leading-6 text-[#646970]">
                Belum ada data asesmen untuk filter yang dipilih. Silakan input nilai melalui menu <strong>Input Asesmen</strong>.
              </p>

            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] border-collapse text-left text-base">

                <thead>

                  <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7] text-base font-semibold text-[#646970]">

                    <th className="p-4">
                      No
                    </th>

                    <th className="p-4">
                      Nama Siswa
                    </th>

                    <th className="p-4">
                      Kelas
                    </th>

                    <th className="p-4">
                      Mata Pelajaran
                    </th>

                    <th className="p-4">
                      TP
                    </th>

                    <th className="p-4">
                      Jenis Asesmen
                    </th>

                    <th className="p-4 text-center">
                      Nilai
                    </th>

                    <th className="p-4">
                      Predikat
                    </th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-100">

                  {filteredAssessments.map(
                    (
                      item,
                      index
                    ) => {
                      const score =
                        Number(
                          item.score
                        );

                      const predicate =
                        getPredicate(
                          score
                        );

                      const subjectName =
                        item.tp?.cp
                          ?.subject
                          ?.name ||
                        '-';

                      const tpLabel =
                        item.tp?.code ||
                        `TP #${item.tpId}`;

                      const typeLabel =
                        getAssessmentTypeLabel(
                          item.type
                        );

                      const isFormative =
                        String(
                          item.type
                        ).toUpperCase() ===
                        'FORMATIVE';

                      return (
                        <tr
                          key={
                            item.id
                          }
                          className="transition hover:bg-slate-50"
                        >

                          <td className="p-4 font-medium text-[#646970]">
                            {
                              index +
                              1
                            }
                          </td>

                          <td className="p-4">

                            <div className="font-bold text-[#1d2327]">
                              {item.student
                                ?.fullname ||
                                `Siswa ID: ${item.studentId}`}
                            </div>

                          </td>

                          <td className="p-4">

                            <span className="rounded-sm bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
                              {item.student
                                ?.class_name ||
                                '-'}
                            </span>

                          </td>

                          <td className="p-4 font-semibold text-slate-700">
                            {
                              subjectName
                            }
                          </td>

                          <td className="p-4">

                            <div className="font-semibold text-slate-600">
                              {
                                tpLabel
                              }
                            </div>

                            {item.tp
                              ?.description && (
                              <div className="mt-1 max-w-[260px] whitespace-normal break-words text-sm text-[#646970]">
                                {
                                  item.tp
                                    .description
                                }
                              </div>
                            )}

                          </td>

                          <td className="p-4">

                            <span
                              className={`rounded-sm px-2 py-0.5 text-sm font-bold ${
                                isFormative
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {
                                typeLabel
                              }
                            </span>

                          </td>

                          <td className="p-4 text-center">

                            <span className="text-sm font-bold text-slate-900">
                              {
                                score
                              }
                            </span>

                          </td>

                          <td className="p-4">

                            <span
                              className={`inline-flex rounded-sm border px-2.5 py-1 text-sm font-semibold ${predicate.style}`}
                            >
                              {
                                predicate.label
                              }

                              {predicate.arabic
                                ? ` (${predicate.arabic})`
                                : ''}
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
            FOOTER
        ===================================================== */}

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#c3c4c7] pt-4 text-sm text-[#646970] sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_NAME}
          </span>

          <span>
            Rekap Nilai Asesmen • Jenjang SD
          </span>

        </footer>

      </div>

    </main>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-sm border border-[#c3c4c7] bg-white p-4 ">

      <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

        <Icon
          size={17}
        />

      </div>

      <div className="mt-3 text-xl font-bold text-[#1d2327]">
        {value}
      </div>

      <div className="mt-0.5 text-sm font-medium text-[#646970]">
        {label}
      </div>

    </div>
  );
}