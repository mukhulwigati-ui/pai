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
   TYPE PARAMS
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   HELPER: TOKEN
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
   HELPER: VERIFIKASI USER
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
   HELPER: ID
============================================================ */

async function getSubjectId(
  context: RouteContext
) {
  const { id } =
    await context.params;

  const subjectId =
    Number(id);

  if (
    !Number.isInteger(
      subjectId
    ) ||
    subjectId <= 0
  ) {
    return null;
  }

  return subjectId;
}

/* ============================================================
   HELPER: NORMALISASI NAMA
============================================================ */

function normalizeSubjectName(
  value: unknown
) {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, ' ');
}

/* ============================================================
   GET /api/subjects/[id]
   AMBIL SATU MATA PELAJARAN
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
    const subjectId =
      await getSubjectId(
        context
      );

    if (!subjectId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID mata pelajaran tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    const subject =
      await prisma.subject.findFirst(
        {
          where: {
            id: subjectId,
            level:
              SCHOOL_LEVEL,
          },
        }
      );

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Mata pelajaran tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: subject,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/subjects/[id] ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat mata pelajaran.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   PUT /api/subjects/[id]
   UPDATE MATA PELAJARAN
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
    const subjectId =
      await getSubjectId(
        context
      );

    if (!subjectId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID mata pelajaran tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DATA
    -------------------------------------------------------- */

    const existingSubject =
      await prisma.subject.findFirst(
        {
          where: {
            id: subjectId,
            level:
              SCHOOL_LEVEL,
          },
        }
      );

    if (!existingSubject) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Mata pelajaran tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    const body =
      await request.json();

    const name =
      normalizeSubjectName(
        body?.name
      );

    const level =
      SCHOOL_LEVEL;

    /* --------------------------------------------------------
       VALIDASI
    -------------------------------------------------------- */

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Nama mata pelajaran wajib diisi.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DUPLIKAT
    -------------------------------------------------------- */

    const duplicate =
      await prisma.subject.findFirst(
        {
          where: {
            name,
            level,

            NOT: {
              id: subjectId,
            },
          },
        }
      );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Mata pelajaran "${name}" sudah terdaftar.`,
        },
        {
          status: 409,
        }
      );
    }

    /* --------------------------------------------------------
       UPDATE
    -------------------------------------------------------- */

    const updatedSubject =
      await prisma.subject.update(
        {
          where: {
            id: subjectId,
          },

          data: {
            name,
            level,
          },
        }
      );

    return NextResponse.json(
      {
        success: true,
        message:
          'Mata pelajaran berhasil diperbarui.',
        data:
          updatedSubject,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error(
      'PUT /api/subjects/[id] ERROR:',
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
            'Mata pelajaran tersebut sudah terdaftar.',
        },
        {
          status: 409,
        }
      );
    }

    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Mata pelajaran tidak ditemukan.',
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
          'Gagal memperbarui mata pelajaran.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE /api/subjects/[id]
   HAPUS SATU MATA PELAJARAN
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
    const subjectId =
      await getSubjectId(
        context
      );

    if (!subjectId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID mata pelajaran tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DATA
    -------------------------------------------------------- */

    const existingSubject =
      await prisma.subject.findFirst(
        {
          where: {
            id: subjectId,
            level:
              SCHOOL_LEVEL,
          },
        }
      );

    if (!existingSubject) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Mata pelajaran tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    await prisma.subject.delete(
      {
        where: {
          id: subjectId,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,

        message:
          `Mata pelajaran "${existingSubject.name}" berhasil dihapus.`,

        deleted:
          existingSubject,
      },
      {
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error(
      'DELETE /api/subjects/[id] ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /*
     * Subject masih dipakai oleh:
     * Assignment,
     * CP,
     * atau data akademik lain.
     */
    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Mata pelajaran tidak dapat dihapus karena masih digunakan oleh data akademik lainnya.',
        },
        {
          status: 409,
        }
      );
    }

    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Mata pelajaran tidak ditemukan.',
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
          'Gagal menghapus mata pelajaran.',
      },
      {
        status: 500,
      }
    );
  }
}