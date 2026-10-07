'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Layers3,
  Plus,
  Save,
  School,
  Trash2,
  Users,
  X,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type ClassRoom = {
  id: number;
  name: string;
  level: string;
  grade: number;
  status?: string;
  student_count: number;
};

type MessageType =
  | 'success'
  | 'error'
  | '';

// ============================================================================
// CONFIG
// ============================================================================

const SCHOOL_NAME =
  'SDIT Khoiro Ummah';

const LEVEL = 'SD';

const GRADES = [
  1,
  2,
  3,
  4,
  5,
  6,
];

// ============================================================================
// PAGE
// ============================================================================

export default function ClassesPage() {
  // ==========================================================================
  // STATE
  // ==========================================================================

  const [classes, setClasses] =
    useState<ClassRoom[]>([]);

  const [name, setName] =
    useState('');

  const [grade, setGrade] =
    useState('1');

  const [editingId, setEditingId] =
    useState<number | null>(
      null
    );

  const [message, setMessage] =
    useState('');

  const [
    messageType,
    setMessageType,
  ] =
    useState<MessageType>('');

  const [loading, setLoading] =
    useState(false);

  const [
    loadingClasses,
    setLoadingClasses,
  ] =
    useState(true);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<number | null>(
      null
    );

  const [
    deletingAll,
    setDeletingAll,
  ] =
    useState(false);

  // ==========================================================================
  // MESSAGE
  // ==========================================================================

  const showMessage = (
    text: string,
    type: MessageType =
      'success'
  ) => {
    setMessage(text);
    setMessageType(type);

    window.setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  // ==========================================================================
  // FETCH
  // ==========================================================================

  const fetchClasses =
    async () => {
      try {
        setLoadingClasses(true);

        const res =
          await fetch(
            '/api/classes',
            {
              cache: 'no-store',
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ||
              'Gagal memuat data kelas.'
          );
        }

        const result =
          Array.isArray(data)
            ? data
            : Array.isArray(
                  data?.data
                )
              ? data.data
              : [];

        setClasses(result);
      } catch (
        error: unknown
      ) {
        console.error(
          'FETCH CLASSES ERROR:',
          error
        );

        showMessage(
          error instanceof Error
            ? error.message
            : 'Gagal memuat daftar kelas.',
          'error'
        );
      } finally {
        setLoadingClasses(
          false
        );
      }
    };

  // ==========================================================================
  // INITIAL LOAD
  // ==========================================================================

  useEffect(() => {
    fetchClasses();
  }, []);

  // ==========================================================================
  // RESET FORM
  // ==========================================================================

  const resetForm = () => {
    setName('');
    setGrade('1');
    setEditingId(null);
  };

  // ==========================================================================
  // EDIT
  // ==========================================================================

  const handleEdit = (
    item: ClassRoom
  ) => {
    setEditingId(item.id);

    setName(
      item.name || ''
    );

    const currentGrade =
      Number(item.grade);

    if (
      currentGrade >= 1 &&
      currentGrade <= 6
    ) {
      setGrade(
        String(currentGrade)
      );
    } else {
      setGrade('1');
    }

    setMessage('');
    setMessageType('');

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // ==========================================================================
  // SUBMIT CREATE / UPDATE
  // ==========================================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const trimmedName =
      name
        .trim()
        .toUpperCase();

    const numericGrade =
      Number(grade);

    if (!trimmedName) {
      showMessage(
        'Nama kelas wajib diisi.',
        'error'
      );

      return;
    }

    if (
      !Number.isInteger(
        numericGrade
      ) ||
      numericGrade < 1 ||
      numericGrade > 6
    ) {
      showMessage(
        'Tingkat kelas harus antara 1 sampai 6.',
        'error'
      );

      return;
    }

    setLoading(true);

    try {
      const url = editingId
        ? `/api/classes/${editingId}`
        : '/api/classes';

      const method =
        editingId
          ? 'PUT'
          : 'POST';

      const res =
        await fetch(url, {
          method,

          headers: {
            'Content-Type':
              'application/json',
          },

          body:
            JSON.stringify({
              name:
                trimmedName,

              level:
                LEVEL,

              grade:
                numericGrade,
            }),
        });

      const data =
        await res.json();

      if (!res.ok) {
        throw new Error(
          data?.message ||
            (editingId
              ? 'Gagal memperbarui kelas.'
              : 'Gagal menyimpan kelas.')
        );
      }

      showMessage(
        editingId
          ? 'Kelas berhasil diperbarui.'
          : 'Kelas berhasil ditambahkan.',
        'success'
      );

      resetForm();

      await fetchClasses();
    } catch (
      error: unknown
    ) {
      console.error(
        'SAVE CLASS ERROR:',
        error
      );

      showMessage(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menyimpan kelas.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================================================
  // DELETE ONE
  // ==========================================================================

  const handleDelete =
    async (
      item: ClassRoom
    ) => {
      const confirmed =
        window.confirm(
          `Hapus kelas "${item.name}"?\n\nData kelas akan dihapus dari sistem.`
        );

      if (!confirmed) {
        return;
      }

      setDeletingId(
        item.id
      );

      try {
        const res =
          await fetch(
            `/api/classes/${item.id}`,
            {
              method:
                'DELETE',
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ||
              'Gagal menghapus kelas.'
          );
        }

        if (
          editingId ===
          item.id
        ) {
          resetForm();
        }

        showMessage(
          `Kelas ${item.name} berhasil dihapus.`,
          'success'
        );

        await fetchClasses();
      } catch (
        error: unknown
      ) {
        console.error(
          'DELETE CLASS ERROR:',
          error
        );

        showMessage(
          error instanceof Error
            ? error.message
            : 'Gagal menghapus kelas.',
          'error'
        );
      } finally {
        setDeletingId(
          null
        );
      }
    };

  // ==========================================================================
  // DELETE ALL
  // ==========================================================================

  const handleDeleteAll =
    async () => {
      if (
        classes.length ===
        0
      ) {
        showMessage(
          'Tidak ada kelas yang dapat dihapus.',
          'error'
        );

        return;
      }

      const confirmed =
        window.confirm(
          `PERINGATAN!\n\nAnda akan menghapus SEMUA ${classes.length} kelas.\n\nTindakan ini tidak dapat dibatalkan.\n\nLanjutkan?`
        );

      if (!confirmed) {
        return;
      }

      const confirmedAgain =
        window.confirm(
          'Konfirmasi terakhir:\n\nHapus seluruh data kelas?'
        );

      if (
        !confirmedAgain
      ) {
        return;
      }

      setDeletingAll(
        true
      );

      try {
        const res =
          await fetch(
            '/api/classes',
            {
              method:
                'DELETE',
            }
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ||
              'Gagal menghapus seluruh kelas.'
          );
        }

        resetForm();

        showMessage(
          'Seluruh data kelas berhasil dihapus.',
          'success'
        );

        await fetchClasses();
      } catch (
        error: unknown
      ) {
        console.error(
          'DELETE ALL CLASSES ERROR:',
          error
        );

        showMessage(
          error instanceof Error
            ? error.message
            : 'Gagal menghapus seluruh kelas.',
          'error'
        );
      } finally {
        setDeletingAll(
          false
        );
      }
    };

  // ==========================================================================
  // SORT CLASSES
  // ==========================================================================

  const sortedClasses =
    useMemo(() => {
      return [
        ...classes,
      ].sort(
        (a, b) =>
          Number(
            a.grade
          ) -
            Number(
              b.grade
            ) ||
          a.name.localeCompare(
            b.name
          )
      );
    }, [classes]);

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  const activeClasses =
    classes.filter(
      (item) =>
        item.status !==
        'Tidak Aktif'
    ).length;

  const totalGrades =
    new Set(
      classes
        .map((item) =>
          Number(
            item.grade
          )
        )
        .filter(
          (item) =>
            item >= 1 &&
            item <= 6
        )
    ).size;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-[#f0f0f1] text-[#1d2327]">

      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}

      <header>

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            {/* TITLE */}

            <div>

              <div className="mb-2.5 flex items-center gap-2">

                <span className="flex h-6 w-6 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700">

                  <School
                    size={13}
                    strokeWidth={1.8}
                  />

                </span>

                <span className="text-sm font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Data Master
                </span>

                <span className="text-[#646970]">
                  /
                </span>

                <span className="text-sm font-medium uppercase tracking-[0.16em] text-[#646970]">
                  Struktur Akademik
                </span>

              </div>

              <h1 className="text-2xl font-normal text-[#1d2327]">
                Manajemen Kelas
              </h1>

              <p className="mt-1 max-w-xl text-base leading-6 text-[#646970] sm:text-sm">
                Kelola struktur kelas siswa {SCHOOL_NAME} untuk tingkat 1 sampai 6.
              </p>

            </div>

            {/* SUMMARY */}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#dcdcde] pt-4 lg:border-0 lg:pt-0">

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700">
                  <Layers3
                    size={15}
                  />
                </div>

                <div>

                  <div className="text-base font-semibold text-[#1d2327]">
                    {
                      classes.length
                    }
                  </div>

                  <div className="text-sm font-medium uppercase tracking-[0.14em] text-[#646970]">
                    Total Kelas
                  </div>

                </div>

              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-teal-50 text-teal-700">
                  <School
                    size={15}
                  />
                </div>

                <div>

                  <div className="text-base font-semibold text-[#1d2327]">
                    {
                      totalGrades
                    }
                  </div>

                  <div className="text-sm font-medium uppercase tracking-[0.14em] text-[#646970]">
                    Tingkat
                  </div>

                </div>

              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700">
                  <CheckCircle2
                    size={15}
                  />
                </div>

                <div>

                  <div className="text-base font-semibold text-[#1d2327]">
                    {
                      activeClasses
                    }
                  </div>

                  <div className="text-sm font-medium uppercase tracking-[0.14em] text-[#646970]">
                    Aktif
                  </div>

                </div>

              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-amber-50 text-amber-700">
                  <BookOpen
                    size={15}
                  />
                </div>

                <div>

                  <div className="text-base font-semibold text-[#1d2327]">
                    SD
                  </div>

                  <div className="text-sm font-medium uppercase tracking-[0.14em] text-[#646970]">
                    Jenjang
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </header>

      {/* ================================================================== */}
      {/* MAIN */}
      {/* ================================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* MESSAGE */}

        {message && (
          <div
            className={[
              'mb-5 flex items-center gap-2 border-b px-1 pb-3 text-base',
              messageType ===
              'success'
                ? 'border-emerald-200 text-emerald-700'
                : 'border-red-200 text-red-600',
            ].join(' ')}
          >
            {messageType ===
            'success' ? (
              <CheckCircle2
                size={15}
              />
            ) : (
              <AlertTriangle
                size={15}
              />
            )}

            <span>
              {message}
            </span>
          </div>
        )}

        {/* CONTENT */}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">

          {/* ============================================================= */}
          {/* FORM */}
          {/* ============================================================= */}

          <section className="h-fit border border-[#c3c4c7] bg-white p-5">

            <div className="mb-5">

              <div className="flex items-center gap-2">

                {editingId ? (
                  <Edit3
                    size={17}
                    strokeWidth={1.8}
                    className="text-amber-600"
                  />
                ) : (
                  <Plus
                    size={17}
                    strokeWidth={1.8}
                    className="text-emerald-700"
                  />
                )}

                <h2 className="text-sm font-semibold text-slate-900">
                  {editingId
                    ? 'Edit Kelas'
                    : 'Tambah Kelas'}
                </h2>

              </div>

              <p className="mt-1 text-sm leading-6 text-[#646970]">
                {editingId
                  ? 'Perbarui informasi kelas yang dipilih.'
                  : 'Tambahkan kelas baru jenjang SD.'}
              </p>

            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-4"
            >

              {/* NAME */}

              <div>

                <label className="mb-1.5 block text-sm font-bold uppercase tracking-[0.16em] text-[#646970]">
                  Nama Kelas
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target
                        .value
                    )
                  }
                  required
                  placeholder="Contoh: 1A"
                  className="h-11 w-full rounded-sm border border-[#8c8f94] bg-white px-3 text-sm font-medium text-[#1d2327] outline-none transition placeholder:text-[#646970] focus:border-[#2271b1]"
                />

              </div>

              {/* GRADE */}

              <div>

                <label className="mb-1.5 block text-sm font-bold uppercase tracking-[0.16em] text-[#646970]">
                  Tingkat
                </label>

                <div className="relative">

                  <select
                    value={grade}
                    onChange={(e) =>
                      setGrade(
                        e.target
                          .value
                      )
                    }
                    className="h-11 w-full appearance-none rounded-sm border border-[#8c8f94] bg-white pl-3 pr-8 text-sm font-medium text-[#1d2327] outline-none transition focus:border-[#2271b1]"
                  >
                    {GRADES.map(
                      (item) => (
                        <option
                          key={
                            item
                          }
                          value={
                            item
                          }
                        >
                          Kelas{' '}
                          {
                            item
                          }
                        </option>
                      )
                    )}
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-3 text-[#646970]"
                  />

                </div>

              </div>

              {/* LEVEL */}

              <div>

                <label className="mb-1.5 block text-sm font-bold uppercase tracking-[0.16em] text-[#646970]">
                  Jenjang
                </label>

                <div className="flex h-10 items-center justify-between border-b border-[#c3c4c7]">

                  <span className="text-sm font-semibold text-emerald-700">
                    SD
                  </span>

                  <span className="text-sm text-[#646970]">
                    Tetap
                  </span>

                </div>

              </div>

              {/* BUTTON */}

              <div className="flex gap-2 pt-1">

                <button
                  type="submit"
                  disabled={loading}
                  className={[
                    'flex h-10 flex-1 items-center justify-center gap-2 rounded-sm text-base font-semibold text-white  transition',
                    editingId
                      ? 'bg-[#2271b1] hover:bg-[#135e96]'
                      : 'bg-[#2271b1] hover:bg-[#135e96]',
                    'disabled:cursor-not-allowed disabled:opacity-50',
                  ].join(' ')}
                >

                  {editingId ? (
                    <Save
                      size={15}
                      strokeWidth={2}
                    />
                  ) : (
                    <Plus
                      size={15}
                      strokeWidth={2}
                    />
                  )}

                  {loading
                    ? 'Menyimpan...'
                    : editingId
                    ? 'Simpan Perubahan'
                    : 'Simpan Kelas'}

                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={
                      resetForm
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-sm border border-[#c3c4c7] bg-white text-[#646970] transition hover:border-slate-300 hover:bg-slate-50"
                    title="Batal edit"
                  >
                    <X
                      size={16}
                    />
                  </button>
                )}

              </div>

            </form>

            {/* INFO */}

            <div className="mt-7 border-t border-[#dcdcde] pt-5">

              <div className="flex gap-2.5">

                <BookOpen
                  size={14}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-sm leading-6 text-[#646970]">
                  {SCHOOL_NAME} menggunakan jenjang{' '}
                  <strong className="text-[#646970]">
                    SD
                  </strong>{' '}
                  dengan tingkat kelas{' '}
                  <strong className="text-[#646970]">
                    1 sampai 6
                  </strong>.
                </p>

              </div>

            </div>

          </section>

          {/* ============================================================= */}
          {/* LIST */}
          {/* ============================================================= */}

          <section className="min-w-0 border border-[#c3c4c7] bg-white p-5">

            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <div className="flex items-center gap-2">

                  <School
                    size={17}
                    strokeWidth={1.8}
                    className="text-emerald-700"
                  />

                  <h2 className="text-sm font-semibold text-slate-900">
                    Daftar Kelas SD
                  </h2>

                </div>

                <p className="mt-1 text-sm text-[#646970]">
                  {
                    classes.length
                  }{' '}
                  kelas terdaftar dalam sistem
                </p>

              </div>

              {classes.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    handleDeleteAll
                  }
                  disabled={
                    deletingAll
                  }
                  className="inline-flex h-8 items-center justify-center gap-1.5 self-start border-b border-red-200 px-1 text-sm font-semibold text-red-500 transition hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                >
                  <Trash2
                    size={13}
                  />

                  {deletingAll
                    ? 'Menghapus...'
                    : 'Hapus Semua'}
                </button>
              )}

            </div>

            {/* LOADING */}

            {loadingClasses ? (
              <div className="border-y border-[#c3c4c7] py-14 text-center">

                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />

                <p className="mt-3 text-sm text-[#646970]">
                  Memuat data kelas...
                </p>

              </div>
            ) : classes.length ===
              0 ? (
              /* EMPTY */

              <div className="border-y border-dashed border-[#c3c4c7] py-14 text-center">

                <School
                  size={30}
                  strokeWidth={1.3}
                  className="mx-auto mb-3 text-[#646970]"
                />

                <p className="text-sm font-medium text-[#646970]">
                  Belum ada kelas
                </p>

                <p className="mt-1 text-sm text-[#646970]">
                  Tambahkan kelas menggunakan formulir di sebelah kiri.
                </p>

              </div>
            ) : (
              /* TABLE */

              <div>

                <div className="mb-2 flex items-center gap-3">

                  <div className="flex h-6 w-6 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700">
                    <School
                      size={13}
                    />
                  </div>

                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                    SD
                  </span>

                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />

                  <span className="text-sm text-[#646970]">
                    {
                      sortedClasses.length
                    }{' '}
                    kelas
                  </span>

                </div>

                {/* TABLE HEADER */}

                <div className="hidden grid-cols-[70px_minmax(0,1fr)_110px_140px_96px] gap-4 border-b border-[#c3c4c7] px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-[#646970] lg:grid">

                  <span>
                    Tingkat
                  </span>

                  <span>
                    Nama Kelas
                  </span>

                  <span>
                    Status
                  </span>

                  <span>
                    Siswa
                  </span>

                  <span className="text-right">
                    Aksi
                  </span>

                </div>

                {/* ROWS */}

                <div>

                  {sortedClasses.map(
                    (cls) => {
                      const active =
                        cls.status !==
                        'Tidak Aktif';

                      const deleting =
                        deletingId ===
                        cls.id;

                      return (
                        <div
                          key={
                            cls.id
                          }
                          className="group border-b border-[#dcdcde] px-3 py-3 transition hover:bg-[#f6f7f7]"
                        >

                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[70px_minmax(0,1fr)_110px_140px_96px] lg:items-center lg:gap-4">

                            {/* GRADE */}

                            <div className="flex items-center gap-2 lg:block">

                              <span className="text-sm text-[#646970] lg:hidden">
                                Tingkat
                              </span>

                              <span className="text-base font-semibold text-slate-600">
                                Kelas{' '}
                                {
                                  cls.grade
                                }
                              </span>

                            </div>

                            {/* NAME */}

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">

                                <School
                                  size={14}
                                />

                              </div>

                              <div className="min-w-0">

                                <div className="truncate text-sm font-semibold text-[#1d2327]">
                                  {
                                    cls.name
                                  }
                                </div>

                                <div className="mt-0.5 text-sm text-[#646970]">
                                  SD
                                  {' · '}
                                  Kelas{' '}
                                  {
                                    cls.grade
                                  }
                                </div>

                              </div>

                            </div>

                            {/* STATUS */}

                            <div className="flex items-center gap-2">

                              <span
                                className={[
                                  'h-1.5 w-1.5 rounded-full',
                                  active
                                    ? 'bg-emerald-500'
                                    : 'bg-slate-300',
                                ].join(
                                  ' '
                                )}
                              />

                              <span
                                className={[
                                  'text-sm font-medium',
                                  active
                                    ? 'text-emerald-700'
                                    : 'text-[#646970]',
                                ].join(
                                  ' '
                                )}
                              >
                                {active
                                  ? 'Aktif'
                                  : 'Tidak Aktif'}
                              </span>

                            </div>

                            {/* STUDENT */}

                            <div className="flex items-center gap-1.5 text-sm text-[#646970]">

                              <Users
                                size={13}
                              />

                              <span>
                                {cls.student_count ?? 0} siswa
                              </span>

                            </div>

                            {/* ACTION */}

                            <div className="flex items-center justify-start gap-1 sm:justify-end">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    cls
                                  )
                                }
                                disabled={
                                  deleting ||
                                  deletingAll
                                }
                                title="Edit kelas"
                                className="flex h-10 w-10 items-center justify-center rounded-sm text-[#646970] transition hover:bg-[#f0f6fc] hover:text-[#2271b1] disabled:cursor-not-allowed disabled:opacity-40"
                              >

                                <Edit3
                                  size={13}
                                />

                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(
                                    cls
                                  )
                                }
                                disabled={
                                  deleting ||
                                  deletingAll
                                }
                                title="Hapus kelas"
                                className="flex h-10 w-10 items-center justify-center rounded-sm text-[#646970] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                              >

                                {deleting ? (
                                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-red-500" />
                                ) : (
                                  <Trash2
                                    size={13}
                                  />
                                )}

                              </button>

                            </div>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>

              </div>
            )}

          </section>

        </div>

      </main>


    </div>
  );
}