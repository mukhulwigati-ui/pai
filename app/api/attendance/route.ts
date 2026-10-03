import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_LEVEL = 'SD';

const MIN_GRADE = 1;
const MAX_GRADE = 6;

const VALID_STATUSES = [
  'HADIR',
  'SAKIT',
  'IZIN',
  'ALPA',
] as const;

type AttendanceStatus =
  (typeof VALID_STATUSES)[number];

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

function isValidStatus(
  value: string
): value is AttendanceStatus {
  return VALID_STATUSES.includes(
    value as AttendanceStatus
  );
}

/*
|--------------------------------------------------------------------------
| PARSE TANGGAL
|--------------------------------------------------------------------------
|
| Frontend mengirim:
|
| 2026-10-03
|
| Kita simpan sebagai UTC 00:00:00 agar konsisten
| dan tidak tergantung timezone server/Vercel.
|
*/

function parseDateOnly(
  value: unknown
): Date | null {
  const raw =
    String(
      value ?? ''
    ).trim();

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      raw
    )
  ) {
    return null;
  }

  const [
    yearText,
    monthText,
    dayText,
  ] = raw.split('-');

  const year =
    Number(
      yearText
    );

  const month =
    Number(
      monthText
    );

  const day =
    Number(
      dayText
    );

  if (
    !Number.isInteger(
      year
    ) ||
    !Number.isInteger(
      month
    ) ||
    !Number.isInteger(
      day
    )
  ) {
    return null;
  }

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day,
        0,
        0,
        0,
        0
      )
    );

  /*
   * Cegah tanggal tidak valid seperti:
   * 2026-02-31
   */
  if (
    date.getUTCFullYear() !==
      year ||
    date.getUTCMonth() !==
      month - 1 ||
    date.getUTCDate() !==
      day
  ) {
    return null;
  }

  return date;
}

function addUtcDays(
  date: Date,
  days: number
) {
  const result =
    new Date(
      date.getTime()
    );

  result.setUTCDate(
    result.getUTCDate() +
      days
  );

  return result;
}

function getIndonesianDay(
  date: Date
): string {
  const days = [
    'Minggu',
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
  ];

  return (
    days[
      date.getUTCDay()
    ] || ''
  );
}

