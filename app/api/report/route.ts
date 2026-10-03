import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_LEVEL = 'SD';

const VALID_GRADES = [
  1,
  2,
  3,
  4,
  5,
  6,
];

const VALID_SEMESTERS = [
  1,
  2,
];

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

const DEFAULT_SETTINGS = {
  schoolName:
    'Sekolah Dasar Islam Terpadu Khoiro Ummah',

  academicYear:
    '2026/2027',

  semester:
    'Ganjil',

  principalName:
    'Kepala Sekolah',
};

/* ============================================================
   TYPES
============================================================ */

type CategoryScore = {
  tpScores: number[];

  sts: number;

  sas: number;

  hasSts: boolean;

  hasSas: boolean;
};

type SubjectScore = {
  ORAL: CategoryScore;

  WRITTEN: CategoryScore;
};

type PersonalityShape = {
  suluk?: string | null;

  muwadhotah?: string | null;

  nadzofah?: string | null;

  indhiplat?: string | null;
};

type HomeroomNoteShape = {
  note?: string | null;
};

type AttendanceShape = {
  status?: string | null;
};

/* ============================================================
   HELPERS
============================================================ */

function errorResponse(
  message: string,
  status = 400
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    }
  );
}

function toPositiveInteger(
  value: unknown
): number | null {
  const numberValue =
    Number(value);

  if (
    !Number.isInteger(
      numberValue
    ) ||
    numberValue <= 0
  ) {
    return null;
  }

  return numberValue;
}

