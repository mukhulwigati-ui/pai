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

const MAX_CP_DESCRIPTION_LENGTH =
  5000;

const MAX_TP_DESCRIPTION_LENGTH =
  2000;

/* ============================================================
   HELPERS
============================================================ */

function normalizeDescription(
  value: unknown
): string {
  if (
    typeof value !==
    'string'
  ) {
    return '';
  }

  return value
    .trim()
    .replace(/\s+/g, ' ');
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
   CREATE SUBJECT CODE
============================================================ */

/**
 * Membuat singkatan kode mata pelajaran.
 *
 * Contoh:
 *
 * Bahasa Arab
 * -> BAH
 *
 * Fikih
 * -> FIK
 *
 * Tahfidz Al Qur'an
 * -> TAH
 */
function createSubjectCode(
  subjectName: string
) {
  const cleanName =
    subjectName
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /[^a-zA-Z0-9]/g,
        ''
      )
      .toUpperCase();

  return (
    cleanName.substring(
      0,
      3
    ) ||
    'MPL'
  );
}

/* ============================================================
   GENERATE CP CODE
============================================================ */

/**
 * Contoh:
 *
 * CP-FIK-K1-S1-01
 * CP-FIK-K1-S1-02
 */
async function generateCPCode(
  subjectId: number,
  subjectCode: string,
  grade: number,
  semester: number
) {
  const prefix =
    `CP-${subjectCode}-K${grade}-S${semester}-`;

  const existingCPs =
    await prisma.cP.findMany({
      where: {
        subjectId,
        grade,
        semester,

        code: {
          startsWith:
            prefix,
        },
      },

      select: {
        code: true,
      },
    });

  let highestSequence =
    0;

  for (
    const cp of existingCPs
  ) {
    const sequenceString =
      cp.code.slice(
        prefix.length
      );

    const sequence =
      Number(
        sequenceString
      );

    if (
      Number.isInteger(
        sequence
      ) &&
      sequence >
        highestSequence
    ) {
      highestSequence =
        sequence;
    }
  }

  const nextSequence =
    highestSequence + 1;

  return `${prefix}${String(
    nextSequence
  ).padStart(
    2,
    '0'
  )}`;
}

/* ============================================================
   GENERATE TP CODE
============================================================ */

/**
 * Contoh:
 *
 * TP-CP-FIK-K1-S1-01-01
 * TP-CP-FIK-K1-S1-01-02
 */
async function generateTPCode(
  cpId: number,
  parentCPCode: string
) {
  const prefix =
    `TP-${parentCPCode}-`;

  const existingTPs =
    await prisma.tP.findMany({
      where: {
        cpId,

        code: {
          startsWith:
            prefix,
        },
      },

      select: {
        code: true,
      },
    });

  let highestSequence =
    0;

  for (
    const tp of existingTPs
  ) {
    const sequenceString =
      tp.code.slice(
        prefix.length
      );

    const sequence =
      Number(
        sequenceString
      );

    if (
      Number.isInteger(
        sequence
      ) &&
      sequence >
        highestSequence
    ) {
      highestSequence =
        sequence;
    }
  }

  const nextSequence =
    highestSequence + 1;

  return `${prefix}${String(
    nextSequence
  ).padStart(
    2,
    '0'
  )}`;
}

/* ============================================================
   HELPER: AMBIL CP SD
============================================================ */

async function findSdCP(
  cpId: number
) {
  return prisma.cP.findFirst({
    where: {
      id:
        cpId,

      subject: {
        level:
          SCHOOL_LEVEL,
      },

      grade: {
        in:
          VALID_GRADES,
      },

      semester: {
        in:
          VALID_SEMESTERS,
      },
    },

    include: {
      subject: true,
      tps: true,
    },
  });
}

