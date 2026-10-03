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

function normalizeNisn(
  value: unknown
): string {
  return String(
    value ?? ''
  )
    .trim()
    .replace(/\s+/g, '');
}

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

function normalizeIds(
  value: unknown
): number[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value
    .map((item) => Number(item))
    .filter(
      (item) =>
        Number.isInteger(item) &&
        item > 0
    );

  return [...new Set(ids)];
}

/* ============================================================
   POST /api/students/bulk
   IMPOR MASSAL SISWA
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
       BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    const students =
      body?.students;

    if (
      !Array.isArray(
        students
      ) ||
      students.length ===
        0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data siswa kosong atau tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       AMBIL SEMUA KELAS SD YANG VALID
    -------------------------------------------------------- */

    const classRooms =
      await prisma.classRoom.findMany({
        where: {
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

    const activeClasses =
      classRooms.filter(
        (item) =>
          String(
            item.status || ''
          ).toLowerCase() !==
          'tidak aktif'
      );

    const classMap =
      new Map<
        string,
        string
      >();

    for (
      const item of activeClasses
    ) {
      classMap.set(
        normalizeClassName(
          item.name
        ),
        item.name
      );
    }

    /* --------------------------------------------------------
       COUNTER
    -------------------------------------------------------- */

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    const errors: Array<{
      row: number;
      nisn?: string;
      message: string;
    }> = [];

    /* --------------------------------------------------------
       LOOP DATA
    -------------------------------------------------------- */

    for (
      let index = 0;
      index <
      students.length;
      index++
    ) {
      const item =
        students[index];

      const rowNumber =
        index + 2;

      try {
        const nisn =
          normalizeNisn(
            item?.nisn
          );

        const fullname =
          normalizeText(
            item?.fullname
          );

        const birth_info =
          normalizeText(
            item?.birth_info
          );

        const class_name =
          normalizeClassName(
            item?.class_name
          );

        const gender =
          String(
            item?.gender ?? ''
          )
            .trim()
            .toUpperCase();

        const address =
          normalizeText(
            item?.address
          );

        /* ----------------------------------------------------
           VALIDASI WAJIB
        ---------------------------------------------------- */

        if (!nisn) {
          skippedCount++;

          errors.push({
            row:
              rowNumber,
            message:
              'NISN kosong.',
          });

          continue;
        }

        if (!fullname) {
          skippedCount++;

          errors.push({
            row:
              rowNumber,
            nisn,
            message:
              'Nama lengkap siswa kosong.',
          });

          continue;
        }

        if (!class_name) {
          skippedCount++;

          errors.push({
            row:
              rowNumber,
            nisn,
            message:
              'Kelas siswa kosong.',
          });

          continue;
        }

        if (
          gender !== 'L' &&
          gender !== 'P'
        ) {
          skippedCount++;

          errors.push({
            row:
              rowNumber,
            nisn,
            message:
              'Jenis kelamin hanya boleh L atau P.',
          });

          continue;
        }

        /* ----------------------------------------------------
           CEK KELAS
        ---------------------------------------------------- */

        const validClassName =
          classMap.get(
            class_name
          );

        if (
          !validClassName
        ) {
          skippedCount++;

          errors.push({
            row:
              rowNumber,
            nisn,
            message:
              `Kelas ${class_name} tidak ditemukan pada jenjang SD.`,
          });

          continue;
        }

        /* ----------------------------------------------------
           CEK APAKAH SISWA SUDAH ADA
        ---------------------------------------------------- */

        const existingStudent =
          await prisma.student.findUnique({
            where: {
              nisn,
            },

            select: {
              id: true,
            },
          });

        /* ----------------------------------------------------
           UPDATE
        ---------------------------------------------------- */

        if (
          existingStudent
        ) {
          await prisma.student.update({
            where: {
              id:
                existingStudent.id,
            },

            data: {
              fullname,

              birth_info:
                birth_info ||
                null,

              class_name:
                validClassName,

              gender,

              address:
                address ||
                null,
            },
          });

          updatedCount++;

          continue;
        }

        /* ----------------------------------------------------
           CREATE
        ---------------------------------------------------- */

        await prisma.student.create({
          data: {
            nisn,

            fullname,

            birth_info:
              birth_info ||
              null,

            class_name:
              validClassName,

            gender,

            address:
              address ||
              null,
          },
        });

        createdCount++;
      } catch (
        error: unknown
      ) {
        console.error(
          `IMPORT STUDENT ROW ${rowNumber} ERROR:`,
          error
        );

        skippedCount++;

        const prismaError =
          error as {
            code?: string;
          };

        if (
          prismaError?.code ===
          'P2002'
        ) {
          errors.push({
            row:
              rowNumber,

            nisn:
              normalizeNisn(
                item?.nisn
              ),

            message:
              'NISN sudah digunakan.',
          });

          continue;
        }

        errors.push({
          row:
            rowNumber,

          nisn:
            normalizeNisn(
              item?.nisn
            ),

          message:
            'Data gagal diproses.',
        });
      }
    }

    /* --------------------------------------------------------
       HASIL
    -------------------------------------------------------- */

    const processedCount =
      createdCount +
      updatedCount;

    if (
      processedCount ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Tidak ada data siswa yang berhasil diimpor.',

          created:
            createdCount,

          updated:
            updatedCount,

          skipped:
            skippedCount,

          errors,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          `Impor selesai. ${createdCount} siswa baru ditambahkan, ${updatedCount} siswa diperbarui, dan ${skippedCount} data dilewati.`,

        created:
          createdCount,

        updated:
          updatedCount,

        skipped:
          skippedCount,

        totalProcessed:
          processedCount,

        errors,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/students/bulk ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memproses impor data siswa.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   DELETE /api/students/bulk
   HAPUS MASSAL SISWA
   HANYA ADMIN
============================================================ */

export async function DELETE(
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
       BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    const ids =
      normalizeIds(
        body?.ids
      );

    if (
      ids.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Tidak ada siswa yang dipilih.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK DATA YANG TERSEDIA
    -------------------------------------------------------- */

    const students =
      await prisma.student.findMany({
        where: {
          id: {
            in:
              ids,
          },
        },

        select: {
          id: true,
          nisn: true,
          fullname: true,
          class_name: true,
        },
      });

    if (
      students.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data siswa yang dipilih tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    const validIds =
      students.map(
        (student) =>
          student.id
      );

    /* --------------------------------------------------------
       DELETE
    -------------------------------------------------------- */

    const result =
      await prisma.student.deleteMany({
        where: {
          id: {
            in:
              validIds,
          },
        },
      });

    return NextResponse.json(
      {
        success: true,

        message:
          `${result.count} data siswa berhasil dihapus.`,

        deleted:
          result.count,

        requested:
          ids.length,

        deletedData:
          students,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'DELETE /api/students/bulk ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Sebagian siswa tidak dapat dihapus karena masih terhubung dengan data akademik lainnya.',
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
          'Gagal melakukan hapus massal siswa.',
      },
      {
        status: 500,
      }
    );
  }
}