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
  'FORMATIVE',
  'SUMMATIVE',
  'SUMATIVE',
];

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

function normalizeClassName(
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

   FILTER OPSIONAL:
   - className
   - tpId
   - subjectId
   - type

   HANYA ADMIN
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
       QUERY PARAMS
    -------------------------------------------------------- */

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const rawClassName =
      searchParams.get(
        'className'
      );

    const rawTpId =
      searchParams.get(
        'tpId'
      );

    const rawSubjectId =
      searchParams.get(
        'subjectId'
      );

    const rawType =
      searchParams.get(
        'type'
      );

    const className =
      rawClassName
        ? normalizeClassName(
            rawClassName
          )
        : '';

    const tpId =
      rawTpId
        ? toPositiveInteger(
            rawTpId
          )
        : null;

    const subjectId =
      rawSubjectId
        ? toPositiveInteger(
            rawSubjectId
          )
        : null;

    const assessmentType =
      rawType
        ? normalizeText(
            rawType
          ).toUpperCase()
        : '';

    /* --------------------------------------------------------
       VALIDASI PARAMETER
    -------------------------------------------------------- */

    if (
      rawTpId &&
      !tpId
    ) {
      return errorResponse(
        'ID Tujuan Pembelajaran tidak valid.'
      );
    }

    if (
      rawSubjectId &&
      !subjectId
    ) {
      return errorResponse(
        'ID mata pelajaran tidak valid.'
      );
    }

    if (
      assessmentType &&
      !VALID_ASSESSMENT_TYPES.includes(
        assessmentType
      )
    ) {
      return errorResponse(
        'Jenis asesmen tidak valid.'
      );
    }

    /* --------------------------------------------------------
       VALIDASI KELAS
    -------------------------------------------------------- */

    let canonicalClassName:
      string | null =
      null;

    if (
      className
    ) {
      const classRoom =
        await prisma.classRoom.findFirst({
          where: {
            name:
              className,

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
            grade: true,
            level: true,
            status: true,
          },
        });

      if (!classRoom) {
        return errorResponse(
          'Kelas SD yang dipilih tidak ditemukan.',
          404
        );
      }

      canonicalClassName =
        classRoom.name;
    }

    /* --------------------------------------------------------
       VALIDASI SUBJECT
    -------------------------------------------------------- */

    if (
      subjectId
    ) {
      const subject =
        await prisma.subject.findFirst({
          where: {
            id:
              subjectId,

            level:
              SCHOOL_LEVEL,
          },

          select: {
            id: true,
          },
        });

      if (!subject) {
        return errorResponse(
          'Mata pelajaran jenjang SD tidak ditemukan.',
          404
        );
      }
    }

    /* --------------------------------------------------------
       VALIDASI TP
    -------------------------------------------------------- */

    if (
      tpId
    ) {
      const tp =
        await prisma.tP.findFirst({
          where: {
            id:
              tpId,

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

      if (!tp) {
        return errorResponse(
          'Tujuan Pembelajaran jenjang SD tidak ditemukan.',
          404
        );
      }
    }

    /* --------------------------------------------------------
       QUERY ASSESSMENT
    -------------------------------------------------------- */

    const assessments =
      await prisma.assessment.findMany({
        where: {
          /* ----------------------------------------------
             TP
          ---------------------------------------------- */

          ...(tpId
            ? {
                tpId,
              }
            : {}),

          /* ----------------------------------------------
             TYPE
          ---------------------------------------------- */

          ...(assessmentType
            ? {
                type:
                  assessmentType,
              }
            : {}),

          /* ----------------------------------------------
             STUDENT / CLASS
          ---------------------------------------------- */

          student: {
            ...(canonicalClassName
              ? {
                  class_name:
                    canonicalClassName,
                }
              : {}),
          },

          /* ----------------------------------------------
             HARUS TP / CP / SUBJECT SD
          ---------------------------------------------- */

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

                ...(subjectId
                  ? {
                      id:
                        subjectId,
                    }
                  : {}),
              },
            },
          },
        },

        include: {
          /* ----------------------------------------------
             STUDENT
          ---------------------------------------------- */

          student: {
            select: {
              id: true,
              nisn: true,
              fullname: true,
              class_name: true,
              gender: true,
            },
          },

          /* ----------------------------------------------
             TP -> CP -> SUBJECT
          ---------------------------------------------- */

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

        orderBy: [
          {
            id:
              'desc',
          },
        ],
      });

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        total:
          assessments.length,

        filters: {
          className:
            canonicalClassName,

          tpId:
            tpId || null,

          subjectId:
            subjectId || null,

          type:
            assessmentType ||
            null,
        },

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
          'Gagal memuat data nilai asesmen.',
      },
      {
        status: 500,
      }
    );
  }
}