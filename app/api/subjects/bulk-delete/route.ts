import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

/* ============================================================
   KONFIGURASI
============================================================ */

const JWT_SECRET = process.env.JWT_SECRET;

const SCHOOL_LEVEL = 'SD';

/* ============================================================
   TYPE JWT
============================================================ */

type JwtPayload = {
  id: number;
  identity_number: string;
  fullname: string;
  role: string;
};

/* ============================================================
   HELPER: AMBIL TOKEN DARI COOKIE
============================================================ */

function getTokenFromRequest(
  request: Request
): string | null {
  const cookieHeader =
    request.headers.get('cookie') || '';

  const tokenMatch =
    cookieHeader.match(
      /(?:^|;\s*)token=([^;]+)/
    );

  if (!tokenMatch) {
    return null;
  }

  try {
    return decodeURIComponent(
      tokenMatch[1]
    );
  } catch {
    return tokenMatch[1];
  }
}

/* ============================================================
   HELPER: VERIFIKASI LOGIN
============================================================ */

function verifyUser(
  request: Request
) {
  if (!JWT_SECRET) {
    console.error(
      'JWT_SECRET belum tersedia di environment.'
    );

    return {
      success: false as const,

      response:
        NextResponse.json(
          {
            success: false,
            message:
              'Konfigurasi server belum lengkap.',
          },
          {
            status: 500,
          }
        ),
    };
  }

  const token =
    getTokenFromRequest(request);

  if (!token) {
    return {
      success: false as const,

      response:
        NextResponse.json(
          {
            success: false,
            message:
              'Anda belum login. Silakan login terlebih dahulu.',
          },
          {
            status: 401,
          }
        ),
    };
  }

  try {
    const decoded =
      jwt.verify(
        token,
        JWT_SECRET
      ) as JwtPayload;

    const role = String(
      decoded?.role || ''
    )
      .trim()
      .toUpperCase();

    if (
      role !== 'ADMIN' &&
      role !== 'TEACHER'
    ) {
      return {
        success: false as const,

        response:
          NextResponse.json(
            {
              success: false,
              message:
                'Akses ditolak.',
            },
            {
              status: 403,
            }
          ),
      };
    }

    return {
      success: true as const,

      user: {
        ...decoded,
        role,
      },
    };
  } catch (error) {
    console.error(
      'JWT verification error:',
      error
    );

    return {
      success: false as const,

      response:
        NextResponse.json(
          {
            success: false,
            message:
              'Sesi login tidak valid atau sudah kedaluwarsa.',
          },
          {
            status: 401,
          }
        ),
    };
  }
}

/* ============================================================
   HELPER: ADMIN ONLY
============================================================ */

function verifyAdmin(
  request: Request
) {
  const auth =
    verifyUser(request);

  if (!auth.success) {
    return auth;
  }

  if (
    auth.user.role !== 'ADMIN'
  ) {
    return {
      success: false as const,

      response:
        NextResponse.json(
          {
            success: false,
            message:
              'Akses ditolak. Fitur ini hanya dapat digunakan oleh Administrator.',
          },
          {
            status: 403,
          }
        ),
    };
  }

  return auth;
}

/* ============================================================
   HELPER: NORMALISASI ID
============================================================ */

function normalizeIds(
  value: unknown
): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map((item) =>
      Number(item)
    )
    .filter(
      (item) =>
        Number.isInteger(item) &&
        item > 0
    );

  return [
    ...new Set(ids),
  ];
}

/* ============================================================
   POST /api/subjects/bulk-delete
   HAPUS BANYAK MATA PELAJARAN
   HANYA ADMIN
============================================================ */

export async function POST(
  request: Request
) {
  const auth =
    verifyAdmin(request);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const body =
      await request.json();

    const ids =
      normalizeIds(
        body?.ids
      );

    /* --------------------------------------------------------
       VALIDASI
    -------------------------------------------------------- */

    if (
      ids.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Tidak ada mata pelajaran yang dipilih.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DATA YANG AKAN DIHAPUS

       Hanya mapel jenjang SD yang boleh diproses.
    -------------------------------------------------------- */

    const subjects =
      await prisma.subject.findMany(
        {
          where: {
            id: {
              in: ids,
            },

            level:
              SCHOOL_LEVEL,
          },

          select: {
            id: true,
            name: true,
            level: true,
          },
        }
      );

    if (
      subjects.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Tidak ada mata pelajaran jenjang SD yang ditemukan untuk dihapus.',
        },
        {
          status: 404,
        }
      );
    }

    const validIds =
      subjects.map(
        (subject) =>
          subject.id
      );

    /* --------------------------------------------------------
       HAPUS
    -------------------------------------------------------- */

    const result =
      await prisma.subject.deleteMany(
        {
          where: {
            id: {
              in:
                validIds,
            },

            level:
              SCHOOL_LEVEL,
          },
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          `Berhasil menghapus ${result.count} mata pelajaran.`,

        deleted:
          result.count,

        requested:
          ids.length,

        data:
          subjects,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/subjects/bulk-delete ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /*
     * Foreign key constraint.
     *
     * Misalnya mata pelajaran masih dipakai:
     * - Assignment
     * - CP
     * - TP
     * - data akademik lainnya
     */
    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Sebagian mata pelajaran tidak dapat dihapus karena masih digunakan oleh data akademik lainnya.',
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
          'Gagal melakukan hapus massal mata pelajaran.',
      },
      {
        status: 500,
      }
    );
  }
}