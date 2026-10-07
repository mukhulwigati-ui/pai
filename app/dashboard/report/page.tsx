'use client';

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  BookOpen,
  ChevronDown,
  Loader2,
  Printer,
  RefreshCw,
  UserRound,
} from 'lucide-react';

/* ============================================================
   KONFIGURASI SEKOLAH
============================================================ */

const SCHOOL_NAME =
  'Sekolah Dasar Islam Terpadu Khoiro Ummah';

const SCHOOL_SHORT_NAME =
  'SDIT Khoiro Ummah';

const SCHOOL_LEVEL = 'SD';

const VALID_GRADES = [
  1,
  2,
  3,
  4,
  5,
  6,
];

/* ============================================================
   TYPES
============================================================ */

type Student = {
  id: number;
  nisn: string;
  fullname: string;
  gender: string;
  class_name: string;
};

type ClassRoom = {
  id: number;
  name: string;
  level?: string | null;
  grade?: number | null;
  status?: string | null;
};

type ScoreRecord = {
  id: number;
  score:
    | number
    | string
    | null;

  type: string;

  tpCode?: string | null;

  tpDescription?: string | null;

  subjectName: string;
};

type PersonalityRecord = {
  arabic: string;
  name: string;
  value: string | null;
};

type Attendance = {
  sakit: number;
  izin: number;
  alpa: number;
};

type ReportSettings = {
  schoolName?: string;
  academicYear?: string;
  semester?: string;
  principalName?: string;
  paiTeacherName?: string;
};

type ReportData = Student & {
  schoolName?: string;

  academicYear?: string;

  semester?: string;

  principalName?: string;
  paiTeacherName?: string;

  settings?: ReportSettings;

  scoreRecords?: ScoreRecord[];

  personality?: PersonalityRecord[];

  paiTeacherNote?: string | null;
  homeroomNote?: string | null; // Kompatibilitas API catatan lama.

  attendance?: Attendance | null;

  averageScore?: number | null;

  totalStudents?: number | null;

  rank?: number | null;
};

type SubjectDisplay = {
  name: string;
  arabic: string;
};

/* ============================================================
   ARABIC SUBJECT LABEL
============================================================ */

const SUBJECT_ARABIC_MAP:
  Record<string, string> = {
    'aqidah islamiyah':
      'العقيدة الإسلامية',

    aqidah:
      'العقيدة',

    akidah:
      'العقيدة',

    fikih:
      'الفقه',

    fiqih:
      'الفقه',

    siroh:
      'السيرة',

    'siroh nabawiyah':
      'السيرة النبوية',

    'sirah nabawiyah':
      'السيرة النبوية',

    'bahasa arab':
      'اللغة العربية',

    'tahfidz al quran':
      'تحفيظ القرآن',

    "tahfidz al qur'an":
      'تحفيظ القرآن',

    tahfidz:
      'تحفيظ القرآن',

    tahsin:
      'تحسين القراءة',

    tartili:
      'ترتيل القرآن',

    tajwid:
      'التجويد',

    hadis:
      'الحديث',

    hadits:
      'الحديث',

    'pendidikan agama islam':
      'التربية الإسلامية',
  };

/* ============================================================
   PERSONALITY
============================================================ */

