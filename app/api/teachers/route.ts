import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { requireAdmin } from '@/lib/auth';

/* ============================================================
   KONFIGURASI
============================================================ */

const MIN_PASSWORD_LENGTH = 6;

const ALLOWED_STATUSES = [
  'Aktif',
  'Nonaktif',
] as const;

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
   POST /api/teachers
   TAMBAH USTADZ / USTADZAH BARU
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

    const identity_number =
      normalizeIdentityNumber(
        body?.identity_number
      );

    const fullname =
      normalizeText(
        body?.fullname
      );

    const password =
      String(
        body?.password ?? ''
      );

    const birth_date =
      body?.birth_date !== null &&
      body?.birth_date !== undefined
        ? String(
            body.birth_date
          ).trim()
        : '';

    const education =
      normalizeText(
        body?.education
      );

    const address =
      normalizeText(
        body?.address
      );

    const status =
      body?.status !== null &&
      body?.status !== undefined &&
      String(
        body.status
      ).trim() !== ''
        ? String(
            body.status
          ).trim()
        : 'Aktif';

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

    if (!password) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Password wajib diisi.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       VALIDASI PASSWORD
    -------------------------------------------------------- */

    if (
      password.length <
      MIN_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Password minimal ${MIN_PASSWORD_LENGTH} karakter.`,
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
       CEK DUPLIKAT NIK / NOMOR IDENTITAS
    -------------------------------------------------------- */

    const existingTeacher =
      await prisma.teacher.findUnique(
        {
          where: {
            identity_number,
          },

          select: {
            id: true,
            fullname: true,
          },
        }
      );

    if (existingTeacher) {
      return NextResponse.json(
        {
          success: false,
          message:
            'NIK / Nomor identitas sudah terdaftar dalam sistem.',
        },
        {
          status: 409,
        }
      );
    }

    /* --------------------------------------------------------
       HASH PASSWORD
    -------------------------------------------------------- */

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    /* --------------------------------------------------------
       CREATE USTADZ / USTADZAH

       Catatan:
       Model database tetap "teacher"
       dan role tetap "TEACHER"
       karena merupakan nama teknis internal.
    -------------------------------------------------------- */

    const newTeacher =
      await prisma.teacher.create(
        {
          data: {
            identity_number,

            fullname,

            password:
              hashedPassword,

            birth_date:
              birth_date ||
              null,

            education:
              education ||
              null,

            address:
              address ||
              null,

            status,

            role:
              'TEACHER',
          },

          /* ------------------------------------------------
             PASSWORD TIDAK BOLEH DIKIRIM KE FRONTEND
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

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          'Ustadz/ustadzah berhasil ditambahkan.',

        data:
          newTeacher,
      },
      {
        status: 201,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'CREATE TEACHER ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /* --------------------------------------------------------
       PRISMA UNIQUE CONSTRAINT
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'NIK / Nomor identitas sudah terdaftar dalam sistem.',
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
          'Gagal mendaftarkan ustadz/ustadzah.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   GET /api/teachers
   AMBIL DAFTAR USTADZ & USTADZAH
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
       AMBIL DATA USTADZ / USTADZAH
    -------------------------------------------------------- */

    const teachers =
      await prisma.teacher.findMany(
        {
          orderBy: [
            {
              status:
                'asc',
            },
            {
              fullname:
                'asc',
            },
          ],

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

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        total:
          teachers.length,

        data:
          teachers,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET TEACHERS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Gagal memuat daftar ustadz dan ustadzah.',
      },
      {
        status: 500,
      }
    );
  }
}