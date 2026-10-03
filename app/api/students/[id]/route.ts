import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_LEVEL = 'SD';

const MIN_GRADE = 1;
const MAX_GRADE = 6;

/* ============================================================
   TYPE PARAMS
============================================================ */

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

/* ============================================================
   HELPER: AMBIL ID SISWA
============================================================ */

async function getStudentId(
  context: RouteContext
) {
  const { id } =
    await context.params;

  const studentId =
    Number(id);

  if (
    !Number.isInteger(
      studentId
    ) ||
    studentId <= 0
  ) {
    return null;
  }

  return studentId;
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
   HELPER: NORMALISASI NISN
============================================================ */

function normalizeNisn(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, '');
}

/* ============================================================
   HELPER: NORMALISASI KELAS
============================================================ */

function normalizeClassName(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/* ============================================================
   GET /api/students/[id]
   AMBIL SATU DATA SISWA
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

    const studentId =
      await getStudentId(
        context
      );

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID siswa tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       AMBIL DATA SISWA
    -------------------------------------------------------- */

    const student =
      await prisma.student.findUnique({
        where: {
          id:
            studentId,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data siswa tidak ditemukan.',
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
          student,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/students/[id] ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat data siswa.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   PUT /api/students/[id]
   UPDATE DATA SISWA
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

    const studentId =
      await getStudentId(
        context
      );

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID siswa tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DATA SISWA
    -------------------------------------------------------- */

    const existingStudent =
      await prisma.student.findUnique({
        where: {
          id:
            studentId,
        },
      });

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data siswa tidak ditemukan.',
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

    const nisn =
      body?.nisn !== undefined
        ? normalizeNisn(
            body.nisn
          )
        : existingStudent.nisn;

    const fullname =
      body?.fullname !== undefined
        ? normalizeText(
            body.fullname
          )
        : existingStudent.fullname;

    const birth_info =
      body?.birth_info !== undefined
        ? normalizeText(
            body.birth_info
          )
        : existingStudent.birth_info || '';

    const class_name =
      body?.class_name !== undefined
        ? normalizeClassName(
            body.class_name
          )
        : existingStudent.class_name;

    const gender =
      body?.gender !== undefined
        ? String(
            body.gender
          )
            .trim()
            .toUpperCase()
        : existingStudent.gender;

    const address =
      body?.address !== undefined
        ? normalizeText(
            body.address
          )
        : existingStudent.address || '';

    /* --------------------------------------------------------
       VALIDASI
    -------------------------------------------------------- */

    if (!nisn) {
      return NextResponse.json(
        {
          success: false,
          message:
            'NISN wajib diisi.',
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
            'Nama lengkap siswa wajib diisi.',
        },
        {
          status: 400,
        }
      );
    }

    if (!class_name) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas wajib dipilih.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      gender !== 'L' &&
      gender !== 'P'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Jenis kelamin hanya boleh L atau P.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK KELAS SD
    -------------------------------------------------------- */

    const classRoom =
      await prisma.classRoom.findFirst({
        where: {
          name:
            class_name,

          level:
            SCHOOL_LEVEL,

          grade: {
            gte:
              MIN_GRADE,

            lte:
              MAX_GRADE,
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
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas SD yang dipilih tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    if (
      String(
        classRoom.status || ''
      ).toLowerCase() ===
      'tidak aktif'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Kelas yang dipilih sedang berstatus Tidak Aktif.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DUPLIKAT NISN
       Abaikan siswa yang sedang diedit
    -------------------------------------------------------- */

    const duplicate =
      await prisma.student.findFirst({
        where: {
          nisn,

          NOT: {
            id:
              studentId,
          },
        },

        select: {
          id: true,
          fullname: true,
        },
      });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message:
            'NISN sudah digunakan oleh siswa lain.',
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
      await prisma.student.update({
        where: {
          id:
            studentId,
        },

        data: {
          nisn,

          fullname,

          birth_info:
            birth_info ||
            null,

          class_name:
            classRoom.name,

          gender,

          address:
            address ||
            null,
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          'Data siswa berhasil diperbarui.',

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
      'PUT /api/students/[id] ERROR:',
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
            'NISN sudah digunakan oleh siswa lain.',
        },
        {
          status: 409,
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
            'Data kelas yang dipilih tidak valid.',
        },
        {
          status: 400,
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
            'Data siswa tidak ditemukan.',
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
          'Gagal memperbarui data siswa.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE /api/students/[id]
   HAPUS SATU SISWA
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

    const studentId =
      await getStudentId(
        context
      );

    if (!studentId) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID siswa tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DATA
    -------------------------------------------------------- */

    const existingStudent =
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

    if (!existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data siswa tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    await prisma.student.delete({
      where: {
        id:
          studentId,
      },
    });

    return NextResponse.json(
      {
        success: true,

        message:
          `Data siswa ${existingStudent.fullname} berhasil dihapus.`,

        deleted: {
          id:
            existingStudent.id,

          nisn:
            existingStudent.nisn,

          fullname:
            existingStudent.fullname,

          class_name:
            existingStudent.class_name,
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
      'DELETE /api/students/[id] ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /* --------------------------------------------------------
       DATA MASIH DIPAKAI RELASI LAIN
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Siswa tidak dapat dihapus karena masih terhubung dengan data akademik lainnya.',
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
            'Data siswa tidak ditemukan.',
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
          'Gagal menghapus data siswa.',
      },
      {
        status: 500,
      }
    );
  }
}