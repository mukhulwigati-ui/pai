import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_LEVEL = 'SD';

const MIN_GRADE = 1;
const MAX_GRADE = 6;

const ALLOWED_PREDICATES = [
  '-',
  'Mumtaz (ممتاز)',
  'Jeid Jiddan (جيد جداً)',
  'Jeid (جيد)',
  'Maqbul (مقبول)',
] as const;

type PersonalityPredicate =
  (typeof ALLOWED_PREDICATES)[number];

/* ============================================================
   TYPES
============================================================ */

type PersonalityInput = {
  studentId?: unknown;
  suluk?: unknown;
  muwadhotah?: unknown;
  nadzofah?: unknown;
  indhiplat?: unknown;
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

function normalizeClassName(
  value: unknown
): string {
  return normalizeText(
    value
  ).toUpperCase();
}

function normalizeStudentId(
  value: unknown
): number | null {
  const studentId =
    Number(value);

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

function isValidPredicate(
  value: string
): value is PersonalityPredicate {
  return ALLOWED_PREDICATES.includes(
    value as PersonalityPredicate
  );
}

function normalizePredicate(
  value: unknown
): PersonalityPredicate | null {
  const normalized =
    normalizeText(
      value
    );

  if (!normalized) {
    return '-';
  }

  if (
    !isValidPredicate(
      normalized
    )
  ) {
    return null;
  }

  return normalized;
}

/* ============================================================
   GET /api/personality
   AMBIL DATA KEPRIBADIAN BERDASARKAN KELAS
   HANYA ADMIN
============================================================ */

export async function GET(
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
       QUERY PARAM
    -------------------------------------------------------- */

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const rawClassName =
      searchParams.get(
        'className'
      );

    const className =
      normalizeClassName(
        rawClassName
      );

    if (!className) {
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

    /* --------------------------------------------------------
       CEK KELAS SD
    -------------------------------------------------------- */

    const classRoom =
      await prisma.classRoom.findFirst({
        where: {
          name:
            className,

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
       AMBIL DATA KEPRIBADIAN
    -------------------------------------------------------- */

    const personalities =
      await prisma.personality.findMany({
        where: {
          className:
            classRoom.name,
        },

        include: {
          student: true,
        },

        orderBy: {
          studentId:
            'asc',
        },
      });

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        class: {
          id:
            classRoom.id,

          name:
            classRoom.name,

          level:
            classRoom.level,

          grade:
            classRoom.grade,

          status:
            classRoom.status,
        },

        total:
          personalities.length,

        data:
          personalities,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'GET /api/personality ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat data kepribadian siswa.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/personality
   SIMPAN / UPDATE KEPRIBADIAN SISWA SECARA MASSAL
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

    const className =
      normalizeClassName(
        body?.className
      );

    const records =
      body?.records;

    /* --------------------------------------------------------
       VALIDASI DASAR
    -------------------------------------------------------- */

    if (!className) {
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
      !Array.isArray(
        records
      ) ||
      records.length ===
        0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data penilaian kepribadian kosong atau tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       BATAS REQUEST
    -------------------------------------------------------- */

    if (
      records.length >
      500
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Maksimal 500 data siswa dalam satu kali penyimpanan.',
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
            className,

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
        classRoom.status ||
          ''
      )
        .trim()
        .toLowerCase() ===
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
       NORMALISASI RECORD
    -------------------------------------------------------- */

    const normalizedRecords:
      Array<{
        studentId: number;
        suluk: PersonalityPredicate;
        muwadhotah: PersonalityPredicate;
        nadzofah: PersonalityPredicate;
        indhiplat: PersonalityPredicate;
      }> = [];

    const errors:
      Array<{
        row: number;
        studentId?: number;
        message: string;
      }> = [];

    for (
      let index = 0;
      index <
      records.length;
      index++
    ) {
      const item =
        records[
          index
        ] as PersonalityInput;

      const row =
        index + 1;

      const studentId =
        normalizeStudentId(
          item?.studentId
        );

      if (!studentId) {
        errors.push({
          row,
          message:
            'ID siswa tidak valid.',
        });

        continue;
      }

      const suluk =
        normalizePredicate(
          item?.suluk
        );

      const muwadhotah =
        normalizePredicate(
          item?.muwadhotah
        );

      const nadzofah =
        normalizePredicate(
          item?.nadzofah
        );

      const indhiplat =
        normalizePredicate(
          item?.indhiplat
        );

      if (!suluk) {
        errors.push({
          row,
          studentId,
          message:
            'Nilai As-Suluk tidak valid.',
        });

        continue;
      }

      if (!muwadhotah) {
        errors.push({
          row,
          studentId,
          message:
            'Nilai Al-Muwadhotah tidak valid.',
        });

        continue;
      }

      if (!nadzofah) {
        errors.push({
          row,
          studentId,
          message:
            'Nilai An-Nadzofah tidak valid.',
        });

        continue;
      }

      if (!indhiplat) {
        errors.push({
          row,
          studentId,
          message:
            'Nilai Al-Indhiplat tidak valid.',
        });

        continue;
      }

      normalizedRecords.push({
        studentId,
        suluk,
        muwadhotah,
        nadzofah,
        indhiplat,
      });
    }

    /* --------------------------------------------------------
       JIKA TIDAK ADA DATA VALID
    -------------------------------------------------------- */

    if (
      normalizedRecords.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Tidak ada data penilaian yang valid.',

          saved:
            0,

          skipped:
            errors.length,

          errors,
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEGAH STUDENT ID GANDA
       ITEM TERAKHIR YANG DIPAKAI
    -------------------------------------------------------- */

    const uniqueMap =
      new Map<
        number,
        (typeof normalizedRecords)[number]
      >();

    for (
      const item of normalizedRecords
    ) {
      uniqueMap.set(
        item.studentId,
        item
      );
    }

    const uniqueRecords =
      Array.from(
        uniqueMap.values()
      );

    /* --------------------------------------------------------
       AMBIL SISWA
    -------------------------------------------------------- */

    const studentIds =
      uniqueRecords.map(
        (
          item
        ) =>
          item.studentId
      );

    const students =
      await prisma.student.findMany({
        where: {
          id: {
            in:
              studentIds,
          },
        },

        select: {
          id: true,
          nisn: true,
          fullname: true,
          class_name: true,
        },
      });

    const studentMap =
      new Map(
        students.map(
          (
            student
          ) => [
            student.id,
            student,
          ]
        )
      );

    /* --------------------------------------------------------
       VALIDASI SISWA DAN KELAS
    -------------------------------------------------------- */

    const validRecords:
      Array<
        (typeof uniqueRecords)[number]
      > = [];

    for (
      const record of uniqueRecords
    ) {
      const student =
        studentMap.get(
          record.studentId
        );

      if (!student) {
        errors.push({
          row: 0,
          studentId:
            record.studentId,

          message:
            'Data siswa tidak ditemukan.',
        });

        continue;
      }

      if (
        normalizeClassName(
          student.class_name
        ) !==
        normalizeClassName(
          classRoom.name
        )
      ) {
        errors.push({
          row: 0,
          studentId:
            student.id,

          message:
            `Siswa ${student.fullname} tidak terdaftar di kelas ${classRoom.name}.`,
        });

        continue;
      }

      validRecords.push(
        record
      );
    }

    if (
      validRecords.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Tidak ada siswa yang valid untuk disimpan.',

          saved:
            0,

          skipped:
            errors.length,

          errors,
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       TRANSACTION
    -------------------------------------------------------- */

    const transaction =
      validRecords.map(
        (
          item
        ) =>
          prisma.personality.upsert({
            where: {
              studentId:
                item.studentId,
            },

            update: {
              className:
                classRoom.name,

              suluk:
                item.suluk,

              muwadhotah:
                item.muwadhotah,

              nadzofah:
                item.nadzofah,

              indhiplat:
                item.indhiplat,
            },

            create: {
              studentId:
                item.studentId,

              className:
                classRoom.name,

              suluk:
                item.suluk,

              muwadhotah:
                item.muwadhotah,

              nadzofah:
                item.nadzofah,

              indhiplat:
                item.indhiplat,
            },
          })
      );

    const savedRecords =
      await prisma.$transaction(
        transaction
      );

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          `${savedRecords.length} data kepribadian siswa kelas ${classRoom.name} berhasil disimpan${errors.length > 0 ? `, ${errors.length} data dilewati` : ''}.`,

        saved:
          savedRecords.length,

        skipped:
          errors.length,

        errors,

        data:
          savedRecords,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/personality ERROR:',
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
            'Data kepribadian siswa tersebut sudah terdaftar.',
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
            'Data siswa yang digunakan tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       RECORD NOT FOUND
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2025'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data siswa atau kepribadian tidak ditemukan.',
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
          'Gagal menyimpan data kepribadian siswa.',
      },
      {
        status: 500,
      }
    );
  }
}