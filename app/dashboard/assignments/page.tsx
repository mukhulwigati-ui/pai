'use client';

import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';

/* ============================================================
   TYPES
============================================================ */

type Teacher = {
  id: number;
  fullname: string;
  identity_number?: string | null;
  status?: string | null;
  role?: string | null;
};

type Subject = {
  id: number;
  name: string;
  level?: string | null;
};

type ClassRoom = {
  id: number;
  name: string;
  level?: string | null;
  grade?: number | null;
  status?: string | null;
};

type Assignment = {
  id: number;

  teacherId?: number;
  subjectId?: number;

  className?: string | null;

  teacher?: {
    id?: number;
    fullname?: string | null;
  } | null;

  subject?: {
    id?: number;
    name?: string | null;
  } | null;
};

/* ============================================================
   CONFIG
============================================================ */

const SCHOOL_LEVEL = 'SD';

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

/* ============================================================
   PAGE
============================================================ */

export default function AssignmentsPage() {
  /* ==========================================================
     DATA STATE
  ========================================================== */

  const [
    assignments,
    setAssignments,
  ] = useState<Assignment[]>(
    []
  );

  const [
    teachers,
    setTeachers,
  ] = useState<Teacher[]>(
    []
  );

  const [
    subjects,
    setSubjects,
  ] = useState<Subject[]>(
    []
  );

  const [
    classes,
    setClasses,
  ] = useState<ClassRoom[]>(
    []
  );

  /* ==========================================================
     FORM STATE
  ========================================================== */

  const [
    teacherId,
    setTeacherId,
  ] = useState('');

  const [
    subjectId,
    setSubjectId,
  ] = useState('');

  const [
    className,
    setClassName,
  ] = useState('');

  /* ==========================================================
     UI STATE
  ========================================================== */

  const [
    message,
    setMessage,
  ] = useState('');

  const [
    messageType,
    setMessageType,
  ] = useState<
    'success' | 'error'
  >('success');

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    search,
    setSearch,
  ] = useState('');

  /* ==========================================================
     FETCH ALL DATA
  ========================================================== */

  const fetchData =
    async () => {
      try {
        setLoading(true);
        setMessage('');

        const [
          resAssig,
          resTeach,
          resSubj,
          resClass,
        ] =
          await Promise.all([
            fetch(
              '/api/assignments',
              {
                cache:
                  'no-store',
              }
            ),

            fetch(
              '/api/teachers',
              {
                cache:
                  'no-store',
              }
            ),

            fetch(
              `/api/subjects?level=${SCHOOL_LEVEL}`,
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

        /* ====================================================
           ASSIGNMENTS
        ==================================================== */

        if (!resAssig.ok) {
          const error =
            await getApiError(
              resAssig,
              'Gagal memuat data penugasan.'
            );

          throw new Error(
            error
          );
        }

        const dataAssig =
          await resAssig.json();

        const assignmentList =
          normalizeArray<Assignment>(
            dataAssig,
            [
              'assignments',
            ]
          );

        setAssignments(
          assignmentList
        );

        /* ====================================================
           USTADZ / USTADZAH
        ==================================================== */

        if (resTeach.ok) {
          const dataTeach =
            await resTeach.json();

          const teacherList =
            normalizeArray<Teacher>(
              dataTeach,
              [
                'teachers',
                'teacher',
              ]
            );

          /*
           * Jangan tampilkan akun ADMIN
           * pada pilihan pengampu.
           */
          const filteredTeachers =
            teacherList.filter(
              (teacher) =>
                String(
                  teacher.role ||
                    'TEACHER'
                ).toUpperCase() !==
                'ADMIN'
            );

          setTeachers(
            filteredTeachers
          );
        } else {
          console.error(
            'Gagal memuat ustadz/ustadzah:',
            await getApiError(
              resTeach,
              'Gagal memuat data ustadz dan ustadzah.'
            )
          );

          setTeachers([]);
        }

        /* ====================================================
           SUBJECTS
        ==================================================== */

        if (resSubj.ok) {
          const dataSubj =
            await resSubj.json();

          const subjectList =
            normalizeArray<Subject>(
              dataSubj,
              [
                'subjects',
                'subject',
              ]
            );

          /*
           * Tambahan proteksi:
           * hanya mapel SD.
           */
          const sdSubjects =
            subjectList.filter(
              (subject) =>
                !subject.level ||
                String(
                  subject.level
                ).toUpperCase() ===
                  SCHOOL_LEVEL
            );

          setSubjects(
            sdSubjects
          );
        } else {
          console.error(
            'Gagal memuat mapel:',
            await getApiError(
              resSubj,
              'Gagal memuat data mata pelajaran.'
            )
          );

          setSubjects([]);
        }

        /* ====================================================
           CLASSES
        ==================================================== */

        if (resClass.ok) {
          const dataClass =
            await resClass.json();

          const classList =
            normalizeArray<ClassRoom>(
              dataClass,
              [
                'classes',
                'classRooms',
                'classrooms',
              ]
            );

          /*
           * API classes seharusnya
           * sudah hanya mengirim SD.
           *
           * Tetap difilter lagi agar
           * halaman ini aman dari
           * data lama.
           */
          const sdClasses =
            classList
              .filter(
                (item) =>
                  !item.level ||
                  String(
                    item.level
                  ).toUpperCase() ===
                    SCHOOL_LEVEL
              )
              .filter(
                (item) => {
                  const grade =
                    Number(
                      item.grade
                    );

                  return (
                    !item.grade ||
                    (grade >= 1 &&
                      grade <= 6)
                  );
                }
              )
              .sort(
                (a, b) =>
                  Number(
                    a.grade || 0
                  ) -
                    Number(
                      b.grade || 0
                    ) ||
                  a.name.localeCompare(
                    b.name
                  )
              );

          setClasses(
            sdClasses
          );
        } else {
          console.error(
            'Gagal memuat kelas:',
            await getApiError(
              resClass,
              'Gagal memuat data kelas.'
            )
          );

          setClasses([]);
        }
      } catch (
        error: any
      ) {
        console.error(
          'Fetch assignments error:',
          error
        );

        setMessageType(
          'error'
        );

        setMessage(
          error?.message ||
            'Gagal memuat data.'
        );

        setAssignments([]);
        setTeachers([]);
        setSubjects([]);
        setClasses([]);
      } finally {
        setLoading(false);
      }
    };

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    fetchData();
  }, []);

  /* ==========================================================
     RESET FORM
  ========================================================== */

  const resetForm =
    () => {
      setTeacherId('');
      setSubjectId('');
      setClassName('');
    };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit =
    async (
      e: React.FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      setMessage('');

      if (!teacherId) {
        setMessageType(
          'error'
        );

        setMessage(
          'Silakan pilih ustadz/ustadzah terlebih dahulu.'
        );

        return;
      }

      if (!subjectId) {
        setMessageType(
          'error'
        );

        setMessage(
          'Silakan pilih mata pelajaran terlebih dahulu.'
        );

        return;
      }

      if (!className) {
        setMessageType(
          'error'
        );

        setMessage(
          'Silakan pilih kelas terlebih dahulu.'
        );

        return;
      }

      const selectedClass =
        classes.find(
          (item) =>
            item.name ===
            className
        );

      if (!selectedClass) {
        setMessageType(
          'error'
        );

        setMessage(
          'Kelas yang dipilih tidak valid.'
        );

        return;
      }

      setSubmitting(true);

      try {
        const res =
          await fetch(
            '/api/assignments',
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
                    teacherId:
                      Number(
                        teacherId
                      ),

                    subjectId:
                      Number(
                        subjectId
                      ),

                    className:
                      selectedClass.name,
                  }
                ),
            }
          );

        if (!res.ok) {
          const error =
            await getApiError(
              res,
              'Gagal menyimpan penugasan.'
            );

          throw new Error(
            error
          );
        }

        await res.json();

        setMessageType(
          'success'
        );

        setMessage(
          'Penugasan ustadz/ustadzah berhasil ditambahkan.'
        );

        resetForm();

        await fetchData();
      } catch (
        error: any
      ) {
        console.error(
          'Submit assignment error:',
          error
        );

        setMessageType(
          'error'
        );

        setMessage(
          error?.message ||
            'Terjadi kesalahan saat menyimpan penugasan.'
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* ==========================================================
     SEARCH FILTER
  ========================================================== */

  const filteredAssignments =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return assignments;
      }

      return assignments.filter(
        (assignment) => {
          const teacherName =
            assignment.teacher
              ?.fullname || '';

          const subjectName =
            assignment.subject
              ?.name || '';

          const classValue =
            assignment.className ||
            '';

          return (
            teacherName
              .toLowerCase()
              .includes(
                keyword
              ) ||
            subjectName
              .toLowerCase()
              .includes(
                keyword
              ) ||
            classValue
              .toLowerCase()
              .includes(
                keyword
              )
          );
        }
      );
    }, [
      assignments,
      search,
    ]);

  /* ==========================================================
     STATISTICS
  ========================================================== */

  const totalAssignments =
    assignments.length;

  const totalTeachers =
    teachers.length;

  const totalSubjects =
    subjects.length;

  const totalClasses =
    classes.length;

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <main className="min-h-screen bg-[#f0f0f1] text-[#1d2327]">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="mx-auto flex max-w-[1500px] flex-col gap-4 px-5 pt-6 sm:px-7 sm:flex-row sm:items-start sm:justify-between lg:px-10">
        <div>
          <h1 className="text-2xl font-normal text-[#1d2327]">Penugasan Ustadz &amp; Ustadzah</h1>
          <p className="mt-2 text-base leading-6 text-[#646970]">Atur pengampu mata pelajaran dan kelas.</p>
        </div>
        <button type="button" onClick={fetchData} disabled={loading || submitting} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-sm border border-[#2271b1] bg-[#f6f7f7] px-4 py-2 text-base text-[#2271b1] hover:bg-[#f0f6fc] disabled:cursor-not-allowed disabled:opacity-50">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Perbarui
        </button>
      </section>

      {/* =====================================================
          CONTENT
      ===================================================== */}

      <div className="mx-auto max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">

        {/* ===================================================
            STATISTICS
        =================================================== */}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">

          <StatCard
            icon={
              BookOpen
            }
            label="Total Penugasan"
            value={
              totalAssignments
            }
            description="Penugasan yang tersimpan"
          />

          <StatCard
            icon={Users}
            label="Ustadz/Ustadzah"
            value={
              totalTeachers
            }
            description="Pengajar tersedia"
            positive
          />

          <StatCard
            icon={
              GraduationCap
            }
            label="Mata Pelajaran"
            value={
              totalSubjects
            }
            description="Mapel jenjang SD"
          />

          <StatCard
            icon={
              ShieldCheck
            }
            label="Kelas"
            value={
              totalClasses
            }
            description="Kelas SD tersedia"
            positive
          />

        </div>

        {/* ===================================================
            MESSAGE
        =================================================== */}

        {message && (
          <div
            className={`flex items-start gap-3 rounded-sm border px-4 py-3 text-base font-medium  ${
              messageType ===
              'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}
          >

            {messageType ===
            'success' ? (
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-[#2271b1]"
              />
            ) : (
              <AlertCircle
                size={17}
                className="mt-0.5 shrink-0 text-red-600"
              />
            )}

            <span className="flex-1">
              {message}
            </span>

            <button
              type="button"
              onClick={() =>
                setMessage('')
              }
              className="opacity-50 transition hover:opacity-100"
            >
              <X
                size={15}
              />
            </button>

          </div>
        )}

        {/* ===================================================
            MAIN GRID
        =================================================== */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">

          {/* =================================================
              FORM
          ================================================= */}

          <section className="h-fit overflow-hidden rounded-sm border border-[#c3c4c7] bg-white ">

            <div className="relative overflow-hidden border-b border-[#dcdcde] bg-white px-5 py-5">


              <div className="relative flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-[#2271b1] text-white  ">

                  <Plus
                    size={19}
                  />

                </div>

                <div>

                  <h2 className="text-sm font-bold text-[#1d2327]">
                    Tambah Penugasan
                  </h2>

                  <p className="mt-0.5 text-sm text-[#646970]">
                    Tentukan ustadz/ustadzah,
                    mapel, dan kelas SD
                  </p>

                </div>

              </div>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-5"
            >

              {/* =================================================
                  TEACHER
              ================================================= */}

              <div>

                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">

                  <Users
                    size={12}
                    className="text-[#2271b1]"
                  />

                  Ustadz / Ustadzah

                  <span className="text-red-400">
                    *
                  </span>

                </label>

                <div className="relative">

                  <select
                    value={
                      teacherId
                    }
                    onChange={(
                      e
                    ) =>
                      setTeacherId(
                        e.target
                          .value
                      )
                    }
                    required
                    disabled={
                      loading ||
                      teachers.length ===
                        0
                    }
                    className="h-11 w-full appearance-none rounded-sm border border-[#c3c4c7] bg-slate-50/50 px-3 pr-9 text-base font-medium text-slate-700 outline-none transition focus:border-[#2271b1] focus:bg-white focus:ring-4 focus:ring-[#2271b1]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <option value="">
                      {loading
                        ? 'Memuat ustadz/ustadzah...'
                        : teachers.length ===
                            0
                          ? 'Belum ada ustadz/ustadzah'
                          : '-- Pilih Ustadz / Ustadzah --'}
                    </option>

                    {teachers.map(
                      (
                        teacher
                      ) => (
                        <option
                          key={
                            teacher.id
                          }
                          value={
                            teacher.id
                          }
                          disabled={
                            teacher.status ===
                            'Nonaktif'
                          }
                        >
                          {
                            teacher.fullname
                          }

                          {teacher.status ===
                          'Nonaktif'
                            ? ' — Nonaktif'
                            : ''}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#646970]"
                  />

                </div>

                {teachers.length ===
                  0 &&
                  !loading && (
                    <p className="mt-1.5 text-sm text-amber-600">
                      Belum ada data ustadz/ustadzah yang tersedia.
                    </p>
                  )}

              </div>

              {/* =================================================
                  SUBJECT
              ================================================= */}

              <div>

                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">

                  <BookOpen
                    size={12}
                    className="text-[#2271b1]"
                  />

                  Mata Pelajaran

                  <span className="text-red-400">
                    *
                  </span>

                </label>

                <div className="relative">

                  <select
                    value={
                      subjectId
                    }
                    onChange={(
                      e
                    ) =>
                      setSubjectId(
                        e.target
                          .value
                      )
                    }
                    required
                    disabled={
                      loading ||
                      subjects.length ===
                        0
                    }
                    className="h-11 w-full appearance-none rounded-sm border border-[#c3c4c7] bg-slate-50/50 px-3 pr-9 text-base font-medium text-slate-700 outline-none transition focus:border-[#2271b1] focus:bg-white focus:ring-4 focus:ring-[#2271b1]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <option value="">
                      {loading
                        ? 'Memuat mata pelajaran...'
                        : subjects.length ===
                            0
                          ? 'Belum ada mata pelajaran'
                          : '-- Pilih Mata Pelajaran --'}
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
                            subject.id
                          }
                        >
                          {
                            subject.name
                          }
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#646970]"
                  />

                </div>

                {subjects.length ===
                  0 &&
                  !loading && (
                    <p className="mt-1.5 text-sm text-amber-600">
                      Belum ada mata pelajaran jenjang SD yang tersedia.
                    </p>
                  )}

              </div>

              {/* =================================================
                  CLASS
              ================================================= */}

              <div>

                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-600">

                  <GraduationCap
                    size={12}
                    className="text-[#2271b1]"
                  />

                  Kelas Target

                  <span className="text-red-400">
                    *
                  </span>

                </label>

                <div className="relative">

                  <select
                    value={
                      className
                    }
                    onChange={(
                      e
                    ) =>
                      setClassName(
                        e.target
                          .value
                      )
                    }
                    required
                    disabled={
                      loading ||
                      classes.length ===
                        0
                    }
                    className="h-11 w-full appearance-none rounded-sm border border-[#c3c4c7] bg-slate-50/50 px-3 pr-9 text-base font-semibold text-slate-700 outline-none transition focus:border-[#2271b1] focus:bg-white focus:ring-4 focus:ring-[#2271b1]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <option value="">
                      {loading
                        ? 'Memuat kelas...'
                        : classes.length ===
                            0
                          ? 'Belum ada kelas SD'
                          : '-- Pilih Kelas --'}
                    </option>

                    {classes.map(
                      (
                        item
                      ) => (
                        <option
                          key={
                            item.id
                          }
                          value={
                            item.name
                          }
                        >
                          Kelas{' '}
                          {
                            item.name
                          }

                          {item.grade
                            ? ` — Tingkat ${item.grade}`
                            : ''}
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#646970]"
                  />

                </div>

                {classes.length ===
                  0 &&
                  !loading && (
                    <p className="mt-1.5 text-sm text-amber-600">
                      Belum ada kelas SD. Tambahkan kelas terlebih dahulu melalui menu Manajemen Kelas.
                    </p>
                  )}

              </div>

              {/* =================================================
                  INFO
              ================================================= */}

              <div className="rounded-sm border border-emerald-100 bg-emerald-50/60 p-3">

                <div className="flex items-start gap-2">

                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-[#2271b1]"
                  />

                  <p className="text-sm leading-6 text-[#2271b1]">
                    Satu penugasan menghubungkan ustadz/ustadzah dengan mata pelajaran dan kelas SD yang dipilih.
                  </p>

                </div>

              </div>

              {/* =================================================
                  SUBMIT
              ================================================= */}

              <button
                type="submit"
                disabled={
                  submitting ||
                  loading ||
                  teachers.length ===
                    0 ||
                  subjects.length ===
                    0 ||
                  classes.length ===
                    0
                }
                className="group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-sm bg-[#2271b1] text-base font-bold text-white   transition hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-50"
              >


                {submitting ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />

                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Check
                      size={15}
                    />

                    Simpan Penugasan
                  </>
                )}

              </button>

            </form>

          </section>

          {/* =================================================
              ASSIGNMENT LIST
          ================================================= */}

          <section className="min-w-0">

            <div className="mb-3 rounded-sm border border-[#c3c4c7] bg-white p-4 ">

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                    <BookOpen
                      size={18}
                    />

                  </div>

                  <div>

                    <h2 className="text-sm font-bold text-[#1d2327]">
                      Daftar Penugasan
                    </h2>

                    <p className="text-sm text-[#646970]">
                      {
                        filteredAssignments.length
                      }{' '}
                      dari{' '}
                      {
                        assignments.length
                      }{' '}
                      penugasan
                    </p>

                  </div>

                </div>

                <div className="relative">

                  <Search
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#646970]"
                  />

                  <input
                    type="search"
                    value={
                      search
                    }
                    onChange={(
                      e
                    ) =>
                      setSearch(
                        e.target
                          .value
                      )
                    }
                    placeholder="Cari ustadz, ustadzah, mapel, kelas..."
                    className="h-10 w-full rounded-sm border border-[#c3c4c7] bg-slate-50/70 pl-9 pr-3 text-base outline-none transition placeholder:text-[#646970] focus:border-[#2271b1] focus:bg-white focus:ring-4 focus:ring-[#2271b1]/20 sm:w-72"
                  />

                </div>

              </div>

            </div>

            <div className="overflow-hidden rounded-sm border border-[#c3c4c7] bg-white ">

              {loading ? (
                <LoadingState />
              ) : assignments.length ===
                0 ? (
                <EmptyState />
              ) : filteredAssignments.length ===
                0 ? (
                <SearchEmptyState />
              ) : (
                <div className="overflow-x-auto">

                  <table className="w-full min-w-[700px] border-collapse text-base">

                    <thead>

                      <tr className="border-b border-[#c3c4c7] bg-[#f6f7f7]">

                        <th className="px-4 py-3 text-left text-base font-semibold text-[#646970]">
                          Ustadz / Ustadzah
                        </th>

                        <th className="px-4 py-3 text-left text-base font-semibold text-[#646970]">
                          Mata Pelajaran
                        </th>

                        <th className="px-4 py-3 text-center text-base font-semibold text-[#646970]">
                          Kelas
                        </th>

                      </tr>

                    </thead>

                    <tbody className="divide-y divide-slate-100">

                      {filteredAssignments.map(
                        (
                          assignment
                        ) => (
                          <tr
                            key={
                              assignment.id
                            }
                            className="group transition hover:bg-slate-50/70"
                          >

                            <td className="px-4 py-4">

                              <div className="flex items-center gap-3">

                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-[#f0f6fc] text-[#2271b1]">

                                  <Users
                                    size={
                                      16
                                    }
                                    strokeWidth={
                                      1.7
                                    }
                                  />

                                </div>

                                <div className="min-w-0">

                                  <div className="font-bold text-[#1d2327]">
                                    {assignment
                                      .teacher
                                      ?.fullname ||
                                      'Ustadz/ustadzah tidak ditemukan'}
                                  </div>

                                  <div className="mt-0.5 text-sm text-[#646970]">
                                    Pengampu
                                  </div>

                                </div>

                              </div>

                            </td>

                            <td className="px-4 py-4">

                              <div className="inline-flex max-w-[240px] items-center gap-2 rounded-sm border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm font-semibold text-[#2271b1]">

                                <BookOpen
                                  size={
                                    12
                                  }
                                />

                                <span className="truncate">
                                  {assignment
                                    .subject
                                    ?.name ||
                                    'Mapel tidak ditemukan'}
                                </span>

                              </div>

                            </td>

                            <td className="px-4 py-4 text-center">

                              <span className="inline-flex items-center rounded-sm border border-[#c3c4c7] bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-600">

                                Kelas{' '}

                                {assignment.className ||
                                  '-'}

                              </span>

                            </td>

                          </tr>
                        )
                      )}

                    </tbody>

                  </table>

                </div>
              )}

            </div>

          </section>

        </div>

      </div>

      {/* =====================================================
          GLOBAL STYLE
      ===================================================== */}

      <style jsx global>{`
        * {
          box-sizing: border-box;
        }

        input,
        textarea,
        select,
        button {
          font-family: inherit;
        }

        ::selection {
          background: #c5d9ed;
        }

        input[type='search']::-webkit-search-cancel-button {
          display: none;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>

    </main>
  );
}

/* ============================================================
   STAT CARD
============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  positive,
}: {
  icon: any;
  label: string;
  value: number;
  description: string;
  positive?: boolean;
}) {
  return (
    <div className="group relative overflow-hidden rounded-sm border border-[#c3c4c7] bg-white p-4  transition  ">


      <div className="relative flex items-center gap-3">

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-sm ${
            positive
              ? 'bg-[#f0f6fc] text-[#2271b1]'
              : 'bg-slate-100 text-[#646970]'
          }`}
        >

          <Icon
            size={18}
            strokeWidth={
              1.7
            }
          />

        </div>

        <div className="min-w-0">

          <div className="text-sm font-bold uppercase tracking-[0.12em] text-[#646970]">
            {label}
          </div>

          <div className="mt-0.5 text-xl font-bold tracking-tight text-[#1d2327]">
            {value}
          </div>

          <div className="truncate text-sm text-[#646970]">
            {
              description
            }
          </div>

        </div>

      </div>

    </div>
  );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-sm bg-emerald-50">

        <Loader2
          size={24}
          className="animate-spin text-[#2271b1]"
        />

      </div>

      <p className="mt-4 text-base font-semibold text-[#646970]">
        Memuat data penugasan...
      </p>

      <p className="mt-1 text-sm text-[#646970]">
        Menghubungkan ke database akademik
      </p>

    </div>
  );
}

/* ============================================================
   EMPTY
============================================================ */

function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-5 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-slate-100 text-[#646970]">

        <BookOpen
          size={28}
          strokeWidth={
            1.4
          }
        />

      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-700">
        Belum Ada Penugasan
      </h3>

      <p className="mt-1 max-w-xs text-sm leading-6 text-[#646970]">
        Belum terdapat penugasan ustadz/ustadzah, mata pelajaran, dan kelas dalam sistem.
      </p>

    </div>
  );
}

/* ============================================================
   SEARCH EMPTY
============================================================ */

function SearchEmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-5 text-center">

      <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-slate-100 text-[#646970]">

        <Search
          size={26}
          strokeWidth={
            1.5
          }
        />

      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-700">
        Data Tidak Ditemukan
      </h3>

      <p className="mt-1 text-sm text-[#646970]">
        Coba gunakan nama ustadz/ustadzah, mata pelajaran, atau kelas yang berbeda.
      </p>

    </div>
  );
}