const PERSONALITY_ASPECTS = [
  {
    arabic:
      'السلوك',

    name:
      'Perilaku & Akhlak',
  },

  {
    arabic:
      'المواظبة',

    name:
      'Konsistensi & Ketekunan',
  },

  {
    arabic:
      'النظافة',

    name:
      'Kebersihan & Kerapian',
  },

  {
    arabic:
      'الانضباط',

    name:
      'Disiplin & Tanggung Jawab',
  },
];

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
): string {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase()
    .replace(
      /[’‘`]/g,
      "'"
    )
    .replace(
      /\s+/g,
      ' '
    );
}

function normalizeScore(
  value: unknown
): number {
  const numberValue =
    Number(value);

  if (
    !Number.isFinite(
      numberValue
    )
  ) {
    return 0;
  }

  return Math.round(
    numberValue
  );
}

function isInactiveStatus(
  status?: string | null
) {
  const value =
    normalizeText(
      status
    );

  return (
    value ===
      'nonaktif' ||
    value ===
      'tidak aktif'
  );
}

/* ============================================================
   ASSESSMENT TYPE
============================================================ */

function normalizeType(
  value: unknown
): string {
  return normalizeText(
    value
  )
    .replace(
      /[_-]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    );
}

function typeMatches(
  databaseType: unknown,
  requestedType:
    | 'ORAL'
    | 'WRITTEN'
): boolean {
  const type =
    normalizeType(
      databaseType
    );

  if (
    requestedType ===
    'ORAL'
  ) {
    return [
      'oral',
      'lisan',
      'ujian lisan',
      'praktik',
      'praktek',
    ].some(
      (
        item
      ) =>
        type === item ||
        type.includes(
          item
        )
    );
  }

  return [
    'written',
    'tertulis',
    'ujian tertulis',
    'tulis',
  ].some(
    (
      item
    ) =>
      type === item ||
      type.includes(
        item
      )
  );
}

/* ============================================================
   SUBJECT
============================================================ */

function getSubjectArabic(
  subjectName: string
) {
  const normalized =
    normalizeText(
      subjectName
    );

  if (
    SUBJECT_ARABIC_MAP[
      normalized
    ]
  ) {
    return SUBJECT_ARABIC_MAP[
      normalized
    ];
  }

  /*
   * Coba pencocokan parsial.
   */
  for (
    const [
      key,
      arabic,
    ] of Object.entries(
      SUBJECT_ARABIC_MAP
    )
  ) {
    if (
      normalized.includes(
        key
      ) ||
      key.includes(
        normalized
      )
    ) {
      return arabic;
    }
  }

  return '—';
}

/* ============================================================
   PERSONALITY VALUE
============================================================ */

function getPersonalityValue(
  personality:
    | PersonalityRecord[]
    | undefined,
  aspectName: string,
  aspectArabic: string
): string {
  if (
    !personality ||
    personality.length ===
      0
  ) {
    return '-';
  }

  const found =
    personality.find(
      (
        item
      ) => {
        const itemName =
          normalizeText(
            item.name
          );

        const itemArabic =
          normalizeText(
            item.arabic
          );

        const targetName =
          normalizeText(
            aspectName
          );

        const targetArabic =
          normalizeText(
            aspectArabic
          );

        /*
         * Dukungan nama lama
         * dari database.
         */
        const aliases =
          (() => {
            if (
              targetName.includes(
                'perilaku'
              )
            ) {
              return [
                'kelakuan / perilaku',
                'perilaku & akhlak',
                'perilaku',
                'akhlak',
              ];
            }

            if (
              targetName.includes(
                'konsistensi'
              )
            ) {
              return [
                'kerajinan / kehadiran',
                'konsistensi & ketekunan',
                'kerajinan',
                'ketekunan',
              ];
            }

            if (
              targetName.includes(
                'kebersihan'
              )
            ) {
              return [
                'kebersihan',
                'kebersihan & kerapian',
              ];
            }

            if (
              targetName.includes(
                'disiplin'
              )
            ) {
              return [
                'disiplin',
                'disiplin & tanggung jawab',
              ];
            }

            return [];
          })();

        return (
          itemName ===
            targetName ||
          itemArabic ===
            targetArabic ||
          itemName.includes(
            targetName
          ) ||
          targetName.includes(
            itemName
          ) ||
          aliases.some(
            (
              alias
            ) =>
              itemName ===
                normalizeText(
                  alias
                ) ||
              itemName.includes(
                normalizeText(
                  alias
                )
              )
          )
        );
      }
    );

  if (
    !found ||
    !found.value ||
    !String(
      found.value
    ).trim()
  ) {
    return '-';
  }

  return String(found.value)
    .replace(/\bjeid\b/gi, 'Jayyid')
    .replace(/[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff]/g, '')
    .replace(/\(\s*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim() || '-';
}

/* ============================================================
   DESKRIPSI NILAI
============================================================ */

function getCompetencyDescriptions(
  subjectName: string,
  score: number
) {
  if (
    score <= 0
  ) {
    return {
      achieved:
        `Nilai ${subjectName} belum tersedia.`,
    };
  }

  if (
    score >= 90
  ) {
    return {
      achieved:
        `Siswa menunjukkan penguasaan kompetensi ${subjectName} dengan sangat baik.`,
    };
  }

  if (
    score >= 80
  ) {
    return {
      achieved:
        `Siswa mampu memahami dan menguasai materi utama ${subjectName} dengan baik.`,
    };
  }

  if (
    score >= 70
  ) {
    return {
      achieved:
        `Siswa telah menunjukkan pemahaman yang cukup baik terhadap kompetensi ${subjectName}.`,
    };
  }

  if (
    score >= 60
  ) {
    return {
      achieved:
        `Siswa mulai menguasai kompetensi dasar pada mata pelajaran ${subjectName}.`,
    };
  }

  return {
    achieved:
      `Penguasaan kompetensi ${subjectName} masih terbatas.`,
  };
}

/* ============================================================
   DESKRIPSI KEPRIBADIAN
============================================================ */

function getPersonalityDescription(
  aspectName: string,
  value: string
) {
  const normalized =
    normalizeText(
      value
    );

  if (
    !normalized ||
    normalized === '-'
  ) {
    return {
      achieved:
        `Penilaian aspek ${aspectName} belum diisi.`,
    };
  }

  if (
    normalized.includes(
      'mumtaz'
    ) ||
    normalized.includes(
      'sangat baik'
    )
  ) {
    return {
      achieved:
        `Siswa menunjukkan ${aspectName.toLowerCase()} yang sangat baik dan konsisten.`,
    };
  }

  if (
    normalized.includes(
      'jiddan'
    ) ||
    normalized.includes(
      'baik'
    )
  ) {
    return {
      achieved:
        `Siswa menunjukkan ${aspectName.toLowerCase()} yang baik dalam kegiatan sehari-hari.`,
    };
  }

  if (
    normalized.includes(
      'jeid'
    ) ||
    normalized.includes(
      'jayyid'
    ) ||
    normalized.includes(
      'maqbul'
    )
  ) {
    return {
      achieved:
        `Siswa memperoleh predikat ${value} pada aspek ${aspectName}.`,
    };
  }

  return {
    achieved:
      `Siswa memperoleh predikat ${value} pada aspek ${aspectName}.`,
  };
}

/* ============================================================
   REPORT SECTION
============================================================ */

function ReportSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="report-block mx-[10mm] mb-3">

      <div className="mb-1 flex items-center justify-between border-b-2 border-black pb-1">

        <div className="flex items-center gap-2">

          <h3 className="text-[16px] font-bold uppercase tracking-wide text-slate-800">
            {title}
          </h3>

        </div>

        

      </div>

      {children}

    </section>
  );
}

/* ============================================================
   PAGE
============================================================ */

export default function ReportPage() {
  const [teacherNameOverride, setTeacherNameOverride] = useState('');
  /* ==========================================================
     STATE
  ========================================================== */

  const [
    studentId,
    setStudentId,
  ] =
    useState('');

  const [
    classFilter,
    setClassFilter,
  ] =
    useState('');

  const [
    students,
    setStudents,
  ] =
    useState<Student[]>(
      []
    );

  const [
    classes,
    setClasses,
  ] =
    useState<ClassRoom[]>(
      []
    );

  const [
    reportData,
    setReportData,
  ] =
    useState<ReportData | null>(
      null
    );

  const [
    loadingStudents,
    setLoadingStudents,
  ] =
    useState(false);

  const [
    loadingReport,
    setLoadingReport,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');

  /* ==========================================================
     LOAD STUDENTS + CLASSES
  ========================================================== */

  useEffect(() => {
    let mounted =
      true;

    async function loadReferenceData() {
      try {
        setLoadingStudents(
          true
        );

        setError('');

        const [
          studentResponse,
          classResponse,
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
              '/api/classes',
              {
                cache:
                  'no-store',
              }
            ),
          ]);

        if (
          !studentResponse.ok
        ) {
          throw new Error(
            await getApiError(
              studentResponse,
              'Gagal mengambil data siswa.'
            )
          );
        }

        if (
          !classResponse.ok
        ) {
          throw new Error(
            await getApiError(
              classResponse,
              'Gagal mengambil data kelas.'
            )
          );
        }

        const [
          studentData,
          classData,
        ] =
          await Promise.all([
            studentResponse.json(),
            classResponse.json(),
          ]);

        const studentList =
          normalizeArray<Student>(
            studentData,
            [
              'students',
            ]
          );

        const classList =
          normalizeArray<ClassRoom>(
            classData,
            [
              'classes',
              'classRooms',
            ]
          );

        const sdClasses =
          classList
            .filter(
              (
                item
              ) =>
                (
                  !item.level ||
                  String(
                    item.level
                  )
                    .trim()
                    .toUpperCase() ===
                    SCHOOL_LEVEL
                ) &&
                VALID_GRADES.includes(
                  Number(
                    item.grade
                  )
                ) &&
                !isInactiveStatus(
                  item.status
                )
            )
            .sort(
              (
                a,
                b
              ) =>
                Number(
                  a.grade
                ) -
                  Number(
                    b.grade
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

        const validClassNames =
          new Set(
            sdClasses.map(
              (
                item
              ) =>
                item.name
            )
          );

        const sdStudents =
          studentList
            .filter(
              (
                student
              ) =>
                validClassNames.has(
                  student.class_name
                )
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

        if (
          mounted
        ) {
          setClasses(
            sdClasses
          );

          setStudents(
            sdStudents
          );
        }
      } catch (
        err
      ) {
        if (
          mounted
        ) {
          setStudents(
            []
          );

          setClasses(
            []
          );

          setError(
            err instanceof
              Error
              ? err.message
              : 'Gagal mengambil data siswa.'
          );
        }
      } finally {
        if (
          mounted
        ) {
          setLoadingStudents(
            false
          );
        }
      }
    }

    loadReferenceData();

    return () => {
      mounted =
        false;
    };
  }, []);

  /* ==========================================================
     FILTERED STUDENTS
  ========================================================== */

  const filteredStudents =
    useMemo(() => {
      if (
        !classFilter
      ) {
        return students;
      }

      return students.filter(
        (
          student
        ) =>
          student.class_name ===
          classFilter
      );
    }, [
      students,
      classFilter,
    ]);

  /* ==========================================================
     FETCH REPORT
  ========================================================== */

  const fetchReport =
    async (
      selectedId?: string
    ) => {
      const id =
        selectedId !==
        undefined
          ? selectedId
          : studentId;

      if (!id) {
        setError(
          'Silakan pilih siswa terlebih dahulu.'
        );

        return;
      }

      try {
        setLoadingReport(
          true
        );

        setError('');

        const response =
          await fetch(
            `/api/report?studentId=${encodeURIComponent(
              id
            )}&_=${Date.now()}`,
            {
              cache:
                'no-store',

              headers: {
                'Cache-Control':
                  'no-cache, no-store, must-revalidate',

                Pragma:
                  'no-cache',
              },
            }
          );

        const data =
          await response.json();

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              'Gagal memuat data rapor.'
          );
        }

        const report =
          data?.report ||
          data?.data ||
          null;

        if (!report) {
          throw new Error(
            'Data rapor siswa tidak ditemukan.'
          );
        }

        /*
         * Pastikan siswa memang berasal
         * dari salah satu kelas SD aktif.
         */
        const validClass =
          classes.some(
            (
              classRoom
            ) =>
              classRoom.name ===
              report.class_name
          );

        if (!validClass) {
          throw new Error(
            'Siswa tidak terdaftar pada kelas SD yang aktif.'
          );
        }

        setReportData(
          report
        );
      } catch (
        err
      ) {
        setReportData(
          null
        );

        setError(
          err instanceof
            Error
            ? err.message
            : 'Gagal memuat data rapor.'
        );
      } finally {
        setLoadingReport(
          false
        );
      }
    };

  /* ==========================================================
     STUDENT CHANGE
  ========================================================== */

  const handleStudentChange =
    (
      value: string
    ) => {
      setStudentId(
        value
      );

      setError('');

      if (!value) {
        setReportData(
          null
        );

        return;
      }

      fetchReport(
        value
      );
    };

  /* ==========================================================
     CLASS CHANGE
  ========================================================== */

  const handleClassChange =
    (
      value: string
    ) => {
      setClassFilter(
        value
      );

      setStudentId(
        ''
      );

      setReportData(
        null
      );

      setError(
        ''
      );
    };

  /* ==========================================================
     PRINT
  ========================================================== */

  const handlePrint =
    () => {
      if (
        !reportData
      ) {
        return;
      }

      window.print();
    };

  /* ==========================================================
     SCORE RECORDS
  ========================================================== */

  const scoreRecords =
    reportData?.scoreRecords ??
    [];

  /* ==========================================================
     SUBJECTS FROM REPORT
  ========================================================== */

  const reportSubjects =
    useMemo<
      SubjectDisplay[]
    >(() => {
      const subjectMap =
        new Map<
          string,
          SubjectDisplay
        >();

      for (
        const record of scoreRecords
      ) {
        const name =
          String(
            record.subjectName ??
              ''
          ).trim();

        if (!name) {
          continue;
        }

        const key =
          normalizeText(
            name
          );

        if (
          !subjectMap.has(
            key
          )
        ) {
          subjectMap.set(
            key,
            {
              name,

              arabic:
                getSubjectArabic(
                  name
                ),
            }
          );
        }
      }

      return Array.from(
        subjectMap.values()
      ).sort(
        (
          a,
          b
        ) =>
          a.name.localeCompare(
            b.name,
            'id'
          )
      );
    }, [
      scoreRecords,
    ]);

  /* ==========================================================
     ORAL SUBJECTS
  ========================================================== */

  const oralSubjects =
    useMemo(
      () =>
        reportSubjects.filter(
          (
            subject
          ) =>
            scoreRecords.some(
              (
                record
              ) =>
                normalizeText(
                  record.subjectName
                ) ===
                  normalizeText(
                    subject.name
                  ) &&
                typeMatches(
                  record.type,
                  'ORAL'
                )
            )
        ),
      [
        reportSubjects,
        scoreRecords,
      ]
    );

  /* ==========================================================
     WRITTEN SUBJECTS
  ========================================================== */

  const writtenSubjects =
    useMemo(
      () =>
        reportSubjects.filter(
          (
            subject
          ) =>
            scoreRecords.some(
              (
                record
              ) =>
                normalizeText(
                  record.subjectName
                ) ===
                  normalizeText(
                    subject.name
                  ) &&
                typeMatches(
                  record.type,
                  'WRITTEN'
                )
            )
        ),
      [
        reportSubjects,
        scoreRecords,
      ]
    );

  /* ==========================================================
     GET SCORE
  ========================================================== */

  const getScoreNumber =
    (
      subjectName: string,
      categoryType:
        | 'ORAL'
        | 'WRITTEN'
    ): number => {
      if (
        scoreRecords.length ===
        0
      ) {
        return 0;
      }

      /*
       * Dipertahankan kompatibel dengan
       * struktur API report yang ada:
       * ambil record yang cocok berdasarkan
       * subject + kategori.
       */
      const found =
        scoreRecords.find(
          (
            scoreItem
          ) =>
            typeMatches(
              scoreItem.type,
              categoryType
            ) &&
            normalizeText(
              scoreItem.subjectName
            ) ===
              normalizeText(
                subjectName
              )
        );

      return normalizeScore(
        found?.score
      );
    };

  /* ==========================================================
     ATTENDANCE / PERSONALITY
  ========================================================== */

  const personality =
    reportData?.personality ??
    [];

  /* ==========================================================
     SETTINGS
  ========================================================== */

  const schoolName =
    reportData?.schoolName ||
    reportData?.settings
      ?.schoolName ||
    SCHOOL_NAME;

  const academicYear =
    reportData?.academicYear ||
    reportData?.settings
      ?.academicYear ||
    '2026/2027';

  const semester =
    reportData?.semester ||
    reportData?.settings
      ?.semester ||
    'Ganjil';

  const paiTeacherName = teacherNameOverride.trim() ||
    reportData?.paiTeacherName?.trim() ||
    reportData?.settings?.paiTeacherName?.trim() || '';

  // Tampilkan hasil AI/catatan guru yang telah disimpan melalui /api/notes.
  // Jangan membuat ulang catatan dari template saat rapor dibuka.
  const paiTeacherNote =
    reportData?.paiTeacherNote?.trim() ||
    reportData?.homeroomNote?.trim() ||
    '';

  const principalName =
    reportData?.principalName ||
    reportData?.settings
      ?.principalName ||
    'Kepala Sekolah';

  /* ==========================================================
     SEMESTER
  ========================================================== */

  const normalizedSemester =
    normalizeText(
      semester
    );

  const isEvenSemester =
    normalizedSemester ===
      'genap' ||
    normalizedSemester ===
      '2' ||
    normalizedSemester.includes(
      'semester 2'
    );

  const semesterLabel =
    isEvenSemester
      ? 'Genap'
      : 'Ganjil';

  const semesterArabic =
    isEvenSemester
      ? 'الفصل الدراسي الثاني'
      : 'الفصل الدراسي الأول';

  /* ==========================================================
     CLASS
  ========================================================== */

  const reportClass =
    classes.find(
      (
        item
      ) =>
        item.name ===
        reportData?.class_name
    );

  const reportGrade =
    reportClass?.grade ??
    '-';

  /* ==========================================================
     DATE
  ========================================================== */

  const formattedPrintDate =
    new Intl.DateTimeFormat(
      'id-ID',
      {
        day:
          '2-digit',

        month:
          'long',

        year:
          'numeric',
      }
    ).format(
      new Date()
    );

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <>

      {/* ======================================================
          CONTROL PANEL
      ======================================================= */}

      <section className="control-panel print:hidden border-b border-[#dcdcde] bg-[#f0f0f1] text-[#1d2327]">

        <div className="mx-auto max-w-[1500px] px-5 py-4 lg:px-8">

          <header className="mb-5">
            <h1 className="text-2xl font-normal text-[#1d2327] sm:text-3xl">Rapor PAI</h1>
            <p className="mt-2 text-base text-[#646970]">Pilih kelas dan siswa untuk melihat atau mencetak rapor.</p>
          </header>

          <div className="mb-4 rounded-sm border border-[#c3c4c7] bg-white p-3">
            <label htmlFor="pai-teacher-name" className="mb-1.5 block text-sm font-bold text-[#646970]">
              Nama Guru PAI Penandatangan
            </label>
            <input
              id="pai-teacher-name"
              type="text"
              value={teacherNameOverride}
              onChange={(event) => setTeacherNameOverride(event.target.value)}
              placeholder={reportData?.paiTeacherName || reportData?.settings?.paiTeacherName || 'Masukkan nama lengkap guru PAI'}
              className="h-11 w-full rounded-sm border border-[#c3c4c7] bg-white px-3 text-base text-[#1d2327] outline-none focus:ring-2 focus:ring-[#2271b1]/20"
            />
            <p className="mt-2 text-sm text-[#646970]">
              Nama ini digunakan pada tanda tangan rapor yang dicetak. Isian manual berlaku selama halaman terbuka.
            </p>
          </div>

          <div className="rounded-sm border border-[#c3c4c7] bg-white p-3">

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[200px_minmax(0,1fr)_auto_auto]">

              {/* CLASS */}

              <div>

                <label className="mb-1.5 block text-sm font-bold text-[#646970]">
                  Kelas
                </label>

                <div className="relative">

                  <select
                    value={
                      classFilter
                    }
                    onChange={(
                      event
                    ) =>
                      handleClassChange(
                        event.target
                          .value
                      )
                    }
                    className="h-11 w-full appearance-none rounded-sm border border-[#c3c4c7] bg-white px-3 pr-9 text-base text-[#1d2327] outline-none focus:ring-2 focus:ring-[#2271b1]/20"
                  >

                    <option value="">
                      Semua Kelas
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
                        </option>
                      )
                    )}

                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#646970]"
                  />

                </div>

              </div>

              {/* STUDENT */}

              <div>

                <label className="mb-1.5 block text-sm font-bold text-[#646970]">
                  Siswa
                </label>

                <div className="relative">

                  <UserRound
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#646970]"
                  />

                  <select
                    value={
                      studentId
                    }
                    onChange={(
                      event
                    ) =>
                      handleStudentChange(
                        event.target
                          .value
                      )
                    }
                    disabled={
                      loadingStudents
                    }
                    className="h-11 w-full appearance-none rounded-sm border border-[#c3c4c7] bg-white px-9 pr-9 text-base text-[#1d2327] outline-none focus:ring-2 focus:ring-[#2271b1]/20 disabled:opacity-50"
                  >

                    <option value="">
                      {loadingStudents
                        ? 'Memuat siswa...'
                        : filteredStudents.length ===
                            0
                          ? 'Tidak ada siswa'
                          : 'Pilih siswa'}
                    </option>

                    {filteredStudents.map(
                      (
                        student
                      ) => (
                        <option
                          key={
                            student.id
                          }
                          value={
                            student.id
                          }
                        >
                          {
                            student.fullname
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

              </div>

              {/* RELOAD */}

              <button
                type="button"
                onClick={() =>
                  fetchReport()
                }
                disabled={
                  loadingReport ||
                  !studentId
                }
                className="h-11 self-end rounded-sm bg-[#2271b1] px-5 text-base font-bold text-white transition hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-40"
              >

                {loadingReport ? (
                  <span className="flex items-center gap-2">

                    <Loader2
                      size={14}
                      className="animate-spin"
                    />

                    Memuat...

                  </span>
                ) : (
                  <span className="flex items-center gap-2">

                    <RefreshCw
                      size={14}
                    />

                    Muat Ulang

                  </span>
                )}

              </button>

              {/* PRINT */}

              <button
                type="button"
                onClick={
                  handlePrint
                }
                disabled={
                  !reportData
                }
                className="h-11 self-end rounded-sm border border-[#2271b1] bg-[#2271b1] px-5 text-base font-bold text-white transition hover:bg-[#135e96] disabled:cursor-not-allowed disabled:opacity-30"
              >

                <span className="flex items-center gap-2">

                  <Printer
                    size={14}
                  />

                  Cetak F4 / PDF

                </span>

              </button>

            </div>

            {error && (
              <div className="mt-3 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-base text-red-700">
                {error}
              </div>
            )}

          </div>

        </div>

      </section>

      {/* ======================================================
          EMPTY STATE
      ======================================================= */}

      {!reportData &&
        !loadingReport && (
          <div className="print:hidden flex min-h-[calc(100vh-190px)] items-center justify-center bg-[#f0f0f1] px-5">

            <div className="max-w-md text-center">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-sm border border-[#c3c4c7] bg-white text-[#2271b1]">

                <BookOpen
                  size={27}
                  strokeWidth={
                    1.5
                  }
                />

              </div>

              <h2 className="text-base font-semibold tracking-tight text-[#1d2327]">
                Pilih Siswa untuk Melihat Rapor
              </h2>

              <p className="mt-2 text-base leading-6 text-[#646970]">
                Pilih kelas dan nama siswa pada panel di atas untuk menampilkan laporan hasil belajar.
              </p>

            </div>

          </div>
        )}

      {/* ======================================================
          LOADING REPORT
      ======================================================= */}

      {loadingReport && (
        <div className="print:hidden flex min-h-[calc(100vh-190px)] items-center justify-center bg-[#f0f0f1]">

          <div className="text-center">

            <Loader2
              size={28}
              className="mx-auto animate-spin text-[#2271b1]"
            />

            <p className="mt-3 text-base font-medium text-[#646970]">
              Menyiapkan rapor siswa...
            </p>

          </div>

        </div>
      )}

      {/* ======================================================
          REPORT
      ======================================================= */}

      {reportData &&
        !loadingReport && (
          <main className="report-screen overflow-x-auto bg-[#f0f0f1] px-3 py-6 print:overflow-visible print:bg-white print:p-0">

            <div className="report-document mx-auto w-[215.9mm] bg-white text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.14)] print:w-full print:shadow-none">

              {/* ==================================================
                  HEADER
              ================================================== */}

              <header className="report-header relative border-b border-slate-200 px-[10mm] pb-2.5 pt-[4mm] text-center">

                <div className="absolute left-[10mm] top-[4mm] flex h-[19mm] w-[19mm] items-center justify-center">

                  <img
                    src="/logo.png"
                    alt={`Logo ${SCHOOL_SHORT_NAME}`}
                    className="h-full w-full object-contain"
                  />

                </div>

                <div className="mx-auto max-w-[540px] px-[18mm]">

                  <div
                    dir="rtl"
                    className="arabic mb-0.5 text-[18px] font-bold text-slate-600"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </div>

                  <div className="text-[12px] font-bold tracking-[0.14em] text-slate-500">
                    SEKOLAH DASAR ISLAM TERPADU
                  </div>

                  <h2 className="mt-0.5 text-[24px] font-black leading-tight tracking-tight text-black">
                    {schoolName}
                  </h2>

                </div>

              </header>

              {/* ==================================================
                  TITLE
              ================================================== */}

              <div className="report-block mx-[10mm] my-2.5 border-y border-[#b3b3b3]/60 bg-[#f5f5f5] px-3 py-1.5 text-center">

                <div className="text-[16px] font-bold uppercase tracking-wide text-slate-800">
                  RAPOR PAI TINGKAT SD
                </div>

                <div className="text-[12px] font-medium tracking-[0.12em] text-slate-500">
                  SEMESTER {semesterLabel.toUpperCase()} • TAHUN AJARAN {academicYear}
                </div>

              </div>

              {/* ==================================================
                  STUDENT INFO
              ================================================== */}

              <section className="report-block mx-[10mm] mb-2.5 rounded-lg border border-slate-200 bg-[#fafafa] p-2.5">

                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[14px]">

                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-1">

                    <span className="font-semibold text-slate-600">
                      Nama Siswa

                      
                    </span>

                    <span className="max-w-[55%] truncate font-bold text-slate-900">
                      {
                        reportData.fullname
                      }
                    </span>

                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-1">

                    <span className="font-semibold text-slate-600">
                      NISN

                      
                    </span>

                    <span className="font-semibold text-slate-800">
                      {reportData.nisn ||
                        '-'}
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-slate-600">
                      Kelas

                      
                    </span>

                    <span className="font-bold text-[#477b69]">
                      {reportData.class_name ||
                        '-'}{' '}
                      • Tingkat {reportGrade}
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-slate-600">
                      Tahun Ajaran
                    </span>

                    <span className="font-semibold text-slate-800">
                      {academicYear} • {semesterLabel}
                    </span>

                  </div>

                </div>

              </section>

              {/* ==================================================
                  ORAL
              ================================================== */}

              <ReportSection
                title="Asesmen Lisan dan Praktik"

              >

                <table className="report-table w-full border-collapse border border-slate-300 bg-white text-[14px]">

                  <thead>

                    <tr className="bg-[#f2f2f2] text-center font-bold text-slate-700">

                      <th className="w-[6%] border border-slate-300 py-1.5">
                        No
                      </th>

                      <th className="w-[27%] border border-slate-300 py-1.5 text-center">
                        Mata Pelajaran
                      </th>

                      <th className="w-[12%] border border-slate-300 py-1.5">
                        Nilai
                      </th>

                      <th className="w-[55%] border border-slate-300 px-2.5 py-1.5 text-left">
                        Capaian Kompetensi
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {oralSubjects.length ===
                    0 ? (
                      <tr>

                        <td
                          colSpan={
                            4
                          }
                          className="border border-slate-300 px-3 py-4 text-center text-slate-400"
                        >
                          Belum ada nilai asesmen lisan/praktik.
                        </td>

                      </tr>
                    ) : (
                      oralSubjects.map(
                        (
                          subject,
                          index
                        ) => {
                          const score =
                            getScoreNumber(
                              subject.name,
                              'ORAL'
                            );

                          const description =
                            getCompetencyDescriptions(
                              subject.name,
                              score
                            );

                          return (
                            <tr
                              key={`oral-${subject.name}`}
                              className="report-row"
                            >

                              <td className="border border-slate-300 py-1.5 text-center align-top text-slate-500">
                                {index +
                                  1}
                              </td>

                              <td className="border border-slate-300 px-2 py-1.5 text-center align-top">

                                <div className="font-medium leading-tight text-slate-800">
                                  {
                                    subject.name
                                  }
                                </div>

                                

                              </td>

                              <td className="border border-slate-300 py-1.5 text-center align-top font-bold text-[#477b69]">
                                {score >
                                0
                                  ? score
                                  : '-'}
                              </td>

                              <td className="border border-slate-300 px-2.5 py-1.5 align-top leading-[1.5] text-slate-700">

                                <div>
                                  {
                                    description
                                      .achieved
                                  }
                                </div>

                                

                              </td>

                            </tr>
                          );
                        }
                      )
                    )}

                  </tbody>

                </table>

              </ReportSection>

              {/* ==================================================
                  WRITTEN
              ================================================== */}

              <ReportSection
                title="Asesmen Tertulis"

              >

                <table className="report-table w-full border-collapse border border-slate-300 bg-white text-[14px]">

                  <thead>

                    <tr className="bg-[#f2f2f2] text-center font-bold text-slate-700">

                      <th className="w-[6%] border border-slate-300 py-1.5">
                        No
                      </th>

                      <th className="w-[27%] border border-slate-300 py-1.5 text-center">
                        Mata Pelajaran
                      </th>

                      <th className="w-[12%] border border-slate-300 py-1.5">
                        Nilai
                      </th>

                      <th className="w-[55%] border border-slate-300 px-2.5 py-1.5 text-left">
                        Capaian Kompetensi
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {writtenSubjects.length ===
                    0 ? (
                      <tr>

                        <td
                          colSpan={
                            4
                          }
                          className="border border-slate-300 px-3 py-4 text-center text-slate-400"
                        >
                          Belum ada nilai asesmen tertulis.
                        </td>

                      </tr>
                    ) : (
                      writtenSubjects.map(
                        (
                          subject,
                          index
                        ) => {
                          const score =
                            getScoreNumber(
                              subject.name,
                              'WRITTEN'
                            );

                          const description =
                            getCompetencyDescriptions(
                              subject.name,
                              score
                            );

                          return (
                            <tr
                              key={`written-${subject.name}`}
                              className="report-row"
                            >

                              <td className="border border-slate-300 py-1 text-center align-top text-slate-500">
                                {index +
                                  1}
                              </td>

                              <td className="border border-slate-300 px-1.5 py-1 text-center align-top">

                                <div className="font-medium leading-tight text-slate-800">
                                  {
                                    subject.name
                                  }
                                </div>

                                

                              </td>

                              <td className="border border-slate-300 py-1 text-center align-top font-bold text-[#477b69]">
                                {score >
                                0
                                  ? score
                                  : '-'}
                              </td>

                              <td className="border border-slate-300 px-2.5 py-1 align-top leading-[1.5] text-slate-700">

                                <div>
                                  {
                                    description
                                      .achieved
                                  }
                                </div>

                                

                              </td>

                            </tr>
                          );
                        }
                      )
                    )}

                  </tbody>

                </table>

              </ReportSection>

              {/* ==================================================
                  PERSONALITY
              ================================================== */}

              <ReportSection
                title="Kepribadian Siswa"

              >

                <table className="report-table w-full border-collapse border border-slate-300 bg-white text-[14px]">

                  <thead>

                    <tr className="bg-[#f2f2f2] text-center font-bold text-slate-700">

                      <th className="w-[6%] border border-slate-300 py-1.5">
                        No
                      </th>

                      <th className="w-[27%] border border-slate-300 py-1.5 text-center">
                        Aspek
                      </th>

                      <th className="w-[18%] border border-slate-300 py-1.5">
                        Predikat
                      </th>

                      <th className="w-[49%] border border-slate-300 px-2.5 py-1.5 text-left">
                        Deskripsi
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {PERSONALITY_ASPECTS.map(
                      (
                        item,
                        index
                      ) => {
                        const value =
                          getPersonalityValue(
                            personality,
                            item.name,
                            item.arabic
                          );

                        const description =
                          getPersonalityDescription(
                            item.name,
                            value
                          );

                        return (
                          <tr
                            key={`personality-${item.name}`}
                            className="report-row"
                          >

                            <td className="border border-slate-300 py-1 text-center align-top text-slate-500">
                              {index +
                                1}
                            </td>

                            <td className="border border-slate-300 px-1.5 py-1 text-center align-top">

                              <div className="font-medium leading-tight text-slate-800">
                                {
                                  item.name
                                }
                              </div>

                              

                            </td>

                            <td
                              className={`border border-slate-300 py-1 text-center align-top font-bold ${
                                value ===
                                '-'
                                  ? 'text-slate-400'
                                  : 'text-[#477b69]'
                              }`}
                            >
                              {
                                value
                              }
                            </td>

                            <td className="border border-slate-300 px-2.5 py-1 align-top leading-[1.5] text-slate-700">

                              <div>
                                {
                                  description
                                    .achieved
                                }
                              </div>

                              

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </ReportSection>

              {/* ==================================================
                  PAI TEACHER NOTE
              ================================================== */}

              <div className="mx-[10mm] mb-4">

                {/* NOTE */}

                <section className="report-block">

                  <div className="mb-1 flex items-center justify-between border-b-2 border-black pb-1">

                    <span className="text-[14px] font-bold uppercase tracking-wide text-slate-800">
                      Catatan Guru PAI
                    </span>

                    

                  </div>

                  <div className="min-h-[100px] whitespace-pre-wrap break-words rounded border border-slate-300 bg-white p-2 text-[14px] leading-relaxed text-slate-700">

                    {paiTeacherNote ? (
                      paiTeacherNote
                    ) : (
                      <span className="italic text-slate-400">
                        Catatan Guru PAI belum disimpan.
                      </span>
                    )}

                  </div>

                </section>

              </div>

              {/* ==================================================
                  SUMMARY
              ================================================== */}

              {(reportData.averageScore !==
                null &&
                reportData.averageScore !==
                  undefined) ? (
                <section className="report-block mx-[10mm] mb-4">

                  <div className="grid grid-cols-1 gap-2 text-center text-[14px]">

                    <div className="rounded border border-slate-200 bg-[#fafafa] px-2 py-2">

                      <div className="text-[12px] uppercase tracking-wide text-slate-400">
                        Rata-rata
                      </div>

                      <div className="mt-0.5 font-bold text-[#477b69]">
                        {reportData.averageScore ??
                          '-'}
                      </div>

                    </div>



                  </div>

                </section>
              ) : null}

              {/* ==================================================
                  SIGNATURE
              ================================================== */}

              <section className="report-block report-signatures mx-[10mm] pb-6 text-[14px]">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="signature-column">
                    <div className="signature-heading">
                      <div className="mb-1 text-slate-600">Mengetahui,</div>
                      <div className="font-bold text-slate-800">Orang Tua / Wali Siswa</div>
                    </div>
                    <div aria-hidden="true" />
                    <div className="signature-name border-b border-slate-400 pb-0.5 font-bold text-slate-800">
                      ( ........................................ )
                    </div>
                  </div>
                  <div className="signature-column">
                    <div className="signature-heading">
                      <div className="mb-1 text-slate-600">Guru PAI</div>
                    </div>
                    <div aria-hidden="true" />
                    <div className="signature-name border-b border-slate-400 pb-0.5 font-bold text-slate-800">
                      {paiTeacherName || '( ........................................ )'}
                    </div>
                  </div>
                  <div className="signature-column">
                    <div className="signature-heading">
                      <div className="mb-1 text-slate-600">Purwokerto, {formattedPrintDate}</div>
                      <div className="font-bold text-slate-800">Kepala Sekolah</div>
                    </div>
                    <div aria-hidden="true" />
                    <div className="signature-name border-b border-slate-400 pb-0.5 font-bold text-slate-800">
                      {principalName}
                    </div>
                  </div>
                </div>
              </section>

            </div>

          </main>
        )}


      <style jsx global>{`
        /* Seluruh teks rapor hitam; warna asli gambar logo tetap utuh. */
        .report-document,
        .report-document * {
          color: #000 !important;
          -webkit-text-fill-color: #000 !important;
        }
        .report-signatures .signature-column {
          display: grid;
          grid-template-rows: 60px 64px auto;
          min-width: 0;
        }
        .report-signatures .signature-name { overflow-wrap: anywhere; }
        .report-document { font-size: 14px; line-height: 1.5; }
        .report-document .report-table td,
        .report-document .report-table th { padding-top: 7px; padding-bottom: 7px; }
        .report-document .report-table td { overflow-wrap: anywhere; }
        .report-document .arabic { line-height: 1.6; }
        .report-document .report-block { margin-bottom: 16px; }
        @media print {
          @page { size: 215.9mm 330mm; margin: 10mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .report-screen { overflow: visible !important; padding: 0 !important; }
          .report-document { width: 100% !important; margin: 0 !important; box-shadow: none !important; }
          .report-document .report-header { padding-left: 0; padding-right: 0; }
          .report-document .report-block,
          .report-document > div { margin-left: 0; margin-right: 0; }
          .report-document .report-block { break-inside: auto; }
          .report-document .report-block > div:first-child { break-after: avoid; }
          .report-document .report-table thead { display: table-header-group; }
          .report-document .report-row { break-inside: avoid; page-break-inside: avoid; }
          .report-document section:last-child { break-inside: avoid; page-break-inside: avoid; }
          .report-document { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </>
  );
}