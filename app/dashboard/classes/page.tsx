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
    <div className="min-h-screen bg-[#f7f9f8] text-slate-800">

      {/* ================================================================== */}
      {/* HEADER */}
      {/* ================================================================== */}

      <header className="border-b border-slate-200/80 bg-white">

        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            {/* TITLE */}

            <div>

              <div className="mb-2.5 flex items-center gap-2">

                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">

                  <School
                    size={13}
                    strokeWidth={1.8}
                  />

                </span>

                <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-700">
                  Data Master
                </span>

                <span className="text-slate-300">
                  /
                </span>

                <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-400">
                  Struktur Akademik
                </span>

              </div>

              <h1 className="text-[23px] font-semibold tracking-tight text-slate-900 sm:text-[27px]">
                Manajemen Kelas
              </h1>

              <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                Kelola struktur kelas siswa {SCHOOL_NAME} untuk tingkat 1 sampai 6.
              </p>

            </div>

            {/* SUMMARY */}

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-4 lg:border-0 lg:pt-0">

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <Layers3
                    size={15}
                  />
                </div>

                <div>

                  <div className="text-base font-semibold text-slate-800">
                    {
                      classes.length
                    }
                  </div>

                  <div className="text-[8px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    Total Kelas
                  </div>

                </div>

              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <School
                    size={15}
                  />
                </div>

                <div>

                  <div className="text-base font-semibold text-slate-800">
                    {
                      totalGrades
                    }
                  </div>

                  <div className="text-[8px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    Tingkat
                  </div>

                </div>

              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                  <CheckCircle2
                    size={15}
                  />
                </div>

                <div>

                  <div className="text-base font-semibold text-slate-800">
                    {
                      activeClasses
                    }
                  </div>

                  <div className="text-[8px] font-medium uppercase tracking-[0.14em] text-slate-400">
                    Aktif
                  </div>

                </div>

              </div>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              <div className="flex items-center gap-2.5">

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                  <BookOpen
                    size={15}
                  />
                </div>

                <div>

                  <div className="text-base font-semibold text-slate-800">
                    SD
                  </div>

                  <div className="text-[8px] font-medium uppercase tracking-[0.14em] text-slate-400">
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
              'mb-5 flex items-center gap-2 border-b px-1 pb-3 text-xs',
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[270px_minmax(0,1fr)]">

          {/* ============================================================= */}
          {/* FORM */}
          {/* ============================================================= */}

          <section className="lg:border-r lg:border-slate-200 lg:pr-7">

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

              <p className="mt-1 text-[11px] leading-5 text-slate-400">
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

                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
                  className="h-10 w-full border-b border-slate-200 bg-transparent px-0 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-600"
                />

              </div>

              {/* GRADE */}

              <div>

                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
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
                    className="h-10 w-full appearance-none border-b border-slate-200 bg-transparent px-0 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-600"
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
                    className="pointer-events-none absolute right-0 top-3 text-slate-400"
                  />

                </div>

              </div>

              {/* LEVEL */}

              <div>

                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500">
                  Jenjang
                </label>

                <div className="flex h-10 items-center justify-between border-b border-slate-200">

                  <span className="text-sm font-semibold text-emerald-700">
                    SD
                  </span>

                  <span className="text-[9px] text-slate-400">
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
                    'flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-semibold text-white shadow-sm transition',
                    editingId
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-[#07543f] hover:bg-[#064633]',
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
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
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

            <div className="mt-7 border-t border-slate-100 pt-5">

              <div className="flex gap-2.5">

                <BookOpen
                  size={14}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />

                <p className="text-[10px] leading-5 text-slate-400">
                  {SCHOOL_NAME} menggunakan jenjang{' '}
                  <strong className="text-slate-500">
                    SD
                  </strong>{' '}
                  dengan tingkat kelas{' '}
                  <strong className="text-slate-500">
                    1 sampai 6
                  </strong>.
                </p>

              </div>

            </div>

          </section>

          {/* ============================================================= */}
          {/* LIST */}
          {/* ============================================================= */}

          <section className="min-w-0">

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

                <p className="mt-1 text-[11px] text-slate-400">
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
                  className="inline-flex h-8 items-center justify-center gap-1.5 self-start border-b border-red-200 px-1 text-[10px] font-semibold text-red-500 transition hover:border-red-400 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
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
              <div className="border-y border-slate-200 py-14 text-center">

                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />

                <p className="mt-3 text-[11px] text-slate-400">
                  Memuat data kelas...
                </p>

              </div>
            ) : classes.length ===
              0 ? (
              /* EMPTY */

              <div className="border-y border-dashed border-slate-200 py-14 text-center">

                <School
                  size={30}
                  strokeWidth={1.3}
                  className="mx-auto mb-3 text-slate-300"
                />

                <p className="text-sm font-medium text-slate-500">
                  Belum ada kelas
                </p>

                <p className="mt-1 text-[11px] text-slate-400">
                  Tambahkan kelas menggunakan formulir di sebelah kiri.
                </p>

              </div>
            ) : (
              /* TABLE */

              <div>

                <div className="mb-2 flex items-center gap-3">

                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                    <School
                      size={13}
                    />
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                    SD
                  </span>

                  <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />

                  <span className="text-[10px] text-slate-400">
                    {
                      sortedClasses.length
                    }{' '}
                    kelas
                  </span>

                </div>

                {/* TABLE HEADER */}

                <div className="hidden grid-cols-[70px_1fr_110px_140px_76px] gap-4 border-b border-slate-200 px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-slate-400 sm:grid">

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
                          className="group border-b border-slate-100 px-3 py-3 transition hover:bg-emerald-50/30"
                        >

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[70px_1fr_110px_140px_76px] sm:items-center sm:gap-4">

                            {/* GRADE */}

                            <div className="flex items-center gap-2 sm:block">

                              <span className="text-[9px] text-slate-400 sm:hidden">
                                Tingkat
                              </span>

                              <span className="text-xs font-semibold text-slate-600">
                                Kelas{' '}
                                {
                                  cls.grade
                                }
                              </span>

                            </div>

                            {/* NAME */}

                            <div className="flex min-w-0 items-center gap-3">

                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-100">

                                <School
                                  size={14}
                                />

                              </div>

                              <div className="min-w-0">

                                <div className="truncate text-sm font-semibold text-slate-800">
                                  {
                                    cls.name
                                  }
                                </div>

                                <div className="mt-0.5 text-[9px] text-slate-400">
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
                                  'text-[10px] font-medium',
                                  active
                                    ? 'text-emerald-700'
                                    : 'text-slate-400',
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

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">

                              <Users
                                size={13}
                              />

                              <span>
                                Belum ditentukan
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
                                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-40"
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
                                className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
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

      {/* ACCENT */}

      <div className="pointer-events-none fixed bottom-0 right-0 -z-0 hidden h-72 w-72 overflow-hidden opacity-[0.025] lg:block">

        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full border-[16px] border-emerald-800" />

        <div className="absolute -bottom-12 -right-12 h-56 w-56 rounded-full border-[8px] border-emerald-800" />

        <div className="absolute bottom-16 right-16 h-24 w-24 rotate-45 border border-emerald-800" />

      </div>

    </div>
  );
}