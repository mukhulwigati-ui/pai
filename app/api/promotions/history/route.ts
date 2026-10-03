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

function normalizeUpper(
  value: unknown
): string {
  return normalizeText(
    value
  ).toUpperCase();
}

/* ============================================================
   GET /api/promotions/history
   RIWAYAT KENAIKAN KELAS & KELULUSAN
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
      new Set(
        sdClasses.map(
          (
            item
          ) =>
            item.name
        )
      );

    /* --------------------------------------------------------
       AMBIL RIWAYAT
    -------------------------------------------------------- */

    const promotions =
      await prisma.studentPromotion.findMany({
        orderBy: [
          {
            promotedAt:
              'desc',
          },
          {
            id:
              'desc',
          },
        ],

        include: {
          student: {
            select: {
              id: true,
              nisn: true,
              fullname: true,
              gender: true,
              class_name: true,
            },
          },
        },
      });

    /* --------------------------------------------------------
       FILTER KHUSUS RIWAYAT SD
    -------------------------------------------------------- */

    const sdPromotions =
      promotions.filter(
        (
          promotion
        ) => {
          const fromClass =
            normalizeText(
              promotion.fromClass
            );

          /*
           * Riwayat dianggap milik SD jika
           * kelas asal merupakan salah satu
           * kelas SD yang terdaftar.
           */
          return validClassNames.has(
            fromClass
          );
        }
      );

    /* --------------------------------------------------------
       NORMALISASI RESPONSE
    -------------------------------------------------------- */

    const data =
      sdPromotions.map(
        (
          promotion
        ) => {
          const status =
            normalizeUpper(
              promotion.status
            );

          /*
           * Untuk versi schema lama,
           * status LULUS mungkin disimpan:
           *
           * toClass = "LULUS"
           *
           * Frontend baru lebih baik menerima null.
           */
          const normalizedToClass =
            status === 'LULUS'
              ? null
              : normalizeText(
                  promotion.toClass
                ) || null;

          return {
            id:
              promotion.id,

            studentId:
              promotion.studentId,

            academicYear:
              normalizeText(
                promotion.academicYear
              ),

            fromClass:
              normalizeText(
                promotion.fromClass
              ),

            toClass:
              normalizedToClass,

            status,

            note:
              promotion.note
                ? normalizeText(
                    promotion.note
                  )
                : null,

            promotedAt:
              promotion.promotedAt,

            student:
              promotion.student
                ? {
                    id:
                      promotion.student.id,

                    nisn:
                      promotion.student.nisn,

                    fullname:
                      promotion.student.fullname,

                    gender:
                      promotion.student.gender,

                    class_name:
                      promotion.student.class_name,
                  }
                : null,
          };
        }
      );

    /* --------------------------------------------------------
       SUMMARY
    -------------------------------------------------------- */

    const summary = {
      total:
        data.length,

      naik:
        data.filter(
          (
            item
          ) =>
            item.status ===
            'NAIK'
        ).length,

      tinggal:
        data.filter(
          (
            item
          ) =>
            item.status ===
            'TINGGAL'
        ).length,

      lulus:
        data.filter(
          (
            item
          ) =>
            item.status ===
            'LULUS'
        ).length,
    };

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          'Riwayat kenaikan kelas dan kelulusan berhasil dimuat.',

        summary,

        data,
      },
      {
        status: 200,

        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'GET /api/promotions/history ERROR:',
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
            'Data riwayat kenaikan kelas tidak ditemukan.',
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
            'Terdapat relasi data riwayat siswa yang tidak valid.',
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
          'Gagal mengambil riwayat kenaikan kelas dan kelulusan.',
      },
      {
        status: 500,
      }
    );
  }
}