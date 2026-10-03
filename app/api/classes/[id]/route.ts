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
   TYPE PARAMS
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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
   ADMIN + TEACHER BOLEH MEMBACA
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
   HELPER: AMBIL ID KELAS
============================================================ */

async function getClassId(
  context: RouteContext
) {
  const { id } =
    await context.params;

  const classId =
    Number(id);

  if (
    !Number.isInteger(
      classId
    ) ||
    classId <= 0
  ) {
    return null;
  }

  return classId;
}

/* ============================================================
   HELPER: NORMALISASI NAMA
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
    !Number.isInteger(
      grade
    )
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
   GET /api/classes/[id]
   AMBIL SATU KELAS
============================================================ */

export async function GET(
  request: Request,
  context: RouteContext
) {
  const auth =
    verifyUser(request);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const classId =
      await getClassId(
        context
      );

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID kelas tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Hanya mengambil kelas jenjang SD.
     */
    const classRoom =
      await prisma.classRoom.findFirst(
        {
          where: {
            id: classId,
            level:
              SCHOOL_LEVEL,
          },
        }
      );

    if (!classRoom) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas SD tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: classRoom,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/classes/[id] ERROR:',
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
   PUT /api/classes/[id]
   EDIT KELAS
   HANYA ADMIN
============================================================ */

export async function PUT(
  request: Request,
  context: RouteContext
) {
  const auth =
    verifyAdmin(request);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const classId =
      await getClassId(
        context
      );

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID kelas tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK KELAS
    -------------------------------------------------------- */

    const existingClass =
      await prisma.classRoom.findFirst(
        {
          where: {
            id: classId,
            level:
              SCHOOL_LEVEL,
          },
        }
      );

    if (!existingClass) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas SD tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    const name =
      normalizeClassName(
        body?.name
      );

    /*
     * Level dipaksa SD.
     *
     * Jangan menggunakan body.level,
     * karena SDIT Khoiro Ummah hanya jenjang SD.
     */
    const level =
      SCHOOL_LEVEL;

    const gradeResult =
      validateGrade(
        body?.grade
      );

    /* --------------------------------------------------------
       VALIDASI NAMA
    -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       VALIDASI GRADE
    -------------------------------------------------------- */

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

    /* --------------------------------------------------------
       CEK DUPLIKAT

       Abaikan kelas yang sedang diedit.
    -------------------------------------------------------- */

    const duplicate =
      await prisma.classRoom.findFirst(
        {
          where: {
            name,
            level,

            NOT: {
              id: classId,
            },
          },
        }
      );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Kelas ${name} sudah digunakan pada jenjang SD.`,
        },
        {
          status: 409,
        }
      );
    }

    /* --------------------------------------------------------
       UPDATE
    -------------------------------------------------------- */

    const updatedClass =
      await prisma.classRoom.update(
        {
          where: {
            id: classId,
          },

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
          'Kelas berhasil diperbarui.',
        data:
          updatedClass,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error(
      'PUT /api/classes/[id] ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /*
     * Unique constraint.
     */
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

    /*
     * Record tidak ditemukan ketika update.
     */
    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas tidak ditemukan.',
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
          'Gagal memperbarui kelas.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE /api/classes/[id]
   HAPUS SATU KELAS
   HANYA ADMIN
============================================================ */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  const auth =
    verifyAdmin(request);

  if (!auth.success) {
    return auth.response;
  }

  try {
    const classId =
      await getClassId(
        context
      );

    if (!classId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID kelas tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK KELAS
    -------------------------------------------------------- */

    const existingClass =
      await prisma.classRoom.findFirst(
        {
          where: {
            id: classId,
            level:
              SCHOOL_LEVEL,
          },
        }
      );

    if (!existingClass) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas SD tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    await prisma.classRoom.delete({
      where: {
        id: classId,
      },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          `Kelas ${existingClass.name} berhasil dihapus.`,

        deleted:
          existingClass,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error(
      'DELETE /api/classes/[id] ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /*
     * Foreign key constraint.
     *
     * Contoh:
     * kelas masih dipakai siswa,
     * nilai, absensi, dll.
     */
    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas tidak dapat dihapus karena masih digunakan oleh data siswa atau data akademik lainnya.',
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Record sudah tidak ada.
     */
    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas tidak ditemukan.',
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
          'Gagal menghapus kelas.',
      },
      {
        status: 500,
      }
    );
  }
}