/* ============================================================
   GET /api/attendance

   Filter:
   ?className=1A
   ?startDate=2026-10-01
   ?endDate=2026-10-31

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
      rawClassName &&
      rawClassName !==
        'SEMUA'
        ? normalizeClassName(
            rawClassName
          )
        : '';

    const startDateParam =
      searchParams.get(
        'startDate'
      );

    const endDateParam =
      searchParams.get(
        'endDate'
      );

    /* --------------------------------------------------------
       VALIDASI TANGGAL
    -------------------------------------------------------- */

    let startDate:
      Date | null =
      null;

    let endDate:
      Date | null =
      null;

    if (
      startDateParam
    ) {
      startDate =
        parseDateOnly(
          startDateParam
        );

      if (!startDate) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Tanggal awal tidak valid.',
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      endDateParam
    ) {
      endDate =
        parseDateOnly(
          endDateParam
        );

      if (!endDate) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Tanggal akhir tidak valid.',
          },
          {
            status: 400,
          }
        );
      }
    }

    if (
      startDate &&
      endDate &&
      startDate.getTime() >
        endDate.getTime()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Tanggal awal tidak boleh melebihi tanggal akhir.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       AMBIL SEMUA KELAS SD VALID

       Tidak memfilter status Aktif di sini karena
       riwayat kelas lama tetap boleh dibaca.
    -------------------------------------------------------- */

    const sdClasses =
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
          grade: true,
          level: true,
        },
      });

    const validClassNames =
      sdClasses.map(
        (
          item
        ) =>
          item.name
      );

    /* --------------------------------------------------------
       JIKA FILTER KELAS DIPAKAI,
       PASTIKAN KELAS MEMANG KELAS SD
    -------------------------------------------------------- */

    if (
      className &&
      !validClassNames.some(
        (
          item
        ) =>
          normalizeClassName(
            item
          ) ===
          className
      )
    ) {
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

    /*
     * Gunakan nama asli dari database.
     */
    const canonicalClassName =
      className
        ? sdClasses.find(
            (
              item
            ) =>
              normalizeClassName(
                item.name
              ) ===
              className
          )?.name ||
          className
        : '';

    /* --------------------------------------------------------
       WHERE DINAMIS
    -------------------------------------------------------- */

    const dateFilter =
      startDate ||
      endDate
        ? {
            ...(startDate
              ? {
                  gte:
                    startDate,
                }
              : {}),

            ...(endDate
              ? {
                  /*
                   * Pakai lt hari berikutnya,
                   * sehingga seluruh tanggal akhir tercakup.
                   */
                  lt:
                    addUtcDays(
                      endDate,
                      1
                    ),
                }
              : {}),
          }
        : undefined;

    const whereCondition = {
      /*
       * Hanya tampilkan riwayat kelas jenjang SD.
       */
      ...(validClassNames.length >
      0
        ? {
            className: className
              ? canonicalClassName
              : {
                  in:
                    validClassNames,
                },
          }
        : {
            /*
             * Bila belum ada kelas SD,
             * jangan tampilkan data kelas lama.
             */
            className: {
              in: [],
            },
          }),

      ...(dateFilter
        ? {
            date:
              dateFilter,
          }
        : {}),
    };

    /* --------------------------------------------------------
       QUERY
    -------------------------------------------------------- */

    const attendances =
      await prisma.attendance.findMany({
        where:
          whereCondition,

        include: {
          student: true,
        },

        orderBy: [
          {
            date:
              'desc',
          },
          {
            className:
              'asc',
          },
          {
            studentId:
              'asc',
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
          attendances.length,

        data:
          attendances,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'GET /api/attendance ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat data kehadiran.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/attendance

   MENAMBAH / MEMPERBARUI KEHADIRAN SISWA
   BISA TUNGGAL ATAU MASSAL

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

    const items:
      unknown[] =
      Array.isArray(
        body
      )
        ? body
        : [
            body,
          ];

    if (
      items.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data kehadiran kosong.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       BATAS SEDERHANA AGAR REQUEST TIDAK BERLEBIHAN
    -------------------------------------------------------- */

    if (
      items.length >
      500
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Maksimal 500 data kehadiran dalam satu kali penyimpanan.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       NORMALISASI ITEM
    -------------------------------------------------------- */

    const normalizedItems:
      Array<{
        row: number;
        studentId: number;
        status: string;
        date: Date | null;
        rawDate: string;
      }> = [];

    const errors:
      Array<{
        row: number;
        studentId?: number;
        message: string;
      }> = [];

    items.forEach(
      (
        rawItem,
        index
      ) => {
        const item =
          rawItem &&
          typeof rawItem ===
            'object'
            ? rawItem as Record<
                string,
                unknown
              >
            : {};

        const studentId =
          Number(
            item.studentId
          );

        const status =
          String(
            item.status ??
              ''
          )
            .trim()
            .toUpperCase();

        /*
         * Tanggal wajib eksplisit.
         *
         * Jangan otomatis memakai new Date(),
         * karena bisa menyebabkan data tersimpan
         * ke tanggal yang tidak disengaja.
         */
        const rawDate =
          String(
            item.date ??
              ''
          ).trim();

        const date =
          parseDateOnly(
            rawDate
          );

        const row =
          index + 1;

        if (
          !Number.isInteger(
            studentId
          ) ||
          studentId <= 0
        ) {
          errors.push({
            row,
            message:
              'ID siswa tidak valid.',
          });

          return;
        }

        if (
          !isValidStatus(
            status
          )
        ) {
          errors.push({
            row,
            studentId,
            message:
              'Status kehadiran tidak valid. Gunakan HADIR, SAKIT, IZIN, atau ALPA.',
          });

          return;
        }

        if (!date) {
          errors.push({
            row,
            studentId,
            message:
              'Tanggal kehadiran tidak valid. Gunakan format YYYY-MM-DD.',
          });

          return;
        }

        normalizedItems.push({
          row,
          studentId,
          status,
          date,
          rawDate,
        });
      }
    );

    /* --------------------------------------------------------
       JIKA SEMUA INPUT DASAR INVALID
    -------------------------------------------------------- */

    if (
      normalizedItems.length ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Tidak ada data kehadiran yang valid.',

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
       CEGAH SISWA + TANGGAL SAMA DI PAYLOAD YANG SAMA

       Jika ada duplikat, item terakhir yang dipakai.
    -------------------------------------------------------- */

    const uniqueMap =
      new Map<
        string,
        (typeof normalizedItems)[number]
      >();

    for (
      const item of normalizedItems
    ) {
      const dateKey =
        item.rawDate;

      uniqueMap.set(
        `${item.studentId}:${dateKey}`,
        item
      );
    }

    const uniqueItems =
      Array.from(
        uniqueMap.values()
      );

    /* --------------------------------------------------------
       AMBIL SISWA SEKALIGUS
    -------------------------------------------------------- */

    const studentIds =
      Array.from(
        new Set(
          uniqueItems.map(
            (
              item
            ) =>
              item.studentId
          )
        )
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
       AMBIL KELAS SD AKTIF
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

    const classMap =
      new Map<
        string,
        (typeof classRooms)[number]
      >();

    for (
      const classRoom of classRooms
    ) {
      classMap.set(
        normalizeClassName(
          classRoom.name
        ),
        classRoom
      );
    }

    /* --------------------------------------------------------
       PROSES
    -------------------------------------------------------- */

    const results = [];

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount =
      errors.length;

    for (
      const item of uniqueItems
    ) {
      const student =
        studentMap.get(
          item.studentId
        );

      /* ------------------------------------------------------
         CEK SISWA
      ------------------------------------------------------ */

      if (!student) {
        skippedCount++;

        errors.push({
          row:
            item.row,

          studentId:
            item.studentId,

          message:
            'Data siswa tidak ditemukan.',
        });

        continue;
      }

      /* ------------------------------------------------------
         CEK KELAS SISWA
      ------------------------------------------------------ */

      const studentClass =
        normalizeClassName(
          student.class_name
        );

      if (
        !studentClass
      ) {
        skippedCount++;

        errors.push({
          row:
            item.row,

          studentId:
            student.id,

          message:
            `Siswa ${student.fullname} belum memiliki kelas.`,
        });

        continue;
      }

      const classRoom =
        classMap.get(
          studentClass
        );

      if (!classRoom) {
        skippedCount++;

        errors.push({
          row:
            item.row,

          studentId:
            student.id,

          message:
            `Kelas ${student.class_name} milik siswa ${student.fullname} bukan kelas SD yang valid.`,
        });

        continue;
      }

      /* ------------------------------------------------------
         CEK KELAS AKTIF
      ------------------------------------------------------ */

      if (
        String(
          classRoom.status ||
            ''
        )
          .trim()
          .toLowerCase() ===
        'tidak aktif'
      ) {
        skippedCount++;

        errors.push({
          row:
            item.row,

          studentId:
            student.id,

          message:
            `Kelas ${classRoom.name} sedang berstatus Tidak Aktif.`,
        });

        continue;
      }

      const targetDate =
        item.date as Date;

      const nextDate =
        addUtcDays(
          targetDate,
          1
        );

      /* ------------------------------------------------------
         CARI ABSENSI SISWA DI TANGGAL YANG SAMA
      ------------------------------------------------------ */

      const existingAttendance =
        await prisma.attendance.findFirst({
          where: {
            studentId:
              student.id,

            date: {
              gte:
                targetDate,

              lt:
                nextDate,
            },
          },

          select: {
            id: true,
          },
        });

      /* ------------------------------------------------------
         HARI
      ------------------------------------------------------ */

      const day =
        getIndonesianDay(
          targetDate
        );

      /* ------------------------------------------------------
         UPDATE
      ------------------------------------------------------ */

      if (
        existingAttendance
      ) {
        const attendanceRecord =
          await prisma.attendance.update({
            where: {
              id:
                existingAttendance.id,
            },

            data: {
              status:
                item.status,

              date:
                targetDate,

              className:
                classRoom.name,

              day,
            },

            include: {
              student:
                true,
            },
          });

        results.push(
          attendanceRecord
        );

        updatedCount++;

        continue;
      }

      /* ------------------------------------------------------
         CREATE
      ------------------------------------------------------ */

      const attendanceRecord =
        await prisma.attendance.create({
          data: {
            studentId:
              student.id,

            status:
              item.status,

            date:
              targetDate,

            className:
              classRoom.name,

            day,
          },

          include: {
            student:
              true,
          },
        });

      results.push(
        attendanceRecord
      );

      createdCount++;
    }

    /* --------------------------------------------------------
       HASIL
    -------------------------------------------------------- */

    const savedCount =
      createdCount +
      updatedCount;

    if (
      savedCount ===
      0
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Tidak ada data kehadiran yang berhasil disimpan.',

          created:
            createdCount,

          updated:
            updatedCount,

          saved:
            savedCount,

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
          `${savedCount} data kehadiran berhasil disimpan. ${createdCount} data baru dan ${updatedCount} data diperbarui${skippedCount > 0 ? `, ${skippedCount} data dilewati` : ''}.`,

        created:
          createdCount,

        updated:
          updatedCount,

        saved:
          savedCount,

        skipped:
          skippedCount,

        errors,

        data:
          results,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/attendance ERROR:',
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
            'Data kehadiran siswa pada tanggal tersebut sudah tercatat.',
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
            'Data siswa yang digunakan pada kehadiran tidak valid.',
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
            'Data kehadiran atau siswa tidak ditemukan.',
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
          'Gagal menyimpan data kehadiran siswa.',
      },
      {
        status: 500,
      }
    );
  }
}