/* ============================================================
   GET /api/curriculum

   AMBIL SELURUH CP + TP
   KHUSUS JENJANG SD
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
       QUERY
    -------------------------------------------------------- */

    const cps =
      await prisma.cP.findMany({
        where: {
          subject: {
            level:
              SCHOOL_LEVEL,
          },

          grade: {
            in:
              VALID_GRADES,
          },

          semester: {
            in:
              VALID_SEMESTERS,
          },
        },

        include: {
          subject: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },

          tps: {
            orderBy: {
              id:
                'asc',
            },
          },
        },

        orderBy: [
          {
            grade:
              'asc',
          },
          {
            semester:
              'asc',
          },
          {
            subjectId:
              'asc',
          },
          {
            id:
              'asc',
          },
        ],
      });

    return NextResponse.json(
      {
        success: true,
        total:
          cps.length,
        data:
          cps,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'GET /api/curriculum ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat data kurikulum.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/curriculum

   ACTION:
   - CREATE_CP
   - CREATE_TP
   - UPDATE
   - DELETE

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

    const action =
      String(
        body?.action ??
          ''
      )
        .trim()
        .toUpperCase();

    const type =
      String(
        body?.type ??
          ''
      )
        .trim()
        .toUpperCase();

    /* ========================================================
       CREATE CP
    ======================================================== */

    if (
      action ===
      'CREATE_CP'
    ) {
      const numericSubjectId =
        toPositiveInteger(
          body?.subjectId
        );

      const numericGrade =
        toPositiveInteger(
          body?.grade
        );

      const numericSemester =
        body?.semester ===
          undefined ||
        body?.semester ===
          null
          ? 1
          : toPositiveInteger(
              body.semester
            );

      const cleanDescription =
        normalizeDescription(
          body?.description
        );

      /* ------------------------------------------------------
         VALIDASI
      ------------------------------------------------------ */

      if (
        !numericSubjectId
      ) {
        return errorResponse(
          'Mata pelajaran wajib dipilih.'
        );
      }

      if (
        !numericGrade ||
        !VALID_GRADES.includes(
          numericGrade
        )
      ) {
        return errorResponse(
          'Tingkat kelas tidak valid. Pilih kelas 1 sampai 6.'
        );
      }

      if (
        !numericSemester ||
        !VALID_SEMESTERS.includes(
          numericSemester
        )
      ) {
        return errorResponse(
          'Semester tidak valid. Pilih Semester 1 atau Semester 2.'
        );
      }

      if (
        !cleanDescription
      ) {
        return errorResponse(
          'Deskripsi Capaian Pembelajaran wajib diisi.'
        );
      }

      if (
        cleanDescription.length >
        MAX_CP_DESCRIPTION_LENGTH
      ) {
        return errorResponse(
          `Deskripsi Capaian Pembelajaran maksimal ${MAX_CP_DESCRIPTION_LENGTH} karakter.`
        );
      }

      /* ------------------------------------------------------
         CEK SUBJECT SD
      ------------------------------------------------------ */

      const subject =
        await prisma.subject.findFirst({
          where: {
            id:
              numericSubjectId,

            level:
              SCHOOL_LEVEL,
          },

          select: {
            id: true,
            name: true,
            level: true,
          },
        });

      if (!subject) {
        return errorResponse(
          'Mata pelajaran jenjang SD tidak ditemukan.',
          404
        );
      }

      /* ------------------------------------------------------
         GENERATE CODE
      ------------------------------------------------------ */

      const subjectCode =
        createSubjectCode(
          subject.name
        );

      const generatedCode =
        await generateCPCode(
          numericSubjectId,
          subjectCode,
          numericGrade,
          numericSemester
        );

      /* ------------------------------------------------------
         CREATE CP
      ------------------------------------------------------ */

      const newCP =
        await prisma.cP.create({
          data: {
            code:
              generatedCode,

            description:
              cleanDescription,

            subjectId:
              numericSubjectId,

            grade:
              numericGrade,

            semester:
              numericSemester,
          },

          include: {
            subject: {
              select: {
                id: true,
                name: true,
                level: true,
              },
            },

            tps: true,
          },
        });

      return NextResponse.json(
        {
          success: true,

          message:
            `CP ${subject.name} Kelas ${numericGrade} Semester ${numericSemester} berhasil ditambahkan.`,

          data:
            newCP,
        },
        {
          status: 201,
        }
      );
    }

    /* ========================================================
       CREATE TP
    ======================================================== */

    if (
      action ===
      'CREATE_TP'
    ) {
      const numericCPId =
        toPositiveInteger(
          body?.cpId
        );

      const cleanDescription =
        normalizeDescription(
          body?.description
        );

      if (!numericCPId) {
        return errorResponse(
          'Capaian Pembelajaran induk wajib dipilih.'
        );
      }

      if (
        !cleanDescription
      ) {
        return errorResponse(
          'Deskripsi Tujuan Pembelajaran wajib diisi.'
        );
      }

      if (
        cleanDescription.length >
        MAX_TP_DESCRIPTION_LENGTH
      ) {
        return errorResponse(
          `Deskripsi Tujuan Pembelajaran maksimal ${MAX_TP_DESCRIPTION_LENGTH} karakter.`
        );
      }

      /* ------------------------------------------------------
         CEK PARENT CP HARUS CP SD
      ------------------------------------------------------ */

      const parentCP =
        await findSdCP(
          numericCPId
        );

      if (!parentCP) {
        return errorResponse(
          'Capaian Pembelajaran jenjang SD tidak ditemukan.',
          404
        );
      }

      /* ------------------------------------------------------
         GENERATE TP CODE
      ------------------------------------------------------ */

      const generatedTPCode =
        await generateTPCode(
          numericCPId,
          parentCP.code
        );

      /* ------------------------------------------------------
         CREATE TP
      ------------------------------------------------------ */

      const newTP =
        await prisma.tP.create({
          data: {
            code:
              generatedTPCode,

            description:
              cleanDescription,

            cpId:
              numericCPId,
          },
        });

      return NextResponse.json(
        {
          success: true,

          message:
            'Tujuan Pembelajaran (TP) berhasil ditambahkan.',

          data:
            newTP,
        },
        {
          status: 201,
        }
      );
    }

    /* ========================================================
       UPDATE CP / TP
    ======================================================== */

    if (
      action ===
      'UPDATE'
    ) {
      const numericId =
        toPositiveInteger(
          body?.id
        );

      const cleanDescription =
        normalizeDescription(
          body?.description
        );

      if (!numericId) {
        return errorResponse(
          'ID data tidak valid.'
        );
      }

      if (
        !cleanDescription
      ) {
        return errorResponse(
          'Deskripsi tidak boleh kosong.'
        );
      }

      /* ------------------------------------------------------
         UPDATE CP
      ------------------------------------------------------ */

      if (
        type === 'CP'
      ) {
        if (
          cleanDescription.length >
          MAX_CP_DESCRIPTION_LENGTH
        ) {
          return errorResponse(
            `Deskripsi Capaian Pembelajaran maksimal ${MAX_CP_DESCRIPTION_LENGTH} karakter.`
          );
        }

        const existingCP =
          await findSdCP(
            numericId
          );

        if (!existingCP) {
          return errorResponse(
            'Capaian Pembelajaran jenjang SD tidak ditemukan.',
            404
          );
        }

        const updated =
          await prisma.cP.update({
            where: {
              id:
                numericId,
            },

            data: {
              description:
                cleanDescription,
            },

            include: {
              subject: {
                select: {
                  id: true,
                  name: true,
                  level: true,
                },
              },

              tps: {
                orderBy: {
                  id:
                    'asc',
                },
              },
            },
          });

        return NextResponse.json(
          {
            success: true,

            message:
              'Capaian Pembelajaran berhasil diperbarui.',

            data:
              updated,
          },
          {
            status: 200,
          }
        );
      }

      /* ------------------------------------------------------
         UPDATE TP
      ------------------------------------------------------ */

      if (
        type === 'TP'
      ) {
        if (
          cleanDescription.length >
          MAX_TP_DESCRIPTION_LENGTH
        ) {
          return errorResponse(
            `Deskripsi Tujuan Pembelajaran maksimal ${MAX_TP_DESCRIPTION_LENGTH} karakter.`
          );
        }

        const existingTP =
          await prisma.tP.findFirst({
            where: {
              id:
                numericId,

              cp: {
                subject: {
                  level:
                    SCHOOL_LEVEL,
                },

                grade: {
                  in:
                    VALID_GRADES,
                },

                semester: {
                  in:
                    VALID_SEMESTERS,
                },
              },
            },

            select: {
              id: true,
            },
          });

        if (!existingTP) {
          return errorResponse(
            'Tujuan Pembelajaran jenjang SD tidak ditemukan.',
            404
          );
        }

        const updated =
          await prisma.tP.update({
            where: {
              id:
                numericId,
            },

            data: {
              description:
                cleanDescription,
            },
          });

        return NextResponse.json(
          {
            success: true,

            message:
              'Tujuan Pembelajaran berhasil diperbarui.',

            data:
              updated,
          },
          {
            status: 200,
          }
        );
      }

      return errorResponse(
        'Tipe data UPDATE tidak valid.'
      );
    }

    /* ========================================================
       DELETE CP / TP
    ======================================================== */

    if (
      action ===
      'DELETE'
    ) {
      const numericId =
        toPositiveInteger(
          body?.id
        );

      if (!numericId) {
        return errorResponse(
          'ID data tidak valid.'
        );
      }

      /* ------------------------------------------------------
         DELETE CP
      ------------------------------------------------------ */

      if (
        type === 'CP'
      ) {
        const existingCP =
          await findSdCP(
            numericId
          );

        if (!existingCP) {
          return errorResponse(
            'Capaian Pembelajaran jenjang SD tidak ditemukan.',
            404
          );
        }

        /*
         * Hapus TP terlebih dahulu,
         * lalu CP.
         */
        await prisma.$transaction([
          prisma.tP.deleteMany({
            where: {
              cpId:
                numericId,
            },
          }),

          prisma.cP.delete({
            where: {
              id:
                numericId,
            },
          }),
        ]);

        return NextResponse.json(
          {
            success: true,

            message:
              'Capaian Pembelajaran beserta seluruh TP berhasil dihapus.',
          },
          {
            status: 200,
          }
        );
      }

      /* ------------------------------------------------------
         DELETE TP
      ------------------------------------------------------ */

      if (
        type === 'TP'
      ) {
        const existingTP =
          await prisma.tP.findFirst({
            where: {
              id:
                numericId,

              cp: {
                subject: {
                  level:
                    SCHOOL_LEVEL,
                },

                grade: {
                  in:
                    VALID_GRADES,
                },

                semester: {
                  in:
                    VALID_SEMESTERS,
                },
              },
            },

            select: {
              id: true,
            },
          });

        if (!existingTP) {
          return errorResponse(
            'Tujuan Pembelajaran jenjang SD tidak ditemukan.',
            404
          );
        }

        await prisma.tP.delete({
          where: {
            id:
              numericId,
          },
        });

        return NextResponse.json(
          {
            success: true,

            message:
              'Tujuan Pembelajaran berhasil dihapus.',
          },
          {
            status: 200,
          }
        );
      }

      return errorResponse(
        'Tipe data DELETE tidak valid.'
      );
    }

    /* ========================================================
       ACTION TIDAK DIKENAL
    ======================================================== */

    return errorResponse(
      'Aksi tidak valid.'
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/curriculum ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /* --------------------------------------------------------
       UNIQUE CONSTRAINT
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kode atau data kurikulum tersebut sudah terdaftar.',
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
            'Mata pelajaran atau Capaian Pembelajaran yang digunakan tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       NOT FOUND
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data kurikulum tidak ditemukan.',
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
          'Terjadi kesalahan saat memproses data kurikulum.',
      },
      {
        status: 500,
      }
    );
  }
}