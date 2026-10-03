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
   GET /api/students
   AMBIL SEMUA DATA SISWA
   HANYA ADMIN
============================================================ */

export async function GET() {
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
       AMBIL DATA SISWA
    -------------------------------------------------------- */

    const students =
      await prisma.student.findMany({
        orderBy: [
          {
            class_name: 'asc',
          },
          {
            fullname: 'asc',
          },
          {
            id: 'asc',
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
          students.length,
        data:
          students,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET /api/students ERROR:',
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
   POST /api/students
   TAMBAH SISWA BARU
   HANYA ADMIN
============================================================ */

export async function POST(
  request: Request
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
       AMBIL BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    const nisn =
      normalizeNisn(
        body?.nisn
      );

    const fullname =
      normalizeText(
        body?.fullname
      );

    const birth_info =
      normalizeText(
        body?.birth_info
      );

    const class_name =
      normalizeClassName(
        body?.class_name
      );

    const gender =
      String(
        body?.gender ?? ''
      )
        .trim()
        .toUpperCase();

    const address =
      normalizeText(
        body?.address
      );

    /* --------------------------------------------------------
       VALIDASI FIELD WAJIB
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

    if (!gender) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Jenis kelamin wajib dipilih.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       VALIDASI GENDER
    -------------------------------------------------------- */

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
       CEK KELAS
       HARUS KELAS SD TINGKAT 1-6
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

    /* --------------------------------------------------------
       CEK STATUS KELAS
    -------------------------------------------------------- */

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
    -------------------------------------------------------- */

    const existingStudent =
      await prisma.student.findUnique({
        where: {
          nisn,
        },

        select: {
          id: true,
          fullname: true,
        },
      });

    if (existingStudent) {
      return NextResponse.json(
        {
          success: false,
          message:
            'NISN sudah terdaftar dalam sistem.',
        },
        {
          status: 409,
        }
      );
    }

    /* --------------------------------------------------------
       CREATE
    -------------------------------------------------------- */

    const newStudent =
      await prisma.student.create({
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

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          'Siswa berhasil ditambahkan.',

        data:
          newStudent,
      },
      {
        status: 201,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/students ERROR:',
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
            'NISN sudah terdaftar dalam sistem.',
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
            'Data kelas yang dipilih tidak valid.',
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
          'Gagal menyimpan data siswa.',
      },
      {
        status: 500,
      }
    );
  }
}