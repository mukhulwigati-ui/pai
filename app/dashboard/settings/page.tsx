'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Save,
  School,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
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

/* ============================================================
   TYPES
============================================================ */

type MessageType =
  | 'success'
  | 'error'
  | '';

type SettingsData = {
  id?: number;

  schoolName: string;

  academicYear: string;

  semester: string;

  principalName: string;
};

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

const DEFAULT_SETTINGS: SettingsData =
  {
    schoolName:
      SCHOOL_NAME,

    academicYear:
      '',

    semester:
      'Ganjil',

    principalName:
      '',
  };

/* ============================================================
   HELPERS
============================================================ */

function normalizeText(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeAcademicYear(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, '');
}

function isValidAcademicYear(
  value: string
): boolean {
  /*
   * Format:
   * 2026/2027
   */
  const match =
    value.match(
      /^(\d{4})\/(\d{4})$/
    );

  if (!match) {
    return false;
  }

  const firstYear =
    Number(
      match[1]
    );

  const secondYear =
    Number(
      match[2]
    );

  if (
    !Number.isInteger(
      firstYear
    ) ||
    !Number.isInteger(
      secondYear
    )
  ) {
    return false;
  }

  /*
   * Tahun ajaran harus berurutan:
   * 2026/2027
   * 2027/2028
   * dst.
   */
  return (
    secondYear ===
    firstYear + 1
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

export default function SettingsPage() {
  /* ==========================================================
     FORM STATE
  ========================================================== */

  const [
    schoolName,
    setSchoolName,
  ] =
    useState(
      DEFAULT_SETTINGS.schoolName
    );

  const [
    academicYear,
    setAcademicYear,
  ] =
    useState(
      DEFAULT_SETTINGS.academicYear
    );

  const [
    semester,
    setSemester,
  ] =
    useState(
      DEFAULT_SETTINGS.semester
    );

  const [
    principalName,
    setPrincipalName,
  ] =
    useState(
      DEFAULT_SETTINGS.principalName
    );

  /* ==========================================================
     MESSAGE
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

  const messageTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  /* ==========================================================
     LOADING
  ========================================================== */

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  /* ==========================================================
     MESSAGE HELPER
  ========================================================== */

  const showMessage =
    useCallback(
      (
        text: string,
        type: MessageType =
          'success'
      ) => {
        if (
          messageTimerRef.current
        ) {
          clearTimeout(
            messageTimerRef.current
          );
        }

        setMessage(
          text
        );

        setMessageType(
          type
        );

        messageTimerRef.current =
          setTimeout(
            () => {
              setMessage(
                ''
              );

              setMessageType(
                ''
              );

              messageTimerRef.current =
                null;
            },
            5000
          );
      },
      []
    );

  /* ==========================================================
     CLEANUP TIMER
  ========================================================== */

  useEffect(() => {
    return () => {
      if (
        messageTimerRef.current
      ) {
        clearTimeout(
          messageTimerRef.current
        );
      }
    };
  }, []);

  /* ==========================================================
     LOAD SETTINGS
  ========================================================== */

  const loadSettings =
    useCallback(
      async () => {
        setLoading(
          true
        );

        try {
          const response =
            await fetch(
              '/api/settings',
              {
                method:
                  'GET',

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
                'Gagal memuat pengaturan sistem.'
              )
            );
          }

          const result =
            await response.json();

          /*
           * API diharapkan:
           *
           * {
           *   success: true,
           *   data: {
           *     schoolName,
           *     academicYear,
           *     semester,
           *     principalName
           *   }
           * }
           */

          const data =
            (
              result?.data ||
              result ||
              DEFAULT_SETTINGS
            ) as Partial<SettingsData>;

          setSchoolName(
            normalizeText(
              data.schoolName
            ) ||
              SCHOOL_NAME
          );

          setAcademicYear(
            normalizeAcademicYear(
              data.academicYear
            )
          );

          setSemester(
            data.semester ===
              'Genap'
              ? 'Genap'
              : 'Ganjil'
          );

          setPrincipalName(
            normalizeText(
              data.principalName
            )
          );
        } catch (
          error
        ) {
          console.error(
            '[LOAD_SETTINGS_ERROR]',
            error
          );

          /*
           * Tetap gunakan nama SDIT
           * sebagai fallback.
           */
          setSchoolName(
            SCHOOL_NAME
          );

          showMessage(
            error instanceof
              Error
              ? error.message
              : 'Gagal memuat pengaturan sistem.',
            'error'
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        showMessage,
      ]
    );

  /* ==========================================================
     INITIAL LOAD
  ========================================================== */

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  /* ==========================================================
     SAVE SETTINGS
  ========================================================== */

  const handleSubmit =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const cleanSchoolName =
        normalizeText(
          schoolName
        );

      const cleanAcademicYear =
        normalizeAcademicYear(
          academicYear
        );

      const cleanPrincipalName =
        normalizeText(
          principalName
        );

      /* ------------------------------------------------------
         SCHOOL
      ------------------------------------------------------ */

      if (
        !cleanSchoolName
      ) {
        showMessage(
          'Nama sekolah wajib diisi.',
          'error'
        );

        return;
      }

      /* ------------------------------------------------------
         ACADEMIC YEAR
      ------------------------------------------------------ */

      if (
        !cleanAcademicYear
      ) {
        showMessage(
          'Tahun ajaran wajib diisi.',
          'error'
        );

        return;
      }

      if (
        !isValidAcademicYear(
          cleanAcademicYear
        )
      ) {
        showMessage(
          'Format tahun ajaran tidak valid. Gunakan format seperti 2026/2027.',
          'error'
        );

        return;
      }

      /* ------------------------------------------------------
         SEMESTER
      ------------------------------------------------------ */

      if (
        ![
          'Ganjil',
          'Genap',
        ].includes(
          semester
        )
      ) {
        showMessage(
          'Semester harus Ganjil atau Genap.',
          'error'
        );

        return;
      }

      /* ------------------------------------------------------
         PRINCIPAL
      ------------------------------------------------------ */

      if (
        !cleanPrincipalName
      ) {
        showMessage(
          'Nama kepala sekolah wajib diisi.',
          'error'
        );

        return;
      }

      /* ------------------------------------------------------
         SAVE
      ------------------------------------------------------ */

      setSaving(
        true
      );

      setMessage(
        ''
      );

      setMessageType(
        ''
      );

      try {
        const response =
          await fetch(
            '/api/settings',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json',
              },

              cache:
                'no-store',

              body:
                JSON.stringify(
                  {
                    schoolName:
                      cleanSchoolName,

                    academicYear:
                      cleanAcademicYear,

                    semester,

                    principalName:
                      cleanPrincipalName,
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
              'Gagal menyimpan pengaturan.'
            )
          );
        }

        const result =
          await response.json();

        /*
         * Sinkronkan state dengan
         * data yang benar-benar tersimpan.
         */
        if (
          result?.data
        ) {
          setSchoolName(
            normalizeText(
              result.data
                .schoolName
            ) ||
              cleanSchoolName
          );

          setAcademicYear(
            normalizeAcademicYear(
              result.data
                .academicYear
            ) ||
              cleanAcademicYear
          );

          setSemester(
            result.data
              .semester ===
              'Genap'
              ? 'Genap'
              : 'Ganjil'
          );

          setPrincipalName(
            normalizeText(
              result.data
                .principalName
            ) ||
              cleanPrincipalName
          );
        } else {
          setSchoolName(
            cleanSchoolName
          );

          setAcademicYear(
            cleanAcademicYear
          );

          setPrincipalName(
            cleanPrincipalName
          );
        }

        showMessage(
          'Pengaturan sistem berhasil disimpan.',
          'success'
        );
      } catch (
        error
      ) {
        console.error(
          '[SAVE_SETTINGS_ERROR]',
          error
        );

        showMessage(
          error instanceof
            Error
            ? error.message
            : 'Gagal menyimpan pengaturan sistem.',
          'error'
        );
      } finally {
        setSaving(
          false
        );
      }
    };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="min-h-screen bg-[#f0f0f1]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-normal text-[#1d2327] sm:text-3xl">Pengaturan Sistem</h1>
          <p className="mt-2 text-base text-[#646970]">Atur identitas sekolah, tahun ajaran, dan semester aktif.</p>
        </header>

        {message && (
          <div
            className={[
              'mb-6 flex items-start gap-3 rounded-sm border px-4 py-3.5',

              messageType ===
              'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700',
            ].join(
              ' '
            )}
          >

            <div className="mt-0.5 shrink-0">

              {messageType ===
              'success' ? (
                <CheckCircle2
                  size={17}
                  strokeWidth={
                    1.8
                  }
                />
              ) : (
                <AlertCircle
                  size={17}
                  strokeWidth={
                    1.8
                  }
                />
              )}

            </div>

            <div className="text-sm font-medium">
              {message}
            </div>

          </div>
        )}

        {/* ====================================================
            LOADING
        ===================================================== */}

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center rounded-sm border border-[#c3c4c7] bg-white">

            <div className="flex flex-col items-center">

              <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-700" />

              <p className="mt-3 text-base font-medium text-[#646970]">
                Memuat pengaturan...
              </p>

            </div>

          </div>
        ) : (
          /* ==================================================
             FORM
          ================================================== */

          <form
            onSubmit={
              handleSubmit
            }
          >

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_290px]">

              {/* ==============================================
                  LEFT
              =============================================== */}

              <div className="overflow-hidden rounded-sm border border-[#c3c4c7] bg-white">

                {/* HEADER */}

                <div className="border-b border-[#c3c4c7] px-5 py-5 sm:px-6">

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50">

                      <School
                        size={19}
                        strokeWidth={
                          1.7
                        }
                        className="text-[#2271b1]"
                      />

                    </div>

                    <div>

                      <h2 className="text-sm font-bold text-[#1d2327]">
                        Identitas Sekolah
                      </h2>

                      <p className="mt-0.5 text-sm text-[#646970]">
                        Informasi utama sekolah untuk sistem dan dokumen rapor.
                      </p>

                    </div>

                  </div>

                </div>

                {/* BODY */}

                <div className="space-y-5 p-5 sm:p-6">

                  {/* SCHOOL */}

                  <div>

                    <label className="mb-2 block text-sm font-semibold text-[#646970]">
                      Nama Sekolah
                    </label>

                    <div className="relative">

                      <School
                        size={16}
                        strokeWidth={
                          1.7
                        }
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#646970]"
                      />

                      <input
                        type="text"
                        value={
                          schoolName
                        }
                        onChange={(
                          event
                        ) =>
                          setSchoolName(
                            event.target
                              .value
                          )
                        }
                        required
                        maxLength={
                          200
                        }
                        placeholder={
                          SCHOOL_NAME
                        }
                        className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-[#f6f7f7] pl-10 pr-4 text-base text-[#1d2327] outline-none transition placeholder:text-[#646970] hover:border-[#c3c4c7] focus:border-[#2271b1] focus:bg-white focus:ring-2 focus:ring-[#2271b1]/20"
                      />

                    </div>

                    <p className="mt-1.5 text-sm text-[#646970]">
                      Nama sekolah ini digunakan pada halaman sistem dan dokumen rapor siswa.
                    </p>

                  </div>

                  {/* ============================================
                      AKADEMIK
                  ============================================= */}

                  <div className="border-t border-[#c3c4c7] pt-5">

                    <div className="mb-4 flex items-center gap-2">

                      <CalendarDays
                        size={16}
                        strokeWidth={
                          1.7
                        }
                        className="text-[#2271b1]"
                      />

                      <span className="text-base font-bold text-[#1d2327]">
                        Konfigurasi Akademik
                      </span>

                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                      {/* YEAR */}

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-[#646970]">
                          Tahun Ajaran Aktif
                        </label>

                        <div className="relative">

                          <CalendarDays
                            size={15}
                            strokeWidth={
                              1.7
                            }
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#646970]"
                          />

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
                            required
                            maxLength={
                              9
                            }
                            inputMode="numeric"
                            placeholder="2026/2027"
                            className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-[#f6f7f7] pl-10 pr-4 text-base text-[#1d2327] outline-none transition placeholder:text-[#646970] hover:border-[#c3c4c7] focus:border-[#2271b1] focus:bg-white focus:ring-2 focus:ring-[#2271b1]/20"
                          />

                        </div>

                        <p className="mt-1.5 text-sm text-[#646970]">
                          Format: 2026/2027
                        </p>

                      </div>

                      {/* SEMESTER */}

                      <div>

                        <label className="mb-2 block text-sm font-semibold text-[#646970]">
                          Semester Aktif
                        </label>

                        <div className="relative">

                          <BookOpen
                            size={15}
                            strokeWidth={
                              1.7
                            }
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#646970]"
                          />

                          <select
                            value={
                              semester
                            }
                            onChange={(
                              event
                            ) =>
                              setSemester(
                                event.target
                                  .value
                              )
                            }
                            className="h-11 w-full appearance-none rounded-sm border border-[#c3c4c7] bg-[#f6f7f7] pl-10 pr-9 text-base text-[#1d2327] outline-none transition hover:border-[#c3c4c7] focus:border-[#2271b1] focus:bg-white focus:ring-2 focus:ring-[#2271b1]/20"
                          >

                            <option value="Ganjil">
                              Semester Ganjil
                            </option>

                            <option value="Genap">
                              Semester Genap
                            </option>

                          </select>

                          <svg
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#646970]"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>

                        </div>

                      </div>

                    </div>

                  </div>

                  {/* ============================================
                      PRINCIPAL
                  ============================================= */}

                  <div className="border-t border-[#c3c4c7] pt-5">

                    <div className="mb-4 flex items-center gap-2">

                      <UserRound
                        size={16}
                        strokeWidth={
                          1.7
                        }
                        className="text-[#2271b1]"
                      />

                      <span className="text-base font-bold text-[#1d2327]">
                        Kepala Sekolah
                      </span>

                    </div>

                    <label className="mb-2 block text-sm font-semibold text-[#646970]">
                      Nama Kepala Sekolah
                    </label>

                    <div className="relative">

                      <UserRound
                        size={16}
                        strokeWidth={
                          1.7
                        }
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#646970]"
                      />

                      <input
                        type="text"
                        value={
                          principalName
                        }
                        onChange={(
                          event
                        ) =>
                          setPrincipalName(
                            event.target
                              .value
                          )
                        }
                        required
                        maxLength={
                          150
                        }
                        placeholder="Masukkan nama kepala sekolah"
                        className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-[#f6f7f7] pl-10 pr-4 text-base text-[#1d2327] outline-none transition placeholder:text-[#646970] hover:border-[#c3c4c7] focus:border-[#2271b1] focus:bg-white focus:ring-2 focus:ring-[#2271b1]/20"
                      />

                    </div>

                    <p className="mt-1.5 text-sm text-[#646970]">
                      Nama ini dapat digunakan untuk identitas dan tanda tangan kepala sekolah pada rapor.
                    </p>

                  </div>

                </div>

                {/* FOOTER */}

                <div className="flex flex-col gap-3 border-t border-[#c3c4c7] bg-[#f6f7f7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

                  <div className="flex items-center gap-2">

                    <ShieldCheck
                      size={15}
                      strokeWidth={
                        1.7
                      }
                      className="text-[#2271b1]"
                    />

                    <span className="text-sm text-[#646970]">
                      Data tersimpan secara permanen di database.
                    </span>

                  </div>

                  <button
                    type="submit"
                    disabled={
                      saving
                    }
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-sm bg-[#2271b1] px-5 text-base font-semibold text-white transition hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    {saving ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

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

                        Simpan Pengaturan
                      </>
                    )}

                  </button>

                </div>

              </div>

              {/* ==============================================
                  RIGHT SIDEBAR
              =============================================== */}

              <div className="space-y-5">

                {/* PREVIEW */}

                <div className="overflow-hidden rounded-sm border border-[#c3c4c7] bg-white">

                  <div className="border-b border-[#dcdcde] bg-[#f6f7f7] px-5 py-5">

                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-sm border border-[#c3c4c7] bg-white">

                      <School
                        size={20}
                        strokeWidth={
                          1.6
                        }
                        className="text-[#646970]"
                      />

                    </div>

                    <div className="text-sm font-semibold text-[#646970]">
                      Identitas Sekolah
                    </div>

                    <div className="mt-1 break-words text-sm font-semibold leading-relaxed text-[#1d2327]">
                      {schoolName ||
                        SCHOOL_NAME}
                    </div>

                    <div className="mt-2 inline-flex rounded-full bg-white px-2 py-1 text-sm font-semibold text-[#646970]">
                      Jenjang SD
                    </div>

                  </div>

                  <div className="space-y-4 p-5">

                    <div>

                      <div className="text-sm font-semibold text-[#646970]">
                        Tahun Ajaran
                      </div>

                      <div className="mt-1 text-base font-semibold text-[#1d2327]">
                        {academicYear ||
                          'Belum diatur'}
                      </div>

                    </div>

                    <div className="h-px bg-[#f6f7f7]" />

                    <div>

                      <div className="text-sm font-semibold text-[#646970]">
                        Semester
                      </div>

                      <div className="mt-1 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-[#2271b1]">
                        {semester}
                      </div>

                    </div>

                    <div className="h-px bg-[#f6f7f7]" />

                    <div>

                      <div className="text-sm font-semibold text-[#646970]">
                        Kepala Sekolah
                      </div>

                      <div className="mt-1 break-words text-base font-semibold text-[#1d2327]">
                        {principalName ||
                          'Belum diatur'}
                      </div>

                    </div>

                  </div>

                </div>

                {/* TIP */}

                <div className="rounded-sm border border-[#c3c4c7] bg-white p-5">

                  <div className="flex items-start gap-3">

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-amber-100">

                      <Sparkles
                        size={16}
                        strokeWidth={
                          1.7
                        }
                        className="text-amber-600"
                      />

                    </div>

                    <div>

                      <h3 className="text-base font-bold text-[#1d2327]">
                        Catatan
                      </h3>

                      <p className="mt-1.5 text-sm leading-relaxed text-[#646970]">
                        Periksa pengaturan sebelum mencetak rapor.
                      </p>

                    </div>

                  </div>

                </div>


              </div>

            </div>

          </form>
        )}

        {/* ====================================================
            FOOTER
        ===================================================== */}

        <footer className="mt-6 flex flex-col items-center justify-between gap-2 border-t border-[#c3c4c7] pt-4 text-sm text-[#646970] sm:flex-row">

          <span>
            Sistem Akademik · {SCHOOL_SHORT_NAME}
          </span>

          <span>
            Jenjang Sekolah Dasar
          </span>

        </footer>

      </div>

    </div>
  );
}