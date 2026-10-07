'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Award,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Save,
  Sparkles,
  Users,
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
  nisn?: string | null;
  gender?: string | null;
  class_name: string;
};

type ClassRoom = {
  id: number;
  name: string;
  level?: string | null;
  grade?: number | null;
  status?: string | null;
};

type PersonalityValue = {
  suluk: string;
  muwadhotah: string;
  nadzofah: string;
  indhiplat: string;
};

type PersonalityRecord = {
  id?: number;
  studentId: number;
  suluk?: string | null;
  muwadhotah?: string | null;
  nadzofah?: string | null;
  indhiplat?: string | null;
};

/* ============================================================
   PREDIKAT
============================================================ */

// Nilai internal lama dipertahankan agar kompatibel dengan API dan data tersimpan.
// Label pilihan ditampilkan dengan ejaan Jayyid.
const PREDICATES = [
  '-',
  'Mumtaz (ممتاز)',
  'Jeid Jiddan (جيد جداً)',
  'Jeid (جيد)',
  'Maqbul (مقبول)',
] as const;

/* ============================================================
   PERSONALITY FIELDS
============================================================ */

const PERSONALITY_FIELDS = [
  {
    key: 'suluk',
    title: 'As-Suluk',
    arabic: 'السلوك',
    description:
      'Perilaku & akhlak',
  },
  {
    key: 'muwadhotah',
    title: 'Al-Muwadhotah',
    arabic: 'المواظبة',
    description:
      'Konsistensi & ketekunan',
  },
  {
    key: 'nadzofah',
    title: 'An-Nadzofah',
    arabic: 'النظافة',
    description:
      'Kebersihan & kerapian',
  },
  {
    key: 'indhiplat',
    title: 'Al-Indhiplat',
    arabic: 'الانضباط',
    description:
      'Disiplin & tanggung jawab',
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

function getInitial(
  name: string
) {
  return (
    name
      ?.charAt(0)
      ?.toUpperCase() ||
    'S'
  );
}

function getPredicateStyle(
  value: string
) {
  if (
    value.includes(
      'Mumtaz'
    )
  ) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  if (
    value.includes(
      'Jiddan'
    )
  ) {
    return 'border-teal-200 bg-teal-50 text-teal-700';
  }

  if (
    value.includes(
      'Jeid'
    )
  ) {
    return 'border-sky-200 bg-sky-50 text-sky-700';
  }

  if (
    value.includes(
      'Maqbul'
    )
  ) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  return 'border-slate-200 bg-slate-50 text-slate-500';
}

/* ============================================================
   PAGE
============================================================ */

export default function PersonalityPage() {
  /* ==========================================================
     DATA STATE
  ========================================================== */

  const [
    classes,
    setClasses,
  ] =
    useState<ClassRoom[]>(
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
    selectedClass,
    setSelectedClass,
  ] =
    useState('');

  const [
    personalityData,
    setPersonalityData,
  ] =
    useState<
      Record<
        number,
        PersonalityValue
      >
    >({});

  /* ==========================================================
     UI STATE
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
    useState<
      'success' | 'error' | ''
    >('');

  /* ==========================================================
     LOAD CLASSES
  ========================================================== */

  useEffect(() => {
    const loadClasses =
      async () => {
        try {
          const response =
            await fetch(
              '/api/classes',
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
                'Gagal mengambil data kelas.'
              )
            );
          }

          const data =
            await response.json();

          const classList =
            normalizeArray<ClassRoom>(
              data,
              [
                'classes',
                'classRooms',
                'classrooms',
              ]
            );

          /*
           * Hanya kelas SD tingkat 1–6.
           */
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

          /*
           * Jika kelas yang sedang dipilih sudah tidak tersedia,
           * kosongkan pilihan.
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

              return '';
            }
          );
        } catch (
          error
        ) {
          console.error(
            'Error loading classes:',
            error
          );

          setClasses([]);

          setMessageType(
            'error'
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal memuat daftar kelas.'
          );
        }
      };

    loadClasses();
  }, []);

  /* ==========================================================
     LOAD STUDENTS + PERSONALITY
  ========================================================== */

  useEffect(() => {
    if (
      !selectedClass
    ) {
      setStudents([]);
      setPersonalityData(
        {}
      );

      return;
    }

    const loadData =
      async () => {
        setLoadingData(
          true
        );

        setMessage('');
        setMessageType('');

        try {
          const [
            studentsRes,
            personalityRes,
          ] =
            await Promise.all([
              fetch(
                '/api/students',
                {
                  cache:
                    'no-store',
                }
              ),

              fetch(
                `/api/personality?className=${encodeURIComponent(
                  selectedClass
                )}`,
                {
                  cache:
                    'no-store',
                }
              ),
            ]);

          /* ================================================
             STUDENTS
          ================================================ */

          if (
            !studentsRes.ok
          ) {
            throw new Error(
              await getApiError(
                studentsRes,
                'Gagal memuat data siswa.'
              )
            );
          }

          const studentsData =
            await studentsRes.json();

          const allStudents =
            normalizeArray<Student>(
              studentsData,
              [
                'students',
                'student',
              ]
            );

          const filteredStudents =
            allStudents
              .filter(
                (
                  student
                ) =>
                  student.class_name ===
                  selectedClass
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
            filteredStudents
          );

          /* ================================================
             PERSONALITY
          ================================================ */

          if (
            !personalityRes.ok
          ) {
            throw new Error(
              await getApiError(
                personalityRes,
                'Gagal memuat data kepribadian.'
              )
            );
          }

          const personalityResponse =
            await personalityRes.json();

          const personalityList =
            normalizeArray<PersonalityRecord>(
              personalityResponse,
              [
                'personalities',
                'personality',
              ]
            );

          const map:
            Record<
              number,
              PersonalityValue
            > = {};

          for (
            const item of personalityList
          ) {
            map[
              item.studentId
            ] = {
              suluk:
                item.suluk ||
                '-',

              muwadhotah:
                item.muwadhotah ||
                '-',

              nadzofah:
                item.nadzofah ||
                '-',

              indhiplat:
                item.indhiplat ||
                '-',
            };
          }

          setPersonalityData(
            map
          );
        } catch (
          error
        ) {
          console.error(
            'Error loading personality data:',
            error
          );

          setStudents([]);

          setPersonalityData(
            {}
          );

          setMessageType(
            'error'
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal memuat data kepribadian.'
          );
        } finally {
          setLoadingData(
            false
          );
        }
      };

    loadData();
  }, [
    selectedClass,
  ]);

  /* ==========================================================
     CHANGE VALUE
  ========================================================== */

  const handleChange =
    (
      studentId: number,
      field:
        keyof PersonalityValue,
      value: string
    ) => {
      setPersonalityData(
        (
          previous
        ) => ({
          ...previous,

          [studentId]: {
            suluk:
              previous[
                studentId
              ]?.suluk ||
              '-',

            muwadhotah:
              previous[
                studentId
              ]
                ?.muwadhotah ||
              '-',

            nadzofah:
              previous[
                studentId
              ]?.nadzofah ||
              '-',

            indhiplat:
              previous[
                studentId
              ]
                ?.indhiplat ||
              '-',

            [field]:
              value,
          },
        })
      );

      if (message) {
        setMessage('');
        setMessageType('');
      }
    };

  /* ==========================================================
     SAVE
  ========================================================== */

  const handleSave =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      setMessage('');

      if (
        !selectedClass
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Silakan pilih kelas terlebih dahulu.'
        );

        return;
      }

      if (
        students.length ===
        0
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Tidak ada siswa pada kelas yang dipilih.'
        );

        return;
      }

      /*
       * Pastikan kelas masih benar-benar ada.
       */
      const classRoom =
        classes.find(
          (
            item
          ) =>
            item.name ===
            selectedClass
        );

      if (
        !classRoom
      ) {
        setMessageType(
          'error'
        );

        setMessage(
          'Kelas yang dipilih tidak valid atau sudah tidak tersedia.'
        );

        return;
      }

      setLoading(
        true
      );

      try {
        const records =
          students.map(
            (
              student
            ) => ({
              studentId:
                student.id,

              suluk:
                personalityData[
                  student.id
                ]?.suluk ||
                '-',

              muwadhotah:
                personalityData[
                  student.id
                ]
                  ?.muwadhotah ||
                '-',

              nadzofah:
                personalityData[
                  student.id
                ]
                  ?.nadzofah ||
                '-',

              indhiplat:
                personalityData[
                  student.id
                ]
                  ?.indhiplat ||
                '-',
            })
          );

        const response =
          await fetch(
            '/api/personality',
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
                    className:
                      classRoom.name,

                    records,
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
              'Gagal menyimpan penilaian kepribadian.'
            )
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          `Penilaian kepribadian ${students.length} siswa kelas ${classRoom.name} berhasil disimpan.`
        );
      } catch (
        error
      ) {
        console.error(
          'Save personality error:',
          error
        );

        setMessageType(
          'error'
        );

        setMessage(
          error instanceof
            Error
            ? error.message
            : 'Terjadi kesalahan saat menyimpan data.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* ==========================================================
     SELECTED CLASS
  ========================================================== */

  const selectedClassData =
    useMemo(
      () =>
        classes.find(
          (
            item
          ) =>
            item.name ===
            selectedClass
        ),
      [
        classes,
        selectedClass,
      ]
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#f0f0f1]">

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        {/* ====================================================
            PAGE HEADER
        ===================================================== */}

        <header className="mb-6">
          <h1 className="text-2xl font-normal text-[#1d2327] sm:text-3xl">Kepribadian &amp; Akhlak Siswa</h1>
          <p className="mt-2 text-base text-[#646970]">Pilih kelas dan isi empat aspek penilaian kepribadian siswa.</p>
        </header>

        {/* ====================================================
            FILTER CARD
        ===================================================== */}

        <section className="mb-6 rounded-sm border border-[#dcdcde] bg-white p-4 sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

            <div className="w-full max-w-md">

              <label className="mb-2 flex items-center gap-2 text-sm font-bold text-[#646970]">

                <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                  <Users
                    size={11}
                    strokeWidth={
                      1.8
                    }
                  />

                </span>

                Pilih Kelas

              </label>

              <div className="relative">

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
                  disabled={
                    classes.length ===
                    0
                  }
                  className="h-11 w-full appearance-none rounded-sm border border-[#dcdcde] bg-white px-3.5 pr-10 text-base font-medium text-[#1d2327] outline-none transition-all hover:border-[#c3c4c7] hover:bg-white focus:border-[#c3c4c7] focus:bg-white focus:ring-2 focus:ring-[#2271b1]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  <option value="">
                    {classes.length ===
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
                          ? ` • Tingkat ${classRoom.grade}`
                          : ''}
                      </option>
                    )
                  )}

                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#646970]"
                />

              </div>

              {classes.length ===
                0 && (
                <p className="mt-2 text-sm text-amber-600">
                  Belum ada kelas SD yang tersedia. Tambahkan kelas terlebih dahulu melalui Manajemen Kelas.
                </p>
              )}

            </div>

            {selectedClass && (
              <div className="flex items-center gap-3 rounded-sm border border-[#c3c4c7] bg-[#f0f6fc] px-4 py-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-white text-[#2271b1]">

                  <Users
                    size={15}
                    strokeWidth={
                      1.7
                    }
                  />

                </div>

                <div>

                  <div className="text-sm font-bold text-[#2271b1]">
                    Data Kelas
                  </div>

                  <div className="mt-0.5 text-sm font-semibold text-[#2271b1]">
                    Kelas{' '}
                    {
                      selectedClass
                    }

                    {selectedClassData?.grade
                      ? ` • Tingkat ${selectedClassData.grade}`
                      : ''}
                  </div>

                </div>

                <div className="ml-2 border-l border-[#c3c4c7] pl-3">

                  <div className="text-sm font-bold text-[#2271b1]">
                    {
                      students.length
                    }
                  </div>

                  <div className="text-sm text-[#2271b1]">
                    Siswa
                  </div>

                </div>

              </div>
            )}

          </div>

        </section>

        {/* ====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={`mb-5 flex items-start gap-3 rounded-sm border px-4 py-3 text-base ${
              messageType ===
              'success'
                ? 'border-[#c3c4c7] bg-[#f0f6fc] text-[#2271b1]'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >

            <CheckCircle2
              size={16}
              className="mt-0.5 shrink-0"
            />

            <span className="font-medium">
              {message}
            </span>

          </div>
        )}

        {/* ====================================================
            EMPTY STATE
        ===================================================== */}

        {!selectedClass && (
          <section className="overflow-hidden rounded-sm border border-[#dcdcde] bg-white">

            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">

              <div className="relative mb-5">

                <div className="relative flex h-16 w-16 items-center justify-center rounded-sm border border-[#c3c4c7] bg-[#f0f6fc] text-[#2271b1]">

                  <ClipboardCheck
                    size={28}
                    strokeWidth={
                      1.5
                    }
                  />

                </div>

              </div>

              <h2 className="text-sm font-semibold text-[#1d2327]">
                Belum ada kelas yang dipilih
              </h2>

              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#646970]">
                Pilih kelas terlebih dahulu untuk
                menampilkan daftar siswa dan mulai
                memberikan penilaian kepribadian.
              </p>


            </div>

          </section>
        )}

        {/* ====================================================
            LOADING
        ===================================================== */}

        {selectedClass &&
          loadingData && (
          <section className="rounded-sm border border-[#dcdcde] bg-white">

            <div className="flex min-h-[320px] flex-col items-center justify-center">

              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                <Loader2
                  size={22}
                  className="animate-spin"
                />

              </div>

              <p className="mt-4 text-base font-semibold text-[#646970]">
                Memuat data siswa...
              </p>

              <p className="mt-1 text-sm text-[#646970]">
                Menyiapkan penilaian kelas{' '}
                {
                  selectedClass
                }
              </p>

            </div>

          </section>
        )}

        {/* ====================================================
            MAIN TABLE
        ===================================================== */}

        {selectedClass &&
          !loadingData && (
          <form
            onSubmit={
              handleSave
            }
            className="overflow-hidden rounded-sm border border-[#dcdcde] bg-white"
          >

            {/* HEADER */}

            <div className="flex flex-col gap-4 border-b border-[#dcdcde] px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                    <Award
                      size={15}
                      strokeWidth={
                        1.7
                      }
                    />

                  </div>

                  <h2 className="text-sm font-semibold text-[#1d2327]">
                    Penilaian Kepribadian
                  </h2>

                </div>

                <p className="mt-2 pl-10 text-sm text-[#646970]">
                  Kelas{' '}
                  {
                    selectedClass
                  }{' '}
                  •{' '}
                  {
                    students.length
                  }{' '}
                  siswa
                </p>

              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  students.length ===
                    0
                }
                className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#2271b1] px-5 text-base font-semibold text-white transition-all hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-50"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />

                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save
                      size={15}
                      strokeWidth={
                        1.8
                      }
                    />

                    Simpan Penilaian
                  </>
                )}

              </button>

            </div>

            {/* TABLE */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1050px] border-collapse">

                <thead>

                  <tr className="border-b border-[#dcdcde] bg-[#f6f7f7]">

                    <th className="w-14 px-4 py-4 text-center text-sm font-bold text-[#646970]">
                      No
                    </th>

                    <th className="sticky left-0 z-10 min-w-[260px] bg-[#f6f7f7] px-4 py-4 text-left text-sm font-bold text-[#646970]">
                      Nama Siswa
                    </th>

                    {PERSONALITY_FIELDS.map(
                      (
                        field
                      ) => (
                        <th
                          key={
                            field.key
                          }
                          className="w-[190px] px-3 py-3 text-center"
                        >

                          <div className="flex flex-col items-center">

                            <span className="text-sm font-bold text-[#1d2327]">
                              {
                                field.title
                              }
                            </span>

                            <span
                              dir="rtl"
                              className="mt-0.5 font-serif text-sm font-medium text-[#2271b1]"
                            >
                              {
                                field.arabic
                              }
                            </span>

                            <span className="mt-1 text-sm font-normal text-[#646970]">
                              {
                                field.description
                              }
                            </span>

                          </div>

                        </th>
                      )
                    )}

                  </tr>

                </thead>

                <tbody>

                  {students.length ===
                  0 ? (
                    <tr>

                      <td
                        colSpan={
                          6
                        }
                        className="px-6 py-16 text-center"
                      >

                        <div className="mx-auto flex max-w-sm flex-col items-center">

                          <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#f0f0f1] text-[#646970]">

                            <Users
                              size={21}
                            />

                          </div>

                          <p className="mt-3 text-base font-semibold text-[#646970]">
                            Tidak ada siswa
                          </p>

                          <p className="mt-1 text-sm text-[#646970]">
                            Belum terdapat data siswa pada kelas ini.
                          </p>

                        </div>

                      </td>

                    </tr>
                  ) : (
                    students.map(
                      (
                        student,
                        index
                      ) => {
                        const studentValues =
                          personalityData[
                            student.id
                          ];

                        return (
                          <tr
                            key={
                              student.id
                            }
                            className="group border-b border-[#dcdcde] transition-colors last:border-b-0 hover:bg-[#f6f7f7]"
                          >

                            <td className="px-4 py-4 text-center align-middle">

                              <span className="text-sm font-semibold text-[#646970]">
                                {String(
                                  index +
                                    1
                                ).padStart(
                                  2,
                                  '0'
                                )}
                              </span>

                            </td>

                            <td className="sticky left-0 z-10 bg-white px-4 py-3 align-middle transition-colors group-hover:bg-[#f6f7f7]">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#f0f0f1] text-sm font-bold text-[#2271b1] ring-1 ring-[#2271b1]/20">

                                  {getInitial(
                                    student.fullname
                                  )}

                                </div>

                                <div className="min-w-0">

                                  <div className="break-words text-sm font-semibold text-[#1d2327]">
                                    {
                                      student.fullname
                                    }
                                  </div>

                                  <div className="mt-0.5 flex items-center gap-1.5 text-sm text-[#646970]">

                                    {student.nisn ? (
                                      <>
                                        <span>
                                          NISN
                                        </span>

                                        <span className="text-[#646970]">
                                          •
                                        </span>

                                        <span>
                                          {
                                            student.nisn
                                          }
                                        </span>
                                      </>
                                    ) : (
                                      <span>
                                        Siswa
                                      </span>
                                    )}

                                  </div>

                                </div>

                              </div>

                            </td>

                            {PERSONALITY_FIELDS.map(
                              (
                                field
                              ) => {
                                const value =
                                  studentValues?.[
                                    field.key
                                  ] ||
                                  '-';

                                return (
                                  <td
                                    key={
                                      field.key
                                    }
                                    className="px-3 py-3 align-middle"
                                  >

                                    <div className="relative">

                                      <select
                                        value={
                                          value
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          handleChange(
                                            student.id,
                                            field.key,
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        className={`h-10 w-full appearance-none rounded-sm border px-3 pr-8 text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-[#2271b1]/20 ${getPredicateStyle(
                                          value
                                        )}`}
                                      >

                                        {PREDICATES.map(
                                          (
                                            predicate
                                          ) => (
                                            <option
                                              key={
                                                predicate
                                              }
                                              value={
                                                predicate
                                              }
                                            >
                                              {predicate.replace(/Jeid/g, 'Jayyid')}
                                            </option>
                                          )
                                        )}

                                      </select>

                                      <ChevronDown
                                        size={13}
                                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-current opacity-50"
                                      />

                                    </div>

                                  </td>
                                );
                              }
                            )}

                          </tr>
                        );
                      }
                    )
                  )}

                </tbody>

              </table>

            </div>

            {/* FOOTER */}

            {students.length >
              0 && (
              <div className="flex flex-col gap-3 border-t border-[#dcdcde] bg-[#f6f7f7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                <div className="flex items-center gap-2 text-sm text-[#646970]">

                  <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                    <CheckCircle2
                      size={12}
                    />

                  </div>

                  <span>
                    Pastikan seluruh aspek kepribadian telah dinilai sebelum menyimpan.
                  </span>

                </div>

                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-sm bg-[#2271b1] px-4 text-sm font-semibold text-white transition hover:bg-[#135e96] disabled:opacity-50"
                >

                  {loading ? (
                    <>
                      <Loader2
                        size={13}
                        className="animate-spin"
                      />

                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save
                        size={13}
                      />

                      Simpan Perubahan
                    </>
                  )}

                </button>

              </div>
            )}

          </form>
        )}

        {/* ====================================================
            FOOTER IDENTITAS
        ===================================================== */}

        <div className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-[#dcdcde] pt-4 text-sm text-[#646970] sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_SHORT_NAME}
          </span>

          <span>
            Jenjang Sekolah Dasar
          </span>

        </div>

      </div>

    </div>
  );
}