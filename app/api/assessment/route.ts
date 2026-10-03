import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
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

const VALID_ASSESSMENT_TYPES = [
  'ORAL',
  'WRITTEN',
  'STS_ORAL',
  'STS_WRITTEN',
  'SAS_ORAL',
  'SAS_WRITTEN',
] as const;

type AssessmentType =
  (typeof VALID_ASSESSMENT_TYPES)[number];

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

function normalizeType(
  value: unknown
): string {
  return normalizeText(
    value
  ).toUpperCase();
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

function toScore(
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

function isValidAssessmentType(
  value: string
): value is AssessmentType {
  return VALID_ASSESSMENT_TYPES.includes(
    value as AssessmentType
  );
}

function isTpBasedAssessment(
  type: AssessmentType
) {
  return (
    type === 'ORAL' ||
    type === 'WRITTEN'
  );
}

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

/* ============================================================
   GET /api/assessment
   AMBIL SELURUH ASESMEN KHUSUS SD
   HANYA ADMIN
============================================================ */

export async function GET() {
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
       AMBIL DAFTAR KELAS SD
    -------------------------------------------------------- */

    const sdClasses =
      await prisma.classRoom.findMany({
        where: {
          level:
            SCHOOL_LEVEL,

          grade: {
            in:
              VALID_GRADES,
          },
        },

        select: {
          name: true,
        },
      });

    const validClassNames =
      sdClasses.map(
        (
          item
        ) =>
          item.name
      );

    /* --------------------------------------------------------
       QUERY
    -------------------------------------------------------- */

    const assessments =
      await prisma.assessment.findMany({
        where: {
          student: {
            class_name: {
              in:
                validClassNames,
            },
          },

          OR: [
            /* ------------------------------------------------
               ASESMEN BERBASIS TP
            ------------------------------------------------ */

            {
              tpId: {
                not:
                  null,
              },

              tp: {
                cp: {
                  grade: {
                    in:
                      VALID_GRADES,
                  },

                  semester: {
                    in:
                      VALID_SEMESTERS,
                  },

                  subject: {
                    level:
                      SCHOOL_LEVEL,
                  },
                },
              },
            },

            /* ------------------------------------------------
               STS / SAS TANPA TP
            ------------------------------------------------ */

            {
              tpId:
                null,

              type: {
                in: [
                  'STS_ORAL',
                  'STS_WRITTEN',
                  'SAS_ORAL',
                  'SAS_WRITTEN',
                ],
              },
            },
          ],
        },

        include: {
          student: {
            select: {
              id: true,
              nisn: true,
              fullname: true,
              class_name: true,
              gender: true,
            },
          },

          tp: {
            include: {
              cp: {
                include: {
                  subject: {
                    select: {
                      id: true,
                      name: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          id:
            'desc',
        },
      });

    return NextResponse.json(
      {
        success: true,

        total:
          assessments.length,

        data:
          assessments,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'GET /api/assessment ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Gagal memuat data asesmen siswa.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/assessment

   SIMPAN / UPDATE NILAI ASESMEN

   TYPE:
   - ORAL
   - WRITTEN
   - STS_ORAL
   - STS_WRITTEN
   - SAS_ORAL
   - SAS_WRITTEN

   HANYA ADMIN
============================================================ */

export async function POST(
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
       BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    const studentId =
      toPositiveInteger(
        body?.studentId
      );

    const rawTpId =
      body?.tpId;

    const tpId =
      rawTpId ===
        null ||
      rawTpId ===
        undefined ||
      rawTpId ===
        ''
        ? null
        : toPositiveInteger(
            rawTpId
          );

    const score =
      toScore(
        body?.score
      );

    const type =
      normalizeType(
        body?.type
      );

    /* --------------------------------------------------------
       VALIDASI DASAR
    -------------------------------------------------------- */

    if (!studentId) {
      return errorResponse(
        'Data siswa tidak valid.'
      );
    }

    if (score === null) {
      return errorResponse(
        'Nilai wajib berupa angka antara 0 sampai 100.'
      );
    }

    if (
      !type ||
      !isValidAssessmentType(
        type
      )
    ) {
      return errorResponse(
        'Jenis asesmen tidak valid.'
      );
    }

    /* --------------------------------------------------------
       TP WAJIB UNTUK ORAL / WRITTEN
    -------------------------------------------------------- */

    if (
      isTpBasedAssessment(
        type
      ) &&
      !tpId
    ) {
      return errorResponse(
        'Tujuan Pembelajaran wajib dipilih untuk asesmen TP.'
      );
    }

    /* --------------------------------------------------------
       TP TIDAK DIPAKAI UNTUK STS / SAS
    -------------------------------------------------------- */

    const finalTpId =
      isTpBasedAssessment(
        type
      )
        ? tpId
        : null;

    /* --------------------------------------------------------
       CEK SISWA
    -------------------------------------------------------- */

    const student =
      await prisma.student.findUnique({
        where: {
          id:
            studentId,
        },

        select: {
          id: true,
          nisn: true,
          fullname: true,
          class_name: true,
        },
      });

    if (!student) {
      return errorResponse(
        'Data siswa tidak ditemukan.',
        404
      );
    }

    /* --------------------------------------------------------
       CEK KELAS SISWA HARUS SD
    -------------------------------------------------------- */

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
        `Siswa ${student.fullname} tidak terdaftar pada kelas SD yang valid.`,
        400
      );
    }

    /* --------------------------------------------------------
       CEK KELAS AKTIF
    -------------------------------------------------------- */

    const classStatus =
      String(
        classRoom.status ??
          ''
      )
        .trim()
        .toLowerCase();

    if (
      classStatus ===
        'tidak aktif' ||
      classStatus ===
        'nonaktif'
    ) {
      return errorResponse(
        `Kelas ${classRoom.name} sedang berstatus tidak aktif.`
      );
    }

    /* --------------------------------------------------------
       CEK TP
    -------------------------------------------------------- */

    if (finalTpId) {
      const tp =
        await prisma.tP.findFirst({
          where: {
            id:
              finalTpId,

            cp: {
              grade:
                classRoom.grade,

              semester: {
                in:
                  VALID_SEMESTERS,
              },

              subject: {
                level:
                  SCHOOL_LEVEL,
              },
            },
          },

          include: {
            cp: {
              include: {
                subject: {
                  select: {
                    id: true,
                    name: true,
                    level: true,
                  },
                },
              },
            },
          },
        });

      if (!tp) {
        return errorResponse(
          `Tujuan Pembelajaran tidak valid untuk siswa kelas ${classRoom.grade}.`,
          404
        );
      }
    }

    /* --------------------------------------------------------
       CARI NILAI LAMA
    -------------------------------------------------------- */

    const existingAssessment =
      await prisma.assessment.findFirst({
        where: {
          studentId,

          tpId:
            finalTpId,

          type,
        },

        select: {
          id: true,
        },
      });

    let assessment;

    /* ========================================================
       UPDATE
    ======================================================== */

    if (
      existingAssessment
    ) {
      assessment =
        await prisma.assessment.update({
          where: {
            id:
              existingAssessment.id,
          },

          data: {
            score,

            /*
             * Pastikan tpId juga konsisten.
             */
            tpId:
              finalTpId,
          },

          include: {
            student: {
              select: {
                id: true,
                nisn: true,
                fullname: true,
                class_name: true,
                gender: true,
              },
            },

            tp: {
              include: {
                cp: {
                  include: {
                    subject: {
                      select: {
                        id: true,
                        name: true,
                        level: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
    }

    /* ========================================================
       CREATE
    ======================================================== */

    else {
      assessment =
        await prisma.assessment.create({
          data: {
            studentId,

            tpId:
              finalTpId,

            score,

            type,
          },

          include: {
            student: {
              select: {
                id: true,
                nisn: true,
                fullname: true,
                class_name: true,
                gender: true,
              },
            },

            tp: {
              include: {
                cp: {
                  include: {
                    subject: {
                      select: {
                        id: true,
                        name: true,
                        level: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
    }

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          existingAssessment
            ? 'Nilai asesmen siswa berhasil diperbarui.'
            : 'Nilai asesmen siswa berhasil disimpan.',

        data:
          assessment,

        /*
         * Dipertahankan untuk kompatibilitas
         * dengan frontend lama.
         */
        assessment,
      },
      {
        status:
          existingAssessment
            ? 200
            : 201,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/assessment ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /* --------------------------------------------------------
       UNIQUE
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Nilai asesmen siswa tersebut sudah tercatat.',
        },
        {
          status: 409,
        }
      );
    }

    /* --------------------------------------------------------
       FOREIGN KEY
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Relasi siswa atau Tujuan Pembelajaran tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       RECORD NOT FOUND
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Data asesmen siswa tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          'Gagal menyimpan nilai asesmen siswa.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE /api/assessment

   HAPUS NILAI ASESMEN
   HANYA ADMIN
============================================================ */

export async function DELETE(
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
       BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    const id =
      toPositiveInteger(
        body?.id
      );

    if (!id) {
      return errorResponse(
        'ID asesmen wajib disertakan.'
      );
    }

    /* --------------------------------------------------------
       CARI ASESMEN
    -------------------------------------------------------- */

    const assessment =
      await prisma.assessment.findUnique({
        where: {
          id,
        },

        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              class_name: true,
            },
          },

          tp: {
            include: {
              cp: {
                include: {
                  subject: {
                    select: {
                      id: true,
                      name: true,
                      level: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!assessment) {
      return errorResponse(
        'Data asesmen tidak ditemukan.',
        404
      );
    }

    /* --------------------------------------------------------
       VALIDASI SISWA HARUS SD
    -------------------------------------------------------- */

    const studentClass =
      await prisma.classRoom.findFirst({
        where: {
          name:
            assessment.student
              .class_name,

          level:
            SCHOOL_LEVEL,

          grade: {
            in:
              VALID_GRADES,
          },
        },

        select: {
          id: true,
        },
      });

    if (!studentClass) {
      return errorResponse(
        'Data asesmen tersebut bukan bagian dari jenjang SD.',
        403
      );
    }

    /* --------------------------------------------------------
       JIKA ADA TP, PASTIKAN TP JUGA SD
    -------------------------------------------------------- */

    if (
      assessment.tp &&
      (
        assessment.tp.cp
          ?.subject?.level !==
          SCHOOL_LEVEL ||
        !VALID_GRADES.includes(
          Number(
            assessment.tp.cp
              ?.grade
          )
        )
      )
    ) {
      return errorResponse(
        'Data asesmen tersebut bukan bagian dari kurikulum SD.',
        403
      );
    }

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    await prisma.assessment.delete({
      where: {
        id,
      },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          'Nilai asesmen siswa berhasil dihapus.',
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'DELETE /api/assessment ERROR:',
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
            'Data asesmen tidak ditemukan.',
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
            'Nilai asesmen tidak dapat dihapus karena masih digunakan oleh data lain.',
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,

        message:
          'Gagal menghapus nilai asesmen siswa.',
      },
      {
        status: 500,
      }
    );
  }
}