'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareText,
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

const MAX_NOTE_LENGTH =
  2000;

/* ============================================================
   TYPES
============================================================ */

type ClassRoom = {
  id: number;
  name: string;
  level?: string | null;
  grade?: number | null;
  status?: string | null;
};

type Student = {
  id: number;
  fullname: string;
  nisn?: string | null;
  class_name: string;
};

type NoteRecord = {
  id?: number;
  studentId: number;
  className?: string | null;
  note?: string | null;
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

/* ============================================================
   PAGE
============================================================ */

export default function NotesPage() {
  /* ==========================================================
     DATA
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
    notesData,
    setNotesData,
  ] =
    useState<
      Record<
        number,
        string
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
    loadingStudents,
    setLoadingStudents,
  ] =
    useState(false);

  const [
    loadingClasses,
    setLoadingClasses,
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
     LOAD CLASSES
  ========================================================== */

  useEffect(() => {
    const fetchClasses =
      async () => {
        try {
          setLoadingClasses(
            true
          );

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
                'Gagal memuat daftar kelas.'
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

          /* ================================================
             HANYA KELAS SD 1–6
          ================================================ */

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
                      undefined ||
                    item.grade ===
                      null
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

          /*
           * Jika kelas yang sedang dipilih
           * sudah tidak tersedia, reset.
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
            'FETCH CLASSES ERROR:',
            error
          );

          setClasses(
            []
          );

          setMessageType(
            'error'
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal memuat daftar kelas.'
          );
        } finally {
          setLoadingClasses(
            false
          );
        }
      };

    fetchClasses();
  }, []);

  /* ==========================================================
     LOAD STUDENTS + NOTES
  ========================================================== */

  useEffect(() => {
    if (
      !selectedClass
    ) {
      setStudents(
        []
      );

      setNotesData(
        {}
      );

      return;
    }

    const fetchStudentsAndNotes =
      async () => {
        try {
          setLoadingStudents(
            true
          );

          setMessage('');
          setMessageType('');

          const [
            studentsRes,
            notesRes,
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
                `/api/notes?className=${encodeURIComponent(
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

          const studentsResponse =
            await studentsRes.json();

          const allStudents =
            normalizeArray<Student>(
              studentsResponse,
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
             NOTES
          ================================================ */

          if (
            !notesRes.ok
          ) {
            throw new Error(
              await getApiError(
                notesRes,
                'Gagal memuat catatan guru PAI.'
              )
            );
          }

          const notesResponse =
            await notesRes.json();

          const notesList =
            normalizeArray<NoteRecord>(
              notesResponse,
              [
                'notes',
                'note',
              ]
            );

          const map:
            Record<
              number,
              string
            > = {};

          for (
            const note of notesList
          ) {
            if (
              !Number.isInteger(
                Number(
                  note.studentId
                )
              )
            ) {
              continue;
            }

            map[
              Number(
                note.studentId
              )
            ] =
              String(
                note.note ||
                  ''
              );
          }

          setNotesData(
            map
          );
        } catch (
          error
        ) {
          console.error(
            'FETCH STUDENTS / NOTES ERROR:',
            error
          );

          setStudents(
            []
          );

          setNotesData(
            {}
          );

          setMessageType(
            'error'
          );

          setMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal memuat data.'
          );
        } finally {
          setLoadingStudents(
            false
          );
        }
      };

    fetchStudentsAndNotes();
  }, [
    selectedClass,
  ]);

  /* ==========================================================
     UPDATE NOTE
  ========================================================== */

  const handleChange =
    (
      studentId: number,
      value: string
    ) => {
      /*
       * Batasi 2000 karakter.
       */
      const normalizedValue =
        value.slice(
          0,
          MAX_NOTE_LENGTH
        );

      setNotesData(
        (
          previous
        ) => ({
          ...previous,

          [studentId]:
            normalizedValue,
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

      /* ------------------------------------------------------
         VALIDASI KELAS
      ------------------------------------------------------ */

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

      const classRoom =
        classes.find(
          (
            item
          ) =>
            item.name ===
            selectedClass
        );

      if (!classRoom) {
        setMessageType(
          'error'
        );

        setMessage(
          'Kelas yang dipilih tidak valid atau sudah tidak tersedia.'
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

      /* ------------------------------------------------------
         RECORDS
      ------------------------------------------------------ */

      const records =
        students.map(
          (
            student
          ) => ({
            studentId:
              student.id,

            note:
              String(
                notesData[
                  student.id
                ] ||
                  ''
              ).trim(),
          })
        );

      setLoading(
        true
      );

      setMessageType(
        ''
      );

      try {
        const response =
          await fetch(
            '/api/notes',
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
              'Gagal menyimpan catatan guru PAI.'
            )
          );
        }

        setMessageType(
          'success'
        );

        setMessage(
          `Catatan guru PAI untuk ${students.length} siswa kelas ${classRoom.name} berhasil disimpan.`
        );
      } catch (
        error
      ) {
        console.error(
          'SAVE NOTES ERROR:',
          error
        );

        setMessageType(
          'error'
        );

        setMessage(
          error instanceof
            Error
              ? error.message
              : 'Gagal menyimpan catatan guru PAI.'
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const filledNotes =
    useMemo(
      () =>
        students.filter(
          (
            student
          ) =>
            (
              notesData[
                student.id
              ] ||
              ''
            )
              .trim()
              .length >
            0
        ).length,
      [
        students,
        notesData,
      ]
    );

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
    <div className="min-h-screen bg-[#f0f0f1] px-4 py-6 sm:px-6 lg:px-8">

      <div className="mx-auto max-w-6xl space-y-6">

        {/* ====================================================
            HEADER
        ===================================================== */}

        <section>
          <h1 className="text-2xl font-normal text-[#1d2327]">Catatan Guru PAI</h1>
          <p className="mt-2 text-base leading-6 text-[#646970]">Pilih kelas dan tuliskan catatan perkembangan siswa untuk rapor.</p>
        </section>

        {/* ====================================================
            MESSAGE
        ===================================================== */}

        {message && (
          <div
            className={[
              'flex items-start gap-3 rounded-sm border px-4 py-3.5 text-sm ',

              messageType ===
              'success'
                ? 'border-emerald-200 bg-[#f0f6fc] text-[#2271b1]'
                : 'border-red-200 bg-red-50 text-red-700',
            ].join(
              ' '
            )}
          >

            {messageType ===
            'success' ? (
              <CheckCircle2
                size={18}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <FileText
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
            FILTER & INFO
        ===================================================== */}

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">

          {/* FILTER */}

          <div className="rounded-sm border border-[#c3c4c7] bg-white p-5 ">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">

              <div className="flex-1">

                <div className="mb-2 flex items-center gap-2">

                  <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                    <BookOpenCheck
                      size={15}
                      strokeWidth={
                        1.7
                      }
                    />

                  </div>

                  <label className="text-base font-semibold text-slate-700">
                    Kelas yang Dikelola
                  </label>

                </div>

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
                      loadingClasses ||
                      classes.length ===
                        0
                    }
                    className="h-11 w-full appearance-none rounded-sm border border-[#c3c4c7] bg-slate-50/60 px-3.5 pr-10 text-sm font-medium text-slate-700 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-[#2271b1]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <option value="">
                      {loadingClasses
                        ? 'Memuat kelas...'
                        : classes.length ===
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

                <p className="mt-2 text-sm text-[#646970]">
                  {classes.length >
                  0
                    ? 'Pilih kelas untuk menampilkan daftar siswa dan catatan perkembangan.'
                    : 'Tambahkan kelas SD terlebih dahulu melalui Manajemen Kelas.'}
                </p>

              </div>

            </div>

          </div>

          {/* STATISTICS */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:min-w-[270px]">

            <div className="rounded-sm border border-[#c3c4c7] bg-white p-4 ">

              <div className="flex items-center justify-between">

                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                  <Users
                    size={16}
                    strokeWidth={
                      1.7
                    }
                  />

                </div>

                <span className="text-sm font-semibold uppercase tracking-wider text-[#646970]">
                  Siswa
                </span>

              </div>

              <div className="mt-3 text-xl font-bold tracking-tight text-[#1d2327]">
                {
                  students.length
                }
              </div>

              <div className="mt-0.5 text-sm text-[#646970]">
                {selectedClass
                  ? `Kelas ${selectedClass}`
                  : 'Belum dipilih'}
              </div>

            </div>

            <div className="rounded-sm border border-[#c3c4c7] bg-white p-4 ">

              <div className="flex items-center justify-between">

                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-amber-50 text-amber-700">

                  <FileText
                    size={16}
                    strokeWidth={
                      1.7
                    }
                  />

                </div>

                <span className="text-sm font-semibold uppercase tracking-wider text-[#646970]">
                  Terisi
                </span>

              </div>

              <div className="mt-3 text-xl font-bold tracking-tight text-[#1d2327]">
                {
                  filledNotes
                }
              </div>

              <div className="mt-0.5 text-sm text-[#646970]">
                dari{' '}
                {
                  students.length
                }{' '}
                siswa
              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            CONTENT
        ===================================================== */}

        {selectedClass ? (
          <form
            onSubmit={
              handleSave
            }
            className="overflow-hidden rounded-sm border border-[#c3c4c7] bg-white "
          >

            {/* CONTENT HEADER */}

            <div className="border-b border-[#dcdcde] px-5 py-5 sm:px-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                    <GraduationCap
                      size={19}
                      strokeWidth={
                        1.7
                      }
                    />

                  </div>

                  <div>

                    <h2 className="text-sm font-semibold text-[#1d2327] sm:text-base">
                      Perkembangan Siswa
                    </h2>

                    <p className="mt-0.5 text-sm text-[#646970] sm:text-base">
                      Kelas{' '}
                      {
                        selectedClass
                      }

                      {selectedClassData
                        ?.grade
                        ? ` • Tingkat ${selectedClassData.grade}`
                        : ''}
                    </p>

                  </div>

                </div>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    loadingStudents ||
                    students.length ===
                      0
                  }
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#2271b1] px-5 text-base font-semibold text-white  transition-all hover:bg-[#135e96]  disabled:cursor-not-allowed disabled:opacity-50"
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

                      Simpan Catatan
                    </>
                  )}

                </button>

              </div>

            </div>

            {/* LOADING */}

            {loadingStudents ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center px-6">

                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-emerald-50 text-emerald-600">

                  <Loader2
                    size={22}
                    className="animate-spin"
                  />

                </div>

                <p className="mt-4 text-sm font-medium text-slate-600">
                  Memuat data siswa...
                </p>

                <p className="mt-1 text-sm text-[#646970]">
                  Menyiapkan catatan kelas{' '}
                  {
                    selectedClass
                  }.
                </p>

              </div>
            ) : (
              /* ================================================
                 TABLE
              ================================================= */

              <div className="px-3 pb-3 sm:px-5 sm:pb-5">

                <div className="overflow-hidden rounded-sm border border-[#c3c4c7]">

                  <div className="max-h-[580px] overflow-auto">

                    <table className="w-full min-w-[720px] border-collapse">

                      <thead className="sticky top-0 z-10">

                        <tr className="border-b border-emerald-900/10 bg-[#f6f7f7]">

                          <th className="w-16 px-4 py-3.5 text-center text-base font-semibold text-[#646970]">
                            No
                          </th>

                          <th className="w-[30%] px-4 py-3.5 text-left text-base font-semibold text-[#646970]">
                            Siswa
                          </th>

                          <th className="px-4 py-3.5 text-left text-base font-semibold text-[#646970]">
                            Catatan Perkembangan
                          </th>

                        </tr>

                      </thead>

                      <tbody className="divide-y divide-slate-100">

                        {students.length ===
                        0 ? (
                          <tr>

                            <td
                              colSpan={
                                3
                              }
                              className="px-6 py-16 text-center"
                            >

                              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-slate-50 text-[#646970]">

                                <Users
                                  size={21}
                                  strokeWidth={
                                    1.6
                                  }
                                />

                              </div>

                              <p className="mt-4 text-sm font-medium text-slate-600">
                                Belum ada siswa
                              </p>

                              <p className="mx-auto mt-1 max-w-sm text-base leading-6 text-[#646970]">
                                Tidak ditemukan data siswa pada kelas yang dipilih.
                              </p>

                            </td>

                          </tr>
                        ) : (
                          students.map(
                            (
                              student,
                              index
                            ) => {
                              const note =
                                notesData[
                                  student.id
                                ] ||
                                '';

                              const hasNote =
                                note
                                  .trim()
                                  .length >
                                0;

                              return (
                                <tr
                                  key={
                                    student.id
                                  }
                                  className="group align-top transition-colors hover:bg-[#f6f7f7]"
                                >

                                  {/* NO */}

                                  <td className="px-4 py-4 text-center">

                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-sm bg-slate-50 text-sm font-semibold text-[#646970] group-hover:bg-emerald-50 group-hover:text-emerald-600">
                                      {
                                        index +
                                        1
                                      }
                                    </span>

                                  </td>

                                  {/* SISWA */}

                                  <td className="px-4 py-4">

                                    <div className="flex items-start gap-3">

                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#f0f6fc] text-base font-bold text-emerald-700">

                                        {student.fullname
                                          ?.charAt(
                                            0
                                          )
                                          ?.toUpperCase() ||
                                          'S'}

                                      </div>

                                      <div className="min-w-0">

                                        <div className="break-words text-base font-semibold text-[#1d2327]">
                                          {
                                            student.fullname
                                          }
                                        </div>

                                        {student.nisn && (
                                          <div className="mt-1 text-sm text-[#646970]">
                                            NISN{' '}
                                            {
                                              student.nisn
                                            }
                                          </div>
                                        )}

                                        <div className="mt-1 inline-flex items-center rounded-sm bg-slate-50 px-1.5 py-0.5 text-sm font-medium text-[#646970]">
                                          Siswa
                                        </div>

                                      </div>

                                    </div>

                                  </td>

                                  {/* NOTE */}

                                  <td className="px-3 py-3">

                                    <div className="relative">

                                      <textarea
                                        rows={
                                          3
                                        }
                                        value={
                                          note
                                        }
                                        maxLength={
                                          MAX_NOTE_LENGTH
                                        }
                                        onChange={(
                                          event
                                        ) =>
                                          handleChange(
                                            student.id,
                                            event
                                              .target
                                              .value
                                          )
                                        }
                                        placeholder="Tuliskan perkembangan, prestasi, sikap, apresiasi, atau nasihat untuk siswa..."
                                        className="min-h-[110px] w-full resize-y rounded-sm border border-[#c3c4c7] bg-slate-50/40 px-3 py-2.5 text-base leading-6 text-slate-700 outline-none transition-all placeholder:text-[#646970] focus:border-[#2271b1] focus:bg-white focus:ring-4 focus:ring-[#2271b1]/20"
                                      />

                                      <div className="mt-1 flex items-center justify-between px-1">

                                        <span
                                          className={[
                                            'text-sm',

                                            hasNote
                                              ? 'text-emerald-500'
                                              : 'text-[#646970]',
                                          ].join(
                                            ' '
                                          )}
                                        >
                                          {hasNote
                                            ? 'Catatan siap disimpan'
                                            : 'Belum ada catatan'}
                                        </span>

                                        <span
                                          className={`text-sm ${
                                            note.length >=
                                            MAX_NOTE_LENGTH
                                              ? 'font-semibold text-red-500'
                                              : 'text-[#646970]'
                                          }`}
                                        >
                                          {
                                            note.length
                                          }
                                          /
                                          {
                                            MAX_NOTE_LENGTH
                                          }{' '}
                                          karakter
                                        </span>

                                      </div>

                                    </div>

                                  </td>

                                </tr>
                              );
                            }
                          )
                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              </div>
            )}

            {/* FOOTER */}

            {!loadingStudents &&
              students.length >
                0 && (
                <div className="border-t border-[#dcdcde] bg-slate-50/40 px-5 py-3.5 sm:px-6">

                  <div className="flex flex-col gap-2 text-sm text-[#646970] sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-2">

                      <CheckCircle2
                        size={13}
                        className="text-emerald-500"
                      />

                      <span>
                        {
                          filledNotes
                        }{' '}
                        dari{' '}
                        {
                          students.length
                        }{' '}
                        catatan telah diisi
                      </span>

                    </div>

                    <span className="text-[#646970]">
                      Catatan akan ditampilkan pada rapor siswa
                    </span>

                  </div>

                </div>
              )}

          </form>
        ) : (
          /* ==================================================
             EMPTY STATE
          ================================================== */

          <section className="overflow-hidden rounded-sm border border-[#c3c4c7] bg-white ">

            <div className="relative flex min-h-[390px] flex-col items-center justify-center overflow-hidden px-6 py-14 text-center">



              <div className="relative flex h-16 w-16 items-center justify-center rounded-sm border border-emerald-100 bg-emerald-50 text-emerald-600 ">

                <MessageSquareText
                  size={28}
                  strokeWidth={
                    1.5
                  }
                />

              </div>

              <div className="relative mt-6">

                <h2 className="text-base font-semibold text-slate-700">
                  Pilih Kelas Terlebih Dahulu
                </h2>

                <p className="mx-auto mt-2 max-w-md text-base leading-6 text-[#646970]">
                  Pilih kelas dari menu di atas untuk
                  melihat daftar siswa dan mulai
                  menuliskan catatan perkembangan mereka.
                </p>

              </div>

              <div className="relative mt-6 flex items-center gap-2 rounded-sm border border-amber-100 bg-amber-50/70 px-3.5 py-2">

                <Sparkles
                  size={12}
                  className="text-amber-500"
                />

                <span className="text-sm font-medium text-amber-700">
                  Catatan dengan ilmu, adab, dan kasih sayang
                </span>

              </div>

            </div>

          </section>
        )}

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <footer className="flex flex-col items-center justify-between gap-1 border-t border-[#c3c4c7] pt-4 text-sm text-[#646970] sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_NAME}
          </span>

          <span>
            Jenjang Sekolah Dasar
          </span>

        </footer>

      </div>

    </div>
  );
}