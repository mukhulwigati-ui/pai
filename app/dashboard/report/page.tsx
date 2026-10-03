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
};

type ReportData = Student & {
  schoolName?: string;

  academicYear?: string;

  semester?: string;

  principalName?: string;

  settings?: ReportSettings;

  scoreRecords?: ScoreRecord[];

  personality?: PersonalityRecord[];

  homeroomNote?: string | null;

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

  return String(
    found.value
  ).trim();
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

      needsImprovement:
        `Nilai perlu dilengkapi untuk mengetahui perkembangan kompetensi siswa pada mata pelajaran ${subjectName}.`,
    };
  }

  if (
    score >= 90
  ) {
    return {
      achieved:
        `Siswa menunjukkan penguasaan kompetensi ${subjectName} dengan sangat baik.`,

      needsImprovement:
        `Pertahankan konsistensi belajar dan kembangkan kemampuan pada materi ${subjectName} secara lebih mendalam.`,
    };
  }

  if (
    score >= 80
  ) {
    return {
      achieved:
        `Siswa mampu memahami dan menguasai materi utama ${subjectName} dengan baik.`,

      needsImprovement:
        `Pertahankan pencapaian dan tingkatkan ketelitian serta penerapan materi ${subjectName}.`,
    };
  }

  if (
    score >= 70
  ) {
    return {
      achieved:
        `Siswa telah menunjukkan pemahaman yang cukup baik terhadap kompetensi ${subjectName}.`,

      needsImprovement:
        `Perlu peningkatan pada pendalaman materi dan konsistensi latihan ${subjectName}.`,
    };
  }

  if (
    score >= 60
  ) {
    return {
      achieved:
        `Siswa mulai menguasai kompetensi dasar pada mata pelajaran ${subjectName}.`,

      needsImprovement:
        `Perlu latihan dan pendampingan yang lebih teratur agar pemahaman ${subjectName} semakin baik.`,
    };
  }

  return {
    achieved:
      `Siswa masih memerlukan penguatan dalam memahami kompetensi ${subjectName}.`,

    needsImprovement:
      `Perlu bimbingan, pengulangan materi, dan latihan yang lebih intensif pada ${subjectName}.`,
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

      needsImprovement:
        `Wali kelas perlu melengkapi penilaian sesuai perkembangan siswa.`,
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

      needsImprovement:
        `Pertahankan kebiasaan positif dan keteladanan tersebut dalam kehidupan sehari-hari.`,
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

      needsImprovement:
        `Pertahankan sikap positif dan tingkatkan konsistensinya.`,
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

      needsImprovement:
        `Perlu pembiasaan dan pendampingan secara konsisten agar aspek ${aspectName.toLowerCase()} semakin berkembang.`,
    };
  }

  return {
    achieved:
      `Siswa memperoleh predikat ${value} pada aspek ${aspectName}.`,

    needsImprovement:
      `Tetap lakukan pembinaan dan penguatan karakter secara berkelanjutan.`,
  };
}

/* ============================================================
   REPORT SECTION
============================================================ */

function ReportSection({
  number,
  title,
  arabic,
  children,
}: {
  number: string;
  title: string;
  arabic: string;
  children: ReactNode;
}) {
  return (
    <section className="report-block mx-[10mm] mb-3">

      <div className="mb-1 flex items-center justify-between border-b-2 border-[#315f50] pb-1">

        <div className="flex items-center gap-2">

          <span className="flex h-4 w-4 items-center justify-center rounded bg-[#315f50] text-[8px] font-bold text-white">
            {number}
          </span>

          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
            {title}
          </h3>

        </div>

        <div
          dir="rtl"
          className="arabic text-[11px] font-semibold text-slate-600"
        >
          {arabic}
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

  const attendance:
    Attendance =
    reportData?.attendance ??
    {
      sakit: 0,
      izin: 0,
      alpa: 0,
    };

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

      <section className="control-panel print:hidden border-b border-emerald-900/10 bg-[#174d40] text-white">

        <div className="mx-auto max-w-[1500px] px-5 py-4 lg:px-8">

          <div className="mb-4 flex items-center justify-between gap-4">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">

                <BookOpen
                  size={20}
                  strokeWidth={
                    1.6
                  }
                  className="text-emerald-100"
                />

              </div>

              <div>

                <h1 className="text-[15px] font-semibold tracking-tight">
                  Rapor Siswa
                </h1>

                <p className="mt-0.5 text-[10px] text-emerald-100/60">
                  Sistem Penilaian &amp; Rapor {SCHOOL_SHORT_NAME} • Jenjang SD
                </p>

              </div>

            </div>

          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3">

            <div className="grid gap-3 lg:grid-cols-[180px_minmax(0,1fr)_auto_auto]">

              {/* CLASS */}

              <div>

                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-emerald-100/70">
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
                    className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#0f4035] px-3 pr-9 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-300/10"
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
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
                  />

                </div>

              </div>

              {/* STUDENT */}

              <div>

                <label className="mb-1.5 block text-[9px] font-bold uppercase tracking-wider text-emerald-100/70">
                  Siswa
                </label>

                <div className="relative">

                  <UserRound
                    size={14}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
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
                    className="h-10 w-full appearance-none rounded-lg border border-white/10 bg-[#0f4035] px-9 pr-9 text-xs text-white outline-none focus:ring-2 focus:ring-emerald-300/10 disabled:opacity-50"
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
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-emerald-100/40"
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
                className="h-10 self-end rounded-lg bg-[#6b9b88] px-5 text-xs font-bold text-white transition hover:bg-[#78a995] disabled:cursor-not-allowed disabled:opacity-40"
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
                className="h-10 self-end rounded-lg border border-amber-200/20 bg-amber-100/10 px-5 text-xs font-bold text-amber-100 transition hover:bg-amber-100/15 disabled:cursor-not-allowed disabled:opacity-30"
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
              <div className="mt-3 rounded-lg border border-red-200/10 bg-red-300/10 px-3 py-2 text-xs text-red-100">
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
          <div className="print:hidden flex min-h-[calc(100vh-190px)] items-center justify-center bg-[#f5f7f6] px-5">

            <div className="max-w-md text-center">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm">

                <BookOpen
                  size={27}
                  strokeWidth={
                    1.5
                  }
                />

              </div>

              <h2 className="text-base font-semibold tracking-tight text-slate-800">
                Pilih Siswa untuk Melihat Rapor
              </h2>

              <p className="mt-2 text-xs leading-6 text-slate-400">
                Pilih kelas dan nama siswa pada panel di atas untuk menampilkan laporan hasil belajar.
              </p>

            </div>

          </div>
        )}

      {/* ======================================================
          LOADING REPORT
      ======================================================= */}

      {loadingReport && (
        <div className="print:hidden flex min-h-[calc(100vh-190px)] items-center justify-center bg-[#f5f7f6]">

          <div className="text-center">

            <Loader2
              size={28}
              className="mx-auto animate-spin text-emerald-700"
            />

            <p className="mt-3 text-xs font-medium text-slate-500">
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
          <main className="report-screen bg-[#dfe5e2] px-3 py-6 print:bg-white print:p-0">

            <div className="report-document mx-auto w-[215.9mm] bg-white text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.14)] print:w-[215.9mm] print:shadow-none">

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
                    className="arabic mb-0.5 text-[13px] font-bold text-slate-600"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
                  </div>

                  <div className="text-[8px] font-bold tracking-[0.14em] text-slate-500">
                    SEKOLAH DASAR ISLAM TERPADU
                  </div>

                  <h2 className="mt-0.5 text-[17px] font-black leading-tight tracking-tight text-[#315f50]">
                    {schoolName}
                  </h2>

                  <p className="mt-0.5 text-[8px] text-slate-400">
                    Jenjang Sekolah Dasar
                  </p>

                </div>

                <div className="mt-1.5 border-t border-slate-100 pt-1 text-center">

                  <div className="arabic text-[11px] font-semibold text-slate-600">
                    السنة الدراسية / Tahun Ajaran: {academicYear}
                  </div>

                </div>

              </header>

              {/* ==================================================
                  TITLE
              ================================================== */}

              <div className="report-block mx-[10mm] my-2.5 border-y border-[#9db9ad]/60 bg-[#f4f8f6] px-3 py-1.5 text-center">

                <div
                  dir="rtl"
                  className="arabic text-[12px] font-bold leading-5 text-[#315f50]"
                >
                  كَشْفُ دَرَجَاتِ الطَّالِبِ

                  <span className="mx-2 text-[#b29b65]">
                    •
                  </span>

                  {semesterArabic}
                </div>

                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-800">
                  LAPORAN HASIL BELAJAR SISWA TINGKAT SD
                </div>

                <div className="text-[7.5px] font-medium tracking-[0.12em] text-slate-500">
                  SEMESTER {semesterLabel.toUpperCase()} • TAHUN AJARAN {academicYear}
                </div>

              </div>

              {/* ==================================================
                  STUDENT INFO
              ================================================== */}

              <section className="report-block mx-[10mm] mb-2.5 rounded-lg border border-slate-200 bg-[#fafbfa] p-2.5">

                <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-[10px]">

                  <div className="flex items-center justify-between border-b border-slate-200/70 pb-1">

                    <span className="font-semibold text-slate-600">
                      Nama Siswa

                      <span
                        dir="rtl"
                        className="arabic ml-1 text-[12px] font-semibold"
                      >
                        / اسم الطالب
                      </span>
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

                      <span
                        dir="rtl"
                        className="arabic ml-1 text-[12px] font-semibold"
                      >
                        / رقم القيد
                      </span>
                    </span>

                    <span className="font-semibold text-slate-800">
                      {reportData.nisn ||
                        '-'}
                    </span>

                  </div>

                  <div className="flex items-center justify-between">

                    <span className="font-semibold text-slate-600">
                      Kelas

                      <span
                        dir="rtl"
                        className="arabic ml-1 text-[12px] font-semibold"
                      >
                        / الفصل
                      </span>
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
                number="03"
                title="Asesmen Lisan dan Praktik"
                arabic="التقييم الشفوي والتطبيقي"
              >

                <table className="report-table w-full border-collapse border border-slate-300 bg-white text-[9.5px]">

                  <thead>

                    <tr className="bg-[#f1f6f3] text-center font-bold text-slate-700">

                      <th className="w-[6%] border border-slate-300 py-1.5">
                        No
                      </th>

                      <th className="w-[27%] border border-slate-300 py-1.5 text-center">
                        Mata Pelajaran / المواد
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

                                <div
                                  dir="rtl"
                                  className="arabic mt-0.5 text-[10.5px] font-semibold leading-tight text-slate-500"
                                >
                                  {
                                    subject.arabic
                                  }
                                </div>

                              </td>

                              <td className="border border-slate-300 py-1.5 text-center align-top font-bold text-[#477b69]">
                                {score >
                                0
                                  ? score
                                  : '-'}
                              </td>

                              <td className="border border-slate-300 px-2.5 py-1.5 align-top leading-[1.3] text-slate-700">

                                <div>
                                  {
                                    description
                                      .achieved
                                  }
                                </div>

                                <div className="mt-0.5 text-[8.5px] leading-[1.3] text-slate-500">
                                  {
                                    description
                                      .needsImprovement
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
                number="04"
                title="Asesmen Tertulis"
                arabic="التقييم التحريري"
              >

                <table className="report-table w-full border-collapse border border-slate-300 bg-white text-[9px]">

                  <thead>

                    <tr className="bg-[#f1f6f3] text-center font-bold text-slate-700">

                      <th className="w-[6%] border border-slate-300 py-1.5">
                        No
                      </th>

                      <th className="w-[27%] border border-slate-300 py-1.5 text-center">
                        Mata Pelajaran / المواد
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

                                <div
                                  dir="rtl"
                                  className="arabic mt-0.5 text-[9.5px] font-semibold leading-tight text-slate-500"
                                >
                                  {
                                    subject.arabic
                                  }
                                </div>

                              </td>

                              <td className="border border-slate-300 py-1 text-center align-top font-bold text-[#477b69]">
                                {score >
                                0
                                  ? score
                                  : '-'}
                              </td>

                              <td className="border border-slate-300 px-2.5 py-1 align-top leading-[1.25] text-slate-700">

                                <div>
                                  {
                                    description
                                      .achieved
                                  }
                                </div>

                                <div className="mt-0.5 text-[8px] leading-[1.25] text-slate-500">
                                  {
                                    description
                                      .needsImprovement
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
                number="05"
                title="Kepribadian Siswa"
                arabic="شخصية الطالب / الطالبة"
              >

                <table className="report-table w-full border-collapse border border-slate-300 bg-white text-[9px]">

                  <thead>

                    <tr className="bg-[#f1f6f3] text-center font-bold text-slate-700">

                      <th className="w-[6%] border border-slate-300 py-1.5">
                        No
                      </th>

                      <th className="w-[27%] border border-slate-300 py-1.5 text-center">
                        Aspek / الصفة
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

                              <div
                                dir="rtl"
                                className="arabic mt-0.5 text-[9.5px] font-semibold leading-tight text-slate-500"
                              >
                                {
                                  item.arabic
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

                            <td className="border border-slate-300 px-2.5 py-1 align-top leading-[1.25] text-slate-700">

                              <div>
                                {
                                  description
                                    .achieved
                                }
                              </div>

                              <div className="mt-0.5 text-[8px] leading-[1.25] text-slate-500">
                                {
                                  description
                                    .needsImprovement
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
                  ATTENDANCE + HOMEROOM NOTE
              ================================================== */}

              <div className="mx-[10mm] mb-4 grid grid-cols-2 gap-3">

                {/* ATTENDANCE */}

                <section className="report-block">

                  <div className="mb-1 flex items-center justify-between border-b-2 border-[#315f50] pb-1">

                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
                      Ketidakhadiran
                    </span>

                    <span
                      dir="rtl"
                      className="arabic text-[10px] font-semibold text-slate-600"
                    >
                      الغياب
                    </span>

                  </div>

                  <table className="w-full border-collapse border border-slate-300 bg-white text-[9.5px]">

                    <tbody>

                      <tr>

                        <td className="border border-slate-300 px-2 py-1 text-slate-600">
                          Sakit (مرض)
                        </td>

                        <td className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-800">
                          {
                            attendance.sakit
                          }{' '}
                          hari
                        </td>

                      </tr>

                      <tr>

                        <td className="border border-slate-300 px-2 py-1 text-slate-600">
                          Izin (إذن)
                        </td>

                        <td className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-800">
                          {
                            attendance.izin
                          }{' '}
                          hari
                        </td>

                      </tr>

                      <tr>

                        <td className="border border-slate-300 px-2 py-1 text-slate-600">
                          Alpa / Tanpa Keterangan (غائب)
                        </td>

                        <td className="border border-slate-300 px-2 py-1 text-center font-bold text-slate-800">
                          {
                            attendance.alpa
                          }{' '}
                          hari
                        </td>

                      </tr>

                    </tbody>

                  </table>

                </section>

                {/* NOTE */}

                <section className="report-block">

                  <div className="mb-1 flex items-center justify-between border-b-2 border-[#315f50] pb-1">

                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-800">
                      Catatan Wali Kelas
                    </span>

                    <span
                      dir="rtl"
                      className="arabic text-[10px] font-semibold text-slate-600"
                    >
                      ملاحظات مربي الفصل
                    </span>

                  </div>

                  <div className="h-[74px] overflow-y-auto rounded border border-slate-300 bg-white p-2 text-[9px] leading-relaxed text-slate-700">

                    {reportData.homeroomNote ? (
                      reportData.homeroomNote
                    ) : (
                      <span className="italic text-slate-400">
                        Terus tingkatkan prestasi belajar, jaga adab, kedisiplinan, dan semangat dalam menuntut ilmu.
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
                  undefined) ||
              reportData.rank ? (
                <section className="report-block mx-[10mm] mb-4">

                  <div className="grid grid-cols-3 gap-2 text-center text-[9px]">

                    <div className="rounded border border-slate-200 bg-[#fafbfa] px-2 py-2">

                      <div className="text-[8px] uppercase tracking-wide text-slate-400">
                        Rata-rata
                      </div>

                      <div className="mt-0.5 font-bold text-[#477b69]">
                        {reportData.averageScore ??
                          '-'}
                      </div>

                    </div>

                    <div className="rounded border border-slate-200 bg-[#fafbfa] px-2 py-2">

                      <div className="text-[8px] uppercase tracking-wide text-slate-400">
                        Peringkat
                      </div>

                      <div className="mt-0.5 font-bold text-[#477b69]">
                        {reportData.rank ??
                          '-'}
                      </div>

                    </div>

                    <div className="rounded border border-slate-200 bg-[#fafbfa] px-2 py-2">

                      <div className="text-[8px] uppercase tracking-wide text-slate-400">
                        Jumlah Siswa
                      </div>

                      <div className="mt-0.5 font-bold text-[#477b69]">
                        {reportData.totalStudents ??
                          '-'}
                      </div>

                    </div>

                  </div>

                </section>
              ) : null}

              {/* ==================================================
                  SIGNATURE
              ================================================== */}

              <section className="report-block mx-[10mm] pb-6 text-[9.5px]">

                <div className="grid grid-cols-3 gap-4 text-center">

                  {/* PARENT */}

                  <div>

                    <div className="mb-1 text-slate-600">
                      Mengetahui,
                    </div>

                    <div className="font-bold text-slate-800">
                      Orang Tua / Wali Siswa
                    </div>

                    <div className="h-14" />

                    <div className="border-b border-slate-400 pb-0.5 font-bold text-slate-800">
                      ( ........................................ )
                    </div>

                  </div>

                  {/* HOMEROOM */}

                  <div>

                    <div className="mb-1 text-slate-600">
                      Wali Kelas
                    </div>

                    <div className="font-bold text-slate-800">
                      مربي الفصل
                    </div>

                    <div className="h-14" />

                    <div className="border-b border-slate-400 pb-0.5 font-bold text-slate-800">
                      ________________________
                    </div>

                  </div>

                  {/* PRINCIPAL */}

                  <div>

                    <div className="mb-1 text-slate-600">
                      {formattedPrintDate}
                    </div>

                    <div className="font-bold text-slate-800">
                      Kepala Sekolah
                    </div>

                    <div className="h-14" />

                    <div className="border-b border-slate-400 pb-0.5 font-bold text-slate-800">
                      {principalName}
                    </div>

                  </div>

                </div>

              </section>

            </div>

          </main>
        )}

    </>
  );
}