function normalizeText(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeUpper(
  value: unknown
): string {
  return normalizeText(
    value
  ).toUpperCase();
}

function normalizeScore(
  value: unknown
): number | null {
  const score =
    Number(value);

  if (
    !Number.isFinite(
      score
    )
  ) {
    return null;
  }

  if (
    score < 0 ||
    score > 100
  ) {
    return null;
  }

  return score;
}

function getSemesterNumber(
  semester: unknown
): number {
  const normalized =
    normalizeText(
      semester
    ).toLowerCase();

  if (
    normalized === 'genap' ||
    normalized === '2' ||
    normalized.includes(
      'semester 2'
    )
  ) {
    return 2;
  }

  return 1;
}

/* ============================================================
   CATEGORY
============================================================ */

function createEmptyCategory():
  CategoryScore {
  return {
    tpScores: [],

    sts: 0,

    sas: 0,

    hasSts: false,

    hasSas: false,
  };
}

/* ============================================================
   HITUNG NILAI AKHIR
============================================================ */

/**
 * Rumus dipertahankan dari sistem sebelumnya:
 *
 * TP  = bobot 2
 * STS = bobot 1
 * SAS = bobot 1
 *
 * Jika STS / SAS belum ada,
 * rata-rata TP digunakan sebagai pengganti.
 *
 * CATATAN:
 * Selama Assessment belum memiliki subjectId untuk STS/SAS,
 * STS/SAS tanpa TP tidak dapat dipetakan secara aman ke mapel.
 */
function calculateFinalScore(
  data: CategoryScore
) {
  const tpScores =
    data.tpScores;

  if (
    tpScores.length === 0 &&
    !data.hasSts &&
    !data.hasSas
  ) {
    return null;
  }

  const totalTP =
    tpScores.reduce(
      (
        total,
        score
      ) =>
        total +
        score,
      0
    );

  const averageTP =
    tpScores.length > 0
      ? totalTP /
        tpScores.length
      : 0;

  const sts =
    data.hasSts
      ? data.sts
      : averageTP;

  const sas =
    data.hasSas
      ? data.sas
      : averageTP;

  const finalScore =
    (
      2 *
        averageTP +
      sts +
      sas
    ) /
    4;

  return Math.round(
    finalScore
  );
}

/* ============================================================
   GET /api/report
============================================================ */

export async function GET(
  request: Request
) {
  try {
    /* --------------------------------------------------------
       AUTH
    -------------------------------------------------------- */

    const auth =
      await requireAdmin();

    if (!auth.authorized) {
      return NextResponse.json(
        {
          success: false,

          message:
            auth.message,
        },
        {
          status:
            auth.status,
        }
      );
    }

    /* --------------------------------------------------------
       STUDENT ID
    -------------------------------------------------------- */

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const studentId =
      toPositiveInteger(
        searchParams.get(
          'studentId'
        )
      );

    if (!studentId) {
      return errorResponse(
        'ID siswa tidak valid.'
      );
    }

    /* --------------------------------------------------------
       SETTINGS
    -------------------------------------------------------- */

    const systemSetting =
      await prisma.systemSetting.findFirst({
        orderBy: {
          id:
            'asc',
        },
      });

    const settings = {
      schoolName:
        systemSetting
          ?.schoolName ||
        DEFAULT_SETTINGS.schoolName,

      academicYear:
        systemSetting
          ?.academicYear ||
        DEFAULT_SETTINGS.academicYear,

      semester:
        systemSetting
          ?.semester ||
        DEFAULT_SETTINGS.semester,

      principalName:
        systemSetting
          ?.principalName ||
        DEFAULT_SETTINGS.principalName,
    };

    const activeSemester =
      getSemesterNumber(
        settings.semester
      );

    /* --------------------------------------------------------
       STUDENT
    -------------------------------------------------------- */

    const student =
      await prisma.student.findUnique({
        where: {
          id:
            studentId,
        },

        include: {
          assessments: {
            include: {
              tp: {
                include: {
                  cp: {
                    include: {
                      subject:
                        true,
                    },
                  },
                },
              },
            },

            orderBy: {
              id:
                'asc',
            },
          },

          personality:
            true,

          homeroomNote:
            true,

          attendances:
            true,
        },
      });

    if (!student) {
      return errorResponse(
        'Siswa tidak ditemukan.',
        404
      );
    }

    /* ========================================================
       VALIDASI KELAS SD
    ======================================================== */

    const classRoom =
      await prisma.classRoom.findFirst({
        where: {
          name:
            student.class_name,

          level:
            SCHOOL_LEVEL,

          grade: {
            in:
              VALID_GRADES,
          },
        },

        select: {
          id: true,

          name: true,

          level: true,

          grade: true,

          status: true,
        },
      });

    if (!classRoom) {
      return errorResponse(
        'Siswa tersebut tidak terdaftar pada kelas SD yang valid.',
        400
      );
    }

    const classStatus =
      normalizeText(
        classRoom.status
      ).toLowerCase();

    if (
      classStatus ===
        'nonaktif' ||
      classStatus ===
        'tidak aktif'
    ) {
      return errorResponse(
        `Kelas ${classRoom.name} sedang tidak aktif.`,
        400
      );
    }

    /* ========================================================
       1. KEHADIRAN
    ======================================================== */

    let sakit = 0;
    let izin = 0;
    let alpa = 0;

    const attendances =
      Array.isArray(
        student.attendances
      )
        ? student.attendances
        : [];

    for (
      const rawAttendance of attendances
    ) {
      const attendance =
        rawAttendance as AttendanceShape;

      const status =
        normalizeUpper(
          attendance.status
        );

      switch (status) {
        case 'SAKIT':
          sakit++;
          break;

        case 'IZIN':
          izin++;
          break;

        case 'ALPA':
          alpa++;
          break;

        default:
          break;
      }
    }

    /* ========================================================
       2. KELOMPOKKAN NILAI PER MAPEL
    ======================================================== */

    const subjectMap:
      Record<
        string,
        SubjectScore
      > = {};

    const assessments =
      Array.isArray(
        student.assessments
      )
        ? student.assessments
        : [];

    for (
      const assessment of assessments
    ) {
      /* ------------------------------------------------------
         RECORD WAJIB MEMILIKI TP
         UNTUK DAPAT DIHUBUNGKAN KE MAPEL
      ------------------------------------------------------ */

      if (
        !assessment.tp ||
        !assessment.tp.cp ||
        !assessment.tp.cp
          .subject
      ) {
        /*
         * STS/SAS dengan tpId = null saat ini
         * sengaja dilewati.
         *
         * Tanpa subjectId, backend tidak bisa
         * mengetahui ini STS/SAS mapel apa.
         */
        continue;
      }

      const cp =
        assessment.tp.cp;

      const subject =
        cp.subject;

      /* ------------------------------------------------------
         HANYA SUBJECT SD
      ------------------------------------------------------ */

      if (
        normalizeUpper(
          subject.level
        ) !==
        SCHOOL_LEVEL
      ) {
        continue;
      }

      /* ------------------------------------------------------
         HARUS GRADE YANG SAMA DENGAN SISWA
      ------------------------------------------------------ */

      if (
        Number(
          cp.grade
        ) !==
        Number(
          classRoom.grade
        )
      ) {
        continue;
      }

      /* ------------------------------------------------------
         HARUS SEMESTER AKTIF
      ------------------------------------------------------ */

      const cpSemester =
        Number(
          cp.semester
        );

      if (
        !VALID_SEMESTERS.includes(
          cpSemester
        ) ||
        cpSemester !==
          activeSemester
      ) {
        continue;
      }

      /* ------------------------------------------------------
         SUBJECT NAME
      ------------------------------------------------------ */

      const subjectName =
        normalizeText(
          subject.name
        );

      if (!subjectName) {
        continue;
      }

      /* ------------------------------------------------------
         SCORE
      ------------------------------------------------------ */

      const score =
        normalizeScore(
          assessment.score
        );

      if (
        score === null
      ) {
        continue;
      }

      /* ------------------------------------------------------
         TYPE
      ------------------------------------------------------ */

      const type =
        normalizeUpper(
          assessment.type
        );

      if (
        !subjectMap[
          subjectName
        ]
      ) {
        subjectMap[
          subjectName
        ] = {
          ORAL:
            createEmptyCategory(),

          WRITTEN:
            createEmptyCategory(),
        };
      }

      const subjectScore =
        subjectMap[
          subjectName
        ];

      /* ------------------------------------------------------
         TP LISAN
      ------------------------------------------------------ */

      if (
        type ===
          'ORAL' ||
        type ===
          'TP_ORAL'
      ) {
        subjectScore.ORAL
          .tpScores.push(
            score
          );

        continue;
      }

      /* ------------------------------------------------------
         TP TERTULIS
      ------------------------------------------------------ */

      if (
        type ===
          'WRITTEN' ||
        type ===
          'TP_WRITTEN'
      ) {
        subjectScore.WRITTEN
          .tpScores.push(
            score
          );

        continue;
      }

      /*
       * Bila suatu saat STS/SAS disimpan
       * dengan TP atau subject relation yang jelas,
       * logic ini tetap mendukungnya.
       */

      if (
        type ===
        'STS_ORAL'
      ) {
        subjectScore.ORAL
          .sts =
          score;

        subjectScore.ORAL
          .hasSts =
          true;

        continue;
      }

      if (
        type ===
        'STS_WRITTEN'
      ) {
        subjectScore.WRITTEN
          .sts =
          score;

        subjectScore.WRITTEN
          .hasSts =
          true;

        continue;
      }

      if (
        type ===
        'SAS_ORAL'
      ) {
        subjectScore.ORAL
          .sas =
          score;

        subjectScore.ORAL
          .hasSas =
          true;

        continue;
      }

      if (
        type ===
        'SAS_WRITTEN'
      ) {
        subjectScore.WRITTEN
          .sas =
          score;

        subjectScore.WRITTEN
          .hasSas =
          true;
      }
    }

    /* ========================================================
       3. NILAI RAPOR
    ======================================================== */

    const scoreRecords:
      Array<{
        id: number;

        subjectName:
          string;

        type:
          | 'ORAL'
          | 'WRITTEN';

        score:
          number;

        tpCode:
          null;

        tpDescription:
          null;
      }> = [];

    let scoreRecordId =
      1;

    const sortedSubjects =
      Object.entries(
        subjectMap
      ).sort(
        (
          [subjectA],
          [subjectB]
        ) =>
          subjectA.localeCompare(
            subjectB,
            'id'
          )
      );

    for (
      const [
        subjectName,
        categories,
      ] of sortedSubjects
    ) {
      const oralScore =
        calculateFinalScore(
          categories.ORAL
        );

      const writtenScore =
        calculateFinalScore(
          categories.WRITTEN
        );

      if (
        oralScore !==
        null
      ) {
        scoreRecords.push({
          id:
            scoreRecordId++,

          subjectName,

          type:
            'ORAL',

          score:
            oralScore,

          tpCode:
            null,

          tpDescription:
            null,
        });
      }

      if (
        writtenScore !==
        null
      ) {
        scoreRecords.push({
          id:
            scoreRecordId++,

          subjectName,

          type:
            'WRITTEN',

          score:
            writtenScore,

          tpCode:
            null,

          tpDescription:
            null,
        });
      }
    }

    /* ========================================================
       4. RATA-RATA
    ======================================================== */

    const totalScore =
      scoreRecords.reduce(
        (
          total,
          record
        ) =>
          total +
          record.score,
        0
      );

    const averageScore =
      scoreRecords.length >
      0
        ? Number(
            (
              totalScore /
              scoreRecords.length
            ).toFixed(
              1
            )
          )
        : 0;

    /* ========================================================
       5. JUMLAH SISWA KELAS
    ======================================================== */

    const totalStudents =
      await prisma.student.count({
        where: {
          class_name:
            classRoom.name,
        },
      });

    /* ========================================================
       6. KEPRIBADIAN
    ======================================================== */

    const rawPersonality =
      student.personality as
        | PersonalityShape
        | null;

    const personality =
      rawPersonality
        ? [
            {
              arabic:
                'السلوك',

              name:
                'Perilaku & Akhlak',

              value:
                rawPersonality
                  .suluk ??
                '-',
            },

            {
              arabic:
                'المواظبة',

              name:
                'Konsistensi & Ketekunan',

              value:
                rawPersonality
                  .muwadhotah ??
                '-',
            },

            {
              arabic:
                'النظافة',

              name:
                'Kebersihan & Kerapian',

              value:
                rawPersonality
                  .nadzofah ??
                '-',
            },

            {
              arabic:
                'الانضباط',

              name:
                'Disiplin & Tanggung Jawab',

              value:
                rawPersonality
                  .indhiplat ??
                '-',
            },
          ]
        : [];

    /* ========================================================
       7. CATATAN WALI KELAS
    ======================================================== */

    const rawHomeroomNote =
      student.homeroomNote as
        | HomeroomNoteShape
        | null;

    const homeroomNote =
      normalizeText(
        rawHomeroomNote
          ?.note
      );

    /* ========================================================
       8. DATA SISWA AMAN
       Jangan kirim relation mentah yang tidak perlu
    ======================================================== */

    const studentData = {
      id:
        student.id,

      nisn:
        student.nisn,

      fullname:
        student.fullname,

      gender:
        student.gender,

      class_name:
        student.class_name,
    };

    /* ========================================================
       9. REPORT FINAL
    ======================================================== */

    const reportData = {
      ...studentData,

      schoolName:
        settings.schoolName,

      academicYear:
        settings.academicYear,

      semester:
        settings.semester,

      principalName:
        settings.principalName,

      settings,

      class: {
        id:
          classRoom.id,

        name:
          classRoom.name,

        level:
          classRoom.level,

        grade:
          classRoom.grade,
      },

      scoreRecords,

      personality,

      homeroomNote,

      attendance: {
        sakit,

        izin,

        alpa,
      },

      averageScore,

      totalStudents,

      /*
       * Belum dihitung otomatis.
       * Lebih aman null daripada
       * memberi ranking yang salah.
       */
      rank:
        null,
    };

    /* ========================================================
       RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          'Data rapor siswa berhasil dimuat.',

        /*
         * Untuk frontend rapor yang sudah ada.
         */
        report:
          reportData,

        /*
         * Format response baru/konsisten.
         */
        data:
          reportData,
      },
      {
        status: 200,

        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate, proxy-revalidate',

          Pragma:
            'no-cache',

          Expires:
            '0',
        },
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'GET /api/report ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Data siswa atau rapor tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Terdapat relasi data rapor yang tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          'Gagal memuat data rapor dari server.',
      },
      {
        status: 500,
      }
    );
  }
}