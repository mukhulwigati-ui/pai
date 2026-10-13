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
  const [preparingTahfidz, setPreparingTahfidz] = useState(false);
  const [targetMessage, setTargetMessage] = useState('');
  async function prepareTahfidzTargets() {
    if (preparingTahfidz || loading || loadingData || mutationBusy.current) return;
    setPreparingTahfidz(true); setTargetMessage('');
    mutationBusy.current = true;
    try {
      const response = await fetch('/api/tahfidz/targets', { method: 'POST' });
      if (response.redirected || !response.headers.get('content-type')?.includes('application/json')) throw new Error(response.status === 404 ? 'API target Tahfidz belum terpasang. Pastikan app/api/tahfidz/targets/route.ts sudah dideploy.' : `Server mengembalikan halaman, bukan data target (HTTP ${response.status}). Periksa sesi login dan endpoint target Tahfidz.`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menyiapkan target.');
      setTargetMessage(result.message);
      const refreshed = await fetch('/api/curriculum', { cache: 'no-store' });
      const data = await refreshed.json();
      if (!refreshed.ok || !data.success || !Array.isArray(data.data)) throw new Error('Target tersimpan. Muat ulang halaman untuk melihat kurikulum.');
      setCps(data.data);
    } catch (error) { setTargetMessage(error instanceof Error ? error.message : 'Gagal memproses target.'); }
    finally { mutationBusy.current = false; setPreparingTahfidz(false); }
  }
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

  const tahfidz = selectedSubject?.name.trim().toLowerCase() === "tahfidz al qur'an";
  const disabled = loading || loadingData || preparingTahfidz;
  const control = 'mt-2 w-full rounded-sm border border-[#8c8f94] bg-white px-3 py-2.5 text-base disabled:opacity-50';
  return (
    <main className="min-h-screen bg-[#f0f0f1] p-4 text-[#1d2327] sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="text-2xl font-semibold">Materi Pembelajaran</h1><p className="mt-2 text-[#646970]">Lihat dan kelola materi yang digunakan untuk penilaian.</p></div>
          <a href="/dashboard/assessment" className="rounded-sm bg-[#2271b1] px-4 py-2.5 font-semibold text-white">Buka Input Asesmen</a>
        </header>
        <section className="border border-[#c3c4c7] bg-white p-5">
          <h2 className="mb-4 font-semibold">Pilih materi yang ingin dilihat</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="font-semibold">1. Mata pelajaran<select disabled={disabled} className={control} value={selectedSubject?.id ?? ''} onChange={event => { const subject = subjects.find(item => item.id === Number(event.target.value)); if (subject) handleSelectSubject(subject); else handleBack(); }}><option value="">Pilih mata pelajaran</option>{subjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
            <label className="font-semibold">2. {gradeLabel}<select disabled={disabled || !selectedSubject} className={control} value={selectedGrade} onChange={event => handleGradeChange(Number(event.target.value))}>{gradeOptions.map(grade => <option key={grade} value={grade}>{formatGrade(grade, tartili)}</option>)}</select></label>
            <label className="font-semibold">3. Semester<select disabled={disabled || !selectedSubject} className={control} value={selectedSemester} onChange={event => handleSemesterChange(Number(event.target.value))}><option value={1}>Ganjil</option><option value={2}>Genap</option></select></label>
          </div>
        </section>
        {message && <p role="status" className={`border bg-white p-4 ${messageType === 'error' ? 'border-red-300 text-red-700' : 'border-[#c3c4c7]'}`}>{message}</p>}
        {loadingData ? <p role="status">Memuat materi...</p> : !selectedSubject ? <section className="border bg-white p-6 text-center">Pilih mata pelajaran untuk melihat daftar materinya.</section> : <>
          <section className="space-y-4">
            <div><h2 className="text-xl font-semibold">{selectedSubject.name} — {selectedGradeLabel}</h2><p className="mt-1 text-[#646970]">Semester {selectedSemester === 1 ? 'Ganjil' : 'Genap'} • {currentSubjectCPs.length} capaian pembelajaran • {currentSubjectCPs.reduce((count, cp) => count + (cp.tps?.length ?? 0), 0)} {tahfidz ? 'target surah' : 'tujuan pembelajaran'}</p></div>
            {!currentSubjectCPs.length && <div className="border bg-white p-5">Belum ada materi untuk pilihan ini. {tahfidz ? 'Buka Pengaturan Materi di bawah, lalu klik Siapkan Target Hafalan.' : 'Tambahkan capaian dan tujuan pembelajaran melalui Pengaturan Materi di bawah.'}</div>}
            {currentSubjectCPs.map((cp, index) => <article key={cp.id} className="border border-[#c3c4c7] bg-white p-5">
              <h3 className="font-semibold">{tahfidz ? (selectedGrade === 6 ? 'Target Murajaah' : 'Target Hafalan') : `Materi ${index + 1}`}</h3>
              <details className="mt-2"><summary className="cursor-pointer text-sm text-[#2271b1]">Lihat capaian pembelajaran (CP)</summary><p className="mt-2 leading-relaxed">{cp.description}</p><p className="mt-1 text-sm text-[#646970]">{cp.code}</p></details>
              <h4 className="mb-2 mt-4 font-semibold">{tahfidz ? 'Daftar surah yang dinilai' : 'Tujuan pembelajaran yang dinilai'}</h4>
              {cp.tps?.length ? <ol className="divide-y border-t">{cp.tps.map((tp, tpIndex) => <li key={tp.id} className="flex gap-3 py-3"><span className="w-7 shrink-0 text-[#646970]">{tpIndex + 1}.</span><span className="leading-relaxed">{tp.description}</span></li>)}</ol> : <p className="text-[#646970]">Tujuan pembelajaran belum ditambahkan.</p>}
            </article>)}
          </section>
          <details className="border border-[#c3c4c7] bg-white p-5">
            <summary className="cursor-pointer font-semibold">Pengaturan Materi — tambah atau hapus CP/TP</summary>
            <div className="mt-4 space-y-5">
              <p className="text-sm text-[#646970]">Bagian ini untuk mengubah materi. Pengisian nilai dilakukan melalui Input Asesmen.</p>
              {tahfidz && <section className="space-y-3 border bg-[#f6f7f7] p-4"><h3 className="font-semibold">Target hafalan sekolah</h3><p>Kelas 1–3: Juz 30 mulai An-Naba’. Kelas 4–5: Juz 29. Kelas 6: murajaah kedua juz.</p><button type="button" disabled={disabled} onClick={() => void prepareTahfidzTargets()} className="rounded-sm bg-[#2271b1] px-4 py-2 text-white disabled:opacity-50">{preparingTahfidz ? 'Menyiapkan...' : 'Siapkan Target Hafalan Kelas 1–6'}</button>{targetMessage && <p role="status">{targetMessage}</p>}</section>}
              <form onSubmit={handleSaveCP} className="space-y-3 border p-4"><h3 className="font-semibold">Tambah Capaian Pembelajaran (CP)</h3><p className="text-sm">{selectedSubject.name} • {selectedGradeLabel} • {selectedSemester === 1 ? 'Ganjil' : 'Genap'}</p><textarea aria-label="Deskripsi CP" required maxLength={5000} disabled={disabled} rows={3} value={cpDesc} onChange={event => setCpDesc(event.target.value)} className={control} placeholder="Tuliskan capaian pembelajaran" /><button disabled={disabled || !cpDesc.trim()} className="rounded-sm bg-[#2271b1] px-4 py-2 text-white disabled:opacity-50">Simpan CP</button></form>
              {currentSubjectCPs.map(cp => <details key={cp.id} className="border p-4"><summary className="cursor-pointer font-semibold">Kelola {cp.code}</summary><div className="mt-3 space-y-3"><p>{cp.description}</p><button type="button" disabled={disabled} onClick={() => void handleDelete(cp.id, 'CP')} className="text-sm text-red-700 underline">Hapus CP</button><ul className="divide-y">{cp.tps?.map(tp => <li key={tp.id} className="flex items-start justify-between gap-3 py-2"><span>{tp.description}</span><button type="button" disabled={disabled} onClick={() => void handleDelete(tp.id, 'TP')} className="shrink-0 text-sm text-red-700 underline">Hapus TP</button></li>)}</ul><button type="button" disabled={disabled} onClick={() => { setActiveCpIdForTp(cp.id); setTpDesc(''); }} className="text-[#2271b1] underline">Tambah {tahfidz ? 'Target Surah (TP)' : 'Tujuan Pembelajaran (TP)'}</button>{activeCpIdForTp === cp.id && <form onSubmit={event => { event.preventDefault(); void handleSaveTP(cp.id); }} className="space-y-2"><textarea aria-label="Deskripsi TP" required maxLength={2000} disabled={disabled} rows={3} className={control} value={tpDesc} onChange={event => setTpDesc(event.target.value)} placeholder="Tuliskan tujuan pembelajaran" /><button disabled={disabled || !tpDesc.trim()} className="rounded-sm bg-[#2271b1] px-4 py-2 text-white disabled:opacity-50">Simpan TP</button></form>}</div></details>)}
            </div>
          </details>
        </>}
      </div>
    </main>
  );
}
