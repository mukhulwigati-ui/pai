import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

/* ============================================================
   KONFIGURASI
============================================================ */

const JWT_SECRET = process.env.JWT_SECRET;

const SCHOOL_LEVEL = 'SD';

const MIN_GRADE = 1;
const MAX_GRADE = 6;

/* ============================================================
   TYPE JWT PAYLOAD
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
   ADMIN + TEACHER BOLEH MEMBACA DATA
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
                'Akses ditolak. Anda tidak memiliki izin untuk mengakses data kelas.',
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
              'Sesi login tidak valid atau sudah kedaluwarsa. Silakan login kembali.',
          },
          {
            status: 401,
          }
        ),
    };
  }
}

/* ============================================================
   HELPER: VERIFIKASI KHUSUS ADMIN
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
   HELPER: NORMALISASI NAMA KELAS
============================================================ */

function normalizeClassName(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/* ============================================================
   HELPER: VALIDASI GRADE SD
============================================================ */

function validateGrade(
  value: unknown
) {
  const grade =
    Number(value);

  if (
    !Number.isInteger(grade)
  ) {
    return {
      valid: false as const,

      message:
        'Tingkat kelas tidak valid.',
    };
  }

  if (
    grade < MIN_GRADE ||
    grade > MAX_GRADE
  ) {
    return {
      valid: false as const,

      message:
        `Jenjang SD hanya dapat menggunakan tingkat ${MIN_GRADE} sampai ${MAX_GRADE}.`,
    };
  }

  return {
    valid: true as const,
    grade,
  };
}

/* ============================================================
   GET /api/classes
============================================================ */

export async function GET(
  request: Request
) {
  const auth =
    verifyUser(request);

  if (!auth.success) {
    return auth.response;
  }

  try {
    /*
     * Karena SDIT Khoiro Ummah hanya jenjang SD,
     * API hanya mengambil kelas dengan level SD.
     */
    const classes =
      await prisma.classRoom.findMany({
        where: {
          level:
            SCHOOL_LEVEL,
        },

        orderBy: [
          {
            grade: 'asc',
          },
          {
            name: 'asc',
          },
        ],
      });

    return NextResponse.json(
      classes,
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/classes ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat data kelas.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/classes
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

    const name =
      normalizeClassName(
        body?.name
      );

    /*
     * Level tidak lagi mengambil dari frontend.
     *
     * SDIT Khoiro Ummah adalah jenjang SD,
     * sehingga backend memaksa level = SD.
     */
    const level =
      SCHOOL_LEVEL;

    const gradeResult =
      validateGrade(
        body?.grade
      );

    /* ========================================================
       VALIDASI NAMA
    ======================================================== */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Nama kelas wajib diisi.',
        },
        {
          status: 400,
        }
      );
    }

    /* ========================================================
       VALIDASI GRADE
    ======================================================== */

    if (
      !gradeResult.valid
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            gradeResult.message,
        },
        {
          status: 400,
        }
      );
    }

    const grade =
      gradeResult.grade;

    /* ========================================================
       CEK DUPLIKAT
    ======================================================== */

    const existingClass =
      await prisma.classRoom.findFirst(
        {
          where: {
            name,
            level,
          },
        }
      );

    if (existingClass) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Kelas ${name} sudah terdaftar pada jenjang SD.`,
        },
        {
          status: 409,
        }
      );
    }

    /* ========================================================
       SIMPAN
    ======================================================== */

    const newClass =
      await prisma.classRoom.create(
        {
          data: {
            name,
            level,
            grade,
          },
        }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Kelas berhasil ditambahkan.',
        data:
          newClass,
      },
      {
        status: 201,
      }
    );
  } catch (error: unknown) {
    console.error(
      'POST /api/classes ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    if (
      prismaError?.code ===
      'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas tersebut sudah terdaftar.',
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
          'Gagal menyimpan kelas.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE /api/classes

   Menghapus SELURUH kelas jenjang SD.
   Hanya ADMIN.
============================================================ */

export async function DELETE(
  request: Request
) {
  const auth =
    verifyAdmin(request);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const body =
      await request
        .json()
        .catch(
          () => null
        );

    if (
      body?.confirm !==
      'DELETE_ALL_CLASSES'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Penghapusan seluruh kelas membutuhkan konfirmasi.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Karena project sekarang untuk SDIT Khoiro Ummah,
     * hanya kelas SD yang dihitung dan dihapus.
     */
    const total =
      await prisma.classRoom.count({
        where: {
          level:
            SCHOOL_LEVEL,
        },
      });

    if (total === 0) {
      return NextResponse.json(
        {
          success: true,
          message:
            'Tidak ada data kelas SD yang perlu dihapus.',
          deleted: 0,
        },
        {
          status: 200,
        }
      );
    }

    const result =
      await prisma.classRoom.deleteMany(
        {
          where: {
            level:
              SCHOOL_LEVEL,
          },
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          `${result.count} kelas SD berhasil dihapus.`,

        deleted:
          result.count,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'DELETE /api/classes ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal menghapus seluruh data kelas.',
      },
      {
        status: 500,
      }
    );
  }
}