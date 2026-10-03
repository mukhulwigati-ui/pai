import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/* ============================================================
   TYPE PARAMS
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   KONFIGURASI
============================================================ */

const ALLOWED_STATUSES = [
  'Aktif',
  'Nonaktif',
] as const;

/* ============================================================
   HELPER: AMBIL ID
============================================================ */

async function getTeacherId(
  context: RouteContext
) {
  const { id } =
    await context.params;

  const teacherId =
    Number(id);

  if (
    !Number.isInteger(
      teacherId
    ) ||
    teacherId <= 0
  ) {
    return null;
  }

  return teacherId;
}

/* ============================================================
   HELPER: NORMALISASI TEXT
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

/* ============================================================
   HELPER: NORMALISASI IDENTITY NUMBER
============================================================ */

function normalizeIdentityNumber(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, '');
}

/* ============================================================
   HELPER: VALIDASI STATUS
============================================================ */

function isValidStatus(
  value: string
): value is (typeof ALLOWED_STATUSES)[number] {
  return ALLOWED_STATUSES.includes(
    value as (typeof ALLOWED_STATUSES)[number]
  );
}

/* ============================================================
   GET /api/teachers/[id]
   AMBIL SATU DATA USTADZ / USTADZAH
   HANYA ADMIN
============================================================ */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* --------------------------------------------------------
       CEK ADMIN
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
       AMBIL ID
    -------------------------------------------------------- */

    const teacherId =
      await getTeacherId(
        context
      );

    if (!teacherId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID ustadz/ustadzah tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       AMBIL DATA
    -------------------------------------------------------- */

    const teacher =
      await prisma.teacher.findUnique(
        {
          where: {
            id: teacherId,
          },

          select: {
            id: true,
            identity_number: true,
            fullname: true,
            birth_date: true,
            education: true,
            address: true,
            role: true,
            status: true,
          },
        }
      );

    if (!teacher) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data ustadz/ustadzah tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data:
          teacher,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/teachers/[id] ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat data ustadz/ustadzah.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   PUT /api/teachers/[id]
   UPDATE DATA USTADZ / USTADZAH
   HANYA ADMIN
============================================================ */

export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    /* --------------------------------------------------------
       CEK ADMIN
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
       AMBIL ID
    -------------------------------------------------------- */

    const teacherId =
      await getTeacherId(
        context
      );

    if (!teacherId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID ustadz/ustadzah tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DATA LAMA
    -------------------------------------------------------- */

    const existingTeacher =
      await prisma.teacher.findUnique(
        {
          where: {
            id: teacherId,
          },

          select: {
            id: true,
            identity_number: true,
            fullname: true,
            birth_date: true,
            education: true,
            address: true,
            role: true,
            status: true,
          },
        }
      );

    if (!existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data ustadz/ustadzah tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       AMBIL BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    const identity_number =
      body?.identity_number !== undefined
        ? normalizeIdentityNumber(
            body.identity_number
          )
        : existingTeacher.identity_number;

    const fullname =
      body?.fullname !== undefined
        ? normalizeText(
            body.fullname
          )
        : existingTeacher.fullname;

    const birth_date =
      body?.birth_date !== undefined
        ? body.birth_date === null ||
          String(
            body.birth_date
          ).trim() === ''
          ? null
          : String(
              body.birth_date
            ).trim()
        : existingTeacher.birth_date;

    const education =
      body?.education !== undefined
        ? body.education === null ||
          String(
            body.education
          ).trim() === ''
          ? null
          : normalizeText(
              body.education
            )
        : existingTeacher.education;

    const address =
      body?.address !== undefined
        ? body.address === null ||
          String(
            body.address
          ).trim() === ''
          ? null
          : normalizeText(
              body.address
            )
        : existingTeacher.address;

    const status =
      body?.status !== undefined
        ? String(
            body.status
          ).trim()
        : existingTeacher.status;

    /* --------------------------------------------------------
       VALIDASI FIELD WAJIB
    -------------------------------------------------------- */

    if (!identity_number) {
      return NextResponse.json(
        {
          success: false,
          message:
            'NIK / Nomor identitas wajib diisi.',
        },
        {
          status: 400,
        }
      );
    }

    if (!fullname) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Nama lengkap ustadz/ustadzah wajib diisi.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       VALIDASI STATUS
    -------------------------------------------------------- */

    if (
      !isValidStatus(
        status
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Status akun tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DUPLIKAT NOMOR IDENTITAS
    -------------------------------------------------------- */

    const duplicate =
      await prisma.teacher.findFirst(
        {
          where: {
            identity_number,

            NOT: {
              id: teacherId,
            },
          },

          select: {
            id: true,
          },
        }
      );

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            'NIK / Nomor identitas sudah digunakan oleh ustadz/ustadzah lain.',
        },
        {
          status: 409,
        }
      );
    }

    /* --------------------------------------------------------
       UPDATE
    -------------------------------------------------------- */

    const updated =
      await prisma.teacher.update(
        {
          where: {
            id: teacherId,
          },

          data: {
            identity_number,

            fullname,

            birth_date,

            education,

            address,

            status,
          },

          /* ------------------------------------------------
             PASSWORD TIDAK BOLEH DIKIRIM
          ------------------------------------------------ */

          select: {
            id: true,
            identity_number: true,
            fullname: true,
            birth_date: true,
            education: true,
            address: true,
            role: true,
            status: true,
          },
        }
      );

    return NextResponse.json(
      {
        success: true,

        message:
          'Data ustadz/ustadzah berhasil diperbarui.',

        data:
          updated,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'PUT /api/teachers/[id] ERROR:',
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
            'Data ustadz/ustadzah tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    if (
      prismaError?.code ===
      'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'NIK / Nomor identitas sudah digunakan.',
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
          'Gagal memperbarui data ustadz/ustadzah.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE /api/teachers/[id]
   HAPUS USTADZ / USTADZAH
   HANYA ADMIN
============================================================ */

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    /* --------------------------------------------------------
       CEK ADMIN
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
       AMBIL ID
    -------------------------------------------------------- */

    const teacherId =
      await getTeacherId(
        context
      );

    if (!teacherId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID ustadz/ustadzah tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DATA
    -------------------------------------------------------- */

    const existingTeacher =
      await prisma.teacher.findUnique(
        {
          where: {
            id: teacherId,
          },

          select: {
            id: true,
            identity_number: true,
            fullname: true,
            role: true,
            status: true,
          },
        }
      );

    if (!existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data ustadz/ustadzah tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       PROTEKSI ADMIN

       Jangan sampai akun ADMIN terhapus melalui
       endpoint pengelolaan ustadz/ustadzah.
    -------------------------------------------------------- */

    if (
      String(
        existingTeacher.role
      ).toUpperCase() ===
      'ADMIN'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Akun Administrator tidak dapat dihapus melalui halaman Ustadz & Ustadzah.',
        },
        {
          status: 403,
        }
      );
    }

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    await prisma.teacher.delete(
      {
        where: {
          id: teacherId,
        },
      }
    );

    return NextResponse.json(
      {
        success: true,

        message:
          `Data ${existingTeacher.fullname} berhasil dihapus.`,

        deleted: {
          id:
            existingTeacher.id,

          identity_number:
            existingTeacher.identity_number,

          fullname:
            existingTeacher.fullname,
        },
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'DELETE /api/teachers/[id] ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /* --------------------------------------------------------
       DATA MASIH DIPAKAI RELASI LAIN

       Misalnya:
       Assignment, nilai, kelas, dll.
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Ustadz/ustadzah tidak dapat dihapus karena masih terhubung dengan data akademik lainnya.',
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
            'Data ustadz/ustadzah tidak ditemukan.',
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
          'Gagal menghapus data ustadz/ustadzah.',
      },
      {
        status: 500,
      }
    );
  }
}