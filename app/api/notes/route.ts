import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_LEVEL = 'SD';

const MIN_GRADE = 1;
const MAX_GRADE = 6;

const MAX_NOTE_LENGTH = 2000;

// Catatan Guru PAI memakai model homeroomNote yang sudah tersedia.
// Identitas guru penandatangan dikelola oleh pengaturan guru dan API rapor.

/* ============================================================
   TYPES
============================================================ */

type NoteInput = {
  studentId?: unknown;
  note?: unknown;
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

function normalizeNote(
  value: unknown
): string {
  return String(
    value ?? ''
  ).trim();
}

/* ============================================================
   GET /api/notes
   AMBIL CATATAN GURU PAI BERDASARKAN KELAS
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
       AMBIL CATATAN
    -------------------------------------------------------- */

    const notes =
      await prisma.homeroomNote.findMany({
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
          notes.length,

        data:
          notes,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'GET /api/notes ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat catatan guru PAI.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/notes
   SIMPAN / UPDATE CATATAN GURU PAI SECARA MASSAL
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
            'Data catatan guru PAI kosong atau tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

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
        row: number;
        studentId: number;
        note: string;
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
        ] as NoteInput;

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

      const note =
        normalizeNote(
          item?.note
        );

      if (
        note.length >
        MAX_NOTE_LENGTH
      ) {
        errors.push({
          row,
          studentId,
          message:
            `Catatan melebihi batas ${MAX_NOTE_LENGTH} karakter.`,
        });

        continue;
      }

      normalizedRecords.push({
        row,
        studentId,
        note,
      });
    }

    /* --------------------------------------------------------
       TIDAK ADA DATA VALID
    -------------------------------------------------------- */

    if (
      normalizedRecords.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Tidak ada data catatan yang valid.',

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
       RECORD TERAKHIR YANG DIPAKAI
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
       VALIDASI SISWA HARUS ADA DI KELAS YANG DIPILIH
    -------------------------------------------------------- */

    const validRecords:
      Array<{
        studentId: number;
        note: string;
      }> = [];

    for (
      const record of uniqueRecords
    ) {
      const student =
        studentMap.get(
          record.studentId
        );

      if (!student) {
        errors.push({
          row:
            record.row,

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
          row:
            record.row,

          studentId:
            student.id,

          message:
            `Siswa ${student.fullname} tidak terdaftar di kelas ${classRoom.name}.`,
        });

        continue;
      }

      validRecords.push({
        studentId:
          record.studentId,

        note:
          record.note,
      });
    }

    /* --------------------------------------------------------
       TIDAK ADA SISWA VALID
    -------------------------------------------------------- */

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
          prisma.homeroomNote.upsert({
            where: {
              studentId:
                item.studentId,
            },

            update: {
              className:
                classRoom.name,

              note:
                item.note,
            },

            create: {
              studentId:
                item.studentId,

              className:
                classRoom.name,

              note:
                item.note,
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
          `${savedRecords.length} catatan guru PAI untuk siswa kelas ${classRoom.name} berhasil disimpan${errors.length > 0 ? `, ${errors.length} data dilewati` : ''}.`,

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
      'POST /api/notes ERROR:',
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
            'Catatan siswa tersebut sudah terdaftar.',
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
            'Data siswa atau catatan guru PAI tidak ditemukan.',
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
          'Gagal menyimpan catatan guru PAI.',
      },
      {
        status: 500,
      }
    );
  }
}