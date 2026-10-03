import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_NAME =
  'Sekolah Dasar Islam Terpadu Khoiro Ummah';

const DEFAULT_ACADEMIC_YEAR =
  '2026/2027';

const DEFAULT_SEMESTER =
  'Ganjil';

const DEFAULT_PRINCIPAL_NAME =
  'Kepala Sekolah';

const MAX_SCHOOL_NAME_LENGTH =
  200;

const MAX_PRINCIPAL_NAME_LENGTH =
  150;

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

const DEFAULT_SETTINGS = {
  schoolName:
    SCHOOL_NAME,

  academicYear:
    DEFAULT_ACADEMIC_YEAR,

  semester:
    DEFAULT_SEMESTER,

  principalName:
    DEFAULT_PRINCIPAL_NAME,
};

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

function normalizeAcademicYear(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, '');
}

/* ============================================================
   VALIDASI TAHUN AJARAN
============================================================ */

/**
 * Format valid:
 *
 * 2026/2027
 * 2027/2028
 *
 * Tidak valid:
 *
 * 2026
 * 2026-2027
 * 2026/2028
 */
function isValidAcademicYear(
  value: string
): boolean {
  const match =
    value.match(
      /^(\d{4})\/(\d{4})$/
    );

  if (!match) {
    return false;
  }

  const firstYear =
    Number(
      match[1]
    );

  const secondYear =
    Number(
      match[2]
    );

  if (
    !Number.isInteger(
      firstYear
    ) ||
    !Number.isInteger(
      secondYear
    )
  ) {
    return false;
  }

  return (
    secondYear ===
    firstYear + 1
  );
}

/* ============================================================
   ERROR RESPONSE
============================================================ */

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
   GET /api/settings
   AMBIL PENGATURAN SISTEM
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
       AMBIL SETTING
    -------------------------------------------------------- */

    let setting =
      await prisma.systemSetting.findFirst({
        orderBy: {
          id:
            'asc',
        },
      });

    /* --------------------------------------------------------
       BELUM ADA SETTING
       BUAT DEFAULT SDIT KHOIRO UMMAH
    -------------------------------------------------------- */

    if (!setting) {
      setting =
        await prisma.systemSetting.create({
          data: {
            ...DEFAULT_SETTINGS,
          },
        });
    }

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          'Pengaturan sistem berhasil dimuat.',

        data:
          setting,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'GET /api/settings ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,

        message:
          'Gagal memuat pengaturan sistem.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/settings
   SIMPAN / PERBARUI PENGATURAN SISTEM
   HANYA ADMIN
============================================================ */

export async function POST(
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
       BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    /* --------------------------------------------------------
       NORMALISASI
    -------------------------------------------------------- */

    const schoolName =
      normalizeText(
        body?.schoolName
      );

    const academicYear =
      normalizeAcademicYear(
        body?.academicYear
      );

    const semester =
      normalizeText(
        body?.semester
      );

    const principalName =
      normalizeText(
        body?.principalName
      );

    /* ========================================================
       VALIDASI NAMA SEKOLAH
    ======================================================== */

    if (!schoolName) {
      return errorResponse(
        'Nama sekolah wajib diisi.'
      );
    }

    if (
      schoolName.length >
      MAX_SCHOOL_NAME_LENGTH
    ) {
      return errorResponse(
        `Nama sekolah maksimal ${MAX_SCHOOL_NAME_LENGTH} karakter.`
      );
    }

    /* ========================================================
       VALIDASI TAHUN AJARAN
    ======================================================== */

    if (!academicYear) {
      return errorResponse(
        'Tahun ajaran wajib diisi.'
      );
    }

    if (
      !isValidAcademicYear(
        academicYear
      )
    ) {
      return errorResponse(
        'Format tahun ajaran tidak valid. Gunakan format seperti 2026/2027.'
      );
    }

    /* ========================================================
       VALIDASI SEMESTER
    ======================================================== */

    if (
      ![
        'Ganjil',
        'Genap',
      ].includes(
        semester
      )
    ) {
      return errorResponse(
        'Semester harus Ganjil atau Genap.'
      );
    }

    /* ========================================================
       VALIDASI KEPALA SEKOLAH
    ======================================================== */

    if (!principalName) {
      return errorResponse(
        'Nama kepala sekolah wajib diisi.'
      );
    }

    if (
      principalName.length >
      MAX_PRINCIPAL_NAME_LENGTH
    ) {
      return errorResponse(
        `Nama kepala sekolah maksimal ${MAX_PRINCIPAL_NAME_LENGTH} karakter.`
      );
    }

    /* ========================================================
       CARI SETTING YANG SUDAH ADA
    ======================================================== */

    const existing =
      await prisma.systemSetting.findFirst({
        orderBy: {
          id:
            'asc',
        },
      });

    /* ========================================================
       UPDATE / CREATE
    ======================================================== */

    let setting;

    if (existing) {
      setting =
        await prisma.systemSetting.update({
          where: {
            id:
              existing.id,
          },

          data: {
            schoolName,

            academicYear,

            semester,

            principalName,
          },
        });
    } else {
      setting =
        await prisma.systemSetting.create({
          data: {
            schoolName,

            academicYear,

            semester,

            principalName,
          },
        });
    }

    /* ========================================================
       RESPONSE
    ======================================================== */

    return NextResponse.json(
      {
        success: true,

        message:
          'Pengaturan sistem berhasil disimpan.',

        data:
          setting,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/settings ERROR:',
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
            'Pengaturan sistem tersebut sudah terdaftar.',
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
            'Data pengaturan memiliki relasi yang tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       NOT FOUND
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Data pengaturan sistem tidak ditemukan.',
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
          'Gagal menyimpan pengaturan sistem.',
      },
      {
        status: 500,
      }
    );
  }
}