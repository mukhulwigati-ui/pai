import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ============================================================
   KONFIGURASI
============================================================ */

const SCHOOL_LEVEL = 'SD';

const VALID_GRADES = [
  1,
  2,
  3,
  4,
  5,
  6,
];

const VALID_STATUSES = [
  'NAIK',
  'TINGGAL',
  'LULUS',
] as const;

type PromotionStatus =
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

function normalizeUpper(
  value: unknown
): string {
  return normalizeText(
    value
  ).toUpperCase();
}

function toPositiveInteger(
  value: unknown
): number | null {
  const numberValue =
    Number(value);

  if (
    !Number.isInteger(
      numberValue
    ) ||
    numberValue <= 0
  ) {
    return null;
  }

  return numberValue;
}

function normalizeStudentIds(
  value: unknown
): number[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map(
          (
            item
          ) =>
            toPositiveInteger(
              item
            )
        )
        .filter(
          (
            item
          ): item is number =>
            item !== null
        )
    )
  );
}

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

  return (
    Number.isInteger(
      firstYear
    ) &&
    Number.isInteger(
      secondYear
    ) &&
    secondYear ===
      firstYear + 1
  );
}

function isValidPromotionStatus(
  value: string
): value is PromotionStatus {
  return VALID_STATUSES.includes(
    value as PromotionStatus
  );
}

function isInactiveStatus(
  status?: string | null
) {
  const normalized =
    normalizeText(
      status
    ).toLowerCase();

  return (
    normalized ===
      'nonaktif' ||
    normalized ===
      'tidak aktif'
  );
}

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
   GET /api/promotions
   AMBIL SISWA BERDASARKAN KELAS
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
       PARAMETER
    -------------------------------------------------------- */

    const {
      searchParams,
    } =
      new URL(
        request.url
      );

    const className =
      normalizeText(
        searchParams.get(
          'className'
        )
      ).toUpperCase();

    if (!className) {
      return errorResponse(
        'Parameter className wajib diisi.'
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
            in:
              VALID_GRADES,
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
      return errorResponse(
        'Kelas SD tidak ditemukan.',
        404
      );
    }

    if (
      isInactiveStatus(
        classRoom.status
      )
    ) {
      return errorResponse(
        `Kelas ${classRoom.name} sedang tidak aktif.`,
        400
      );
    }

    /* --------------------------------------------------------
       AMBIL SISWA
    -------------------------------------------------------- */

    const students =
      await prisma.student.findMany({
        where: {
          class_name:
            classRoom.name,
        },

        orderBy: {
          fullname:
            'asc',
        },

        select: {
          id: true,
          nisn: true,
          fullname: true,
          gender: true,
          class_name: true,
        },
      });

    return NextResponse.json(
      {
        success: true,

        class: {
          id:
            classRoom.id,

          name:
            classRoom.name,

          grade:
            classRoom.grade,

          level:
            classRoom.level,
        },

        total:
          students.length,

        data:
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
      'GET /api/promotions ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal mengambil data siswa.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/promotions

   PROSES:
   - NAIK
   - TINGGAL
   - LULUS

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

    const studentIds =
      normalizeStudentIds(
        body?.studentIds
      );

    const fromClass =
      normalizeText(
        body?.fromClass
      ).toUpperCase();

    const rawToClass =
      normalizeText(
        body?.toClass
      ).toUpperCase();

    const status =
      normalizeUpper(
        body?.status
      );

    const academicYear =
      normalizeText(
        body?.academicYear
      );

    const note =
      normalizeText(
        body?.note
      );

    /* ========================================================
       VALIDASI DASAR
    ======================================================== */

    if (
      studentIds.length ===
      0
    ) {
      return errorResponse(
        'Pilih minimal satu siswa.'
      );
    }

    if (
      !fromClass
    ) {
      return errorResponse(
        'Kelas asal wajib dipilih.'
      );
    }

    if (
      !isValidPromotionStatus(
        status
      )
    ) {
      return errorResponse(
        'Status keputusan tidak valid.'
      );
    }

    if (
      !academicYear
    ) {
      return errorResponse(
        'Tahun pelajaran wajib diisi.'
      );
    }

    if (
      !isValidAcademicYear(
        academicYear
      )
    ) {
      return errorResponse(
        'Format tahun pelajaran tidak valid. Gunakan format seperti 2026/2027.'
      );
    }

    if (
      note.length >
      1000
    ) {
      return errorResponse(
        'Catatan maksimal 1000 karakter.'
      );
    }

    /* ========================================================
       CEK KELAS ASAL
    ======================================================== */

    const sourceClass =
      await prisma.classRoom.findFirst({
        where: {
          name:
            fromClass,

          level:
            SCHOOL_LEVEL,

          grade: {
            in:
              VALID_GRADES,
          },
        },

        select: {
          id: true,
          name: true,
          grade: true,
          level: true,
          status: true,
        },
      });

    if (!sourceClass) {
      return errorResponse(
        'Kelas asal SD tidak ditemukan.',
        404
      );
    }

    if (
      isInactiveStatus(
        sourceClass.status
      )
    ) {
      return errorResponse(
        `Kelas ${sourceClass.name} sedang tidak aktif.`,
        400
      );
    }

    const sourceGrade =
      Number(
        sourceClass.grade
      );

    /* ========================================================
       VALIDASI STATUS NAIK
    ======================================================== */

    let targetClass:
      | {
          id: number;
          name: string;
          grade:
            number | null;
          level: string;
          status:
            string | null;
        }
      | null =
      null;

    if (
      status ===
      'NAIK'
    ) {
      if (
        sourceGrade >= 6
      ) {
        return errorResponse(
          'Siswa kelas 6 tidak dapat diproses sebagai naik kelas. Gunakan status Lulus.'
        );
      }

      if (
        !rawToClass
      ) {
        return errorResponse(
          `Kelas tujuan tingkat ${sourceGrade + 1} wajib dipilih.`
        );
      }

      if (
        rawToClass ===
        sourceClass.name
      ) {
        return errorResponse(
          'Kelas tujuan tidak boleh sama dengan kelas asal.'
        );
      }

      targetClass =
        await prisma.classRoom.findFirst({
          where: {
            name:
              rawToClass,

            level:
              SCHOOL_LEVEL,

            grade:
              sourceGrade +
              1,
          },

          select: {
            id: true,
            name: true,
            grade: true,
            level: true,
            status: true,
          },
        });

      if (!targetClass) {
        return errorResponse(
          `Kelas tujuan tingkat ${sourceGrade + 1} tidak ditemukan.`,
          404
        );
      }

      if (
        isInactiveStatus(
          targetClass.status
        )
      ) {
        return errorResponse(
          `Kelas tujuan ${targetClass.name} sedang tidak aktif.`
        );
      }
    }

    /* ========================================================
       VALIDASI STATUS LULUS
    ======================================================== */

    if (
      status ===
      'LULUS'
    ) {
      if (
        sourceGrade !== 6
      ) {
        return errorResponse(
          'Kelulusan hanya dapat diproses untuk siswa kelas 6.'
        );
      }

      /*
       * LULUS tidak boleh dipindahkan
       * ke kelas internal.
       */
      if (
        rawToClass
      ) {
        return errorResponse(
          'Status Lulus tidak memerlukan kelas tujuan.'
        );
      }
    }

    /* ========================================================
       STATUS TINGGAL
    ======================================================== */

    if (
      status ===
      'TINGGAL'
    ) {
      /*
       * Untuk tinggal kelas,
       * kelas tujuan selalu kelas asal.
       */
      targetClass =
        null;
    }

    /* ========================================================
       AMBIL SISWA
    ======================================================== */

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
          fullname: true,
          nisn: true,
          class_name: true,
        },
      });

    if (
      students.length ===
      0
    ) {
      return errorResponse(
        'Data siswa tidak ditemukan.',
        404
      );
    }

    if (
      students.length !==
      studentIds.length
    ) {
      return errorResponse(
        'Sebagian data siswa tidak ditemukan. Silakan muat ulang halaman dan coba lagi.',
        404
      );
    }

    /* ========================================================
       PASTIKAN SEMUA SISWA BERASAL DARI KELAS ASAL
    ======================================================== */

    const invalidStudents =
      students.filter(
        (
          student
        ) =>
          student.class_name !==
          sourceClass.name
      );

    if (
      invalidStudents.length >
      0
    ) {
      const names =
        invalidStudents
          .slice(
            0,
            3
          )
          .map(
            (
              student
            ) =>
              student.fullname
          )
          .join(
            ', '
          );

      return errorResponse(
        `Sebagian siswa tidak lagi berada di kelas ${sourceClass.name}: ${names}${invalidStudents.length > 3 ? ' dan lainnya' : ''}. Silakan muat ulang data.`,
        409
      );
    }

    /* ========================================================
       TRANSACTION
    ======================================================== */

    const result =
      await prisma.$transaction(
        async (
          tx
        ) => {
          const promotions =
            [];

          for (
            const student of students
          ) {
            /* ------------------------------------------------
               TENTUKAN DESTINASI RIWAYAT
            ------------------------------------------------ */

            let finalToClass:
              string;

            if (
              status ===
              'NAIK'
            ) {
              finalToClass =
                targetClass!.name;
            } else if (
              status ===
              'TINGGAL'
            ) {
              finalToClass =
                sourceClass.name;
            } else {
              /*
               * Karena schema lama tampaknya
               * toClass wajib string,
               * simpan "LULUS" untuk riwayat.
               *
               * Student.class_name TIDAK diubah.
               */
              finalToClass =
                'LULUS';
            }

            /* ------------------------------------------------
               UPDATE KELAS SISWA
               HANYA NAIK
            ------------------------------------------------ */

            if (
              status ===
              'NAIK'
            ) {
              await tx.student.update({
                where: {
                  id:
                    student.id,
                },

                data: {
                  class_name:
                    targetClass!
                      .name,
                },
              });
            }

            /*
             * TINGGAL:
             * class_name tetap.
             *
             * LULUS:
             * class_name juga tetap kelas 6.
             * Tidak diganti menjadi "LULUS".
             */

            /* ------------------------------------------------
               SIMPAN RIWAYAT
            ------------------------------------------------ */

            const promotion =
              await tx.studentPromotion.upsert({
                where: {
                  studentId_academicYear:
                    {
                      studentId:
                        student.id,

                      academicYear,
                    },
                },

                update: {
                  fromClass:
                    sourceClass.name,

                  toClass:
                    finalToClass,

                  status,

                  note:
                    note ||
                    null,

                  promotedAt:
                    new Date(),
                },

                create: {
                  studentId:
                    student.id,

                  academicYear,

                  fromClass:
                    sourceClass.name,

                  toClass:
                    finalToClass,

                  status,

                  note:
                    note ||
                    null,
                },
              });

            promotions.push(
              promotion
            );
          }

          return promotions;
        }
      );

    /* ========================================================
       RESPONSE MESSAGE
    ======================================================== */

    let message =
      '';

    if (
      status ===
      'NAIK'
    ) {
      message =
        `${result.length} siswa berhasil dinaikkan dari kelas ${sourceClass.name} ke kelas ${targetClass!.name}.`;
    } else if (
      status ===
      'TINGGAL'
    ) {
      message =
        `${result.length} siswa berhasil ditetapkan tetap di kelas ${sourceClass.name}.`;
    } else {
      message =
        `${result.length} siswa kelas ${sourceClass.name} berhasil dinyatakan lulus dari SD.`;
    }

    return NextResponse.json(
      {
        success: true,

        message,

        summary: {
          status,

          academicYear,

          fromClass:
            sourceClass.name,

          toClass:
            status ===
            'NAIK'
              ? targetClass!
                  .name
              : status ===
                  'TINGGAL'
                ? sourceClass.name
                : null,

          total:
            result.length,
        },

        data:
          result,
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'POST /api/promotions ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /* --------------------------------------------------------
       UNIQUE
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,

          message:
            'Riwayat kenaikan kelas untuk siswa tersebut pada tahun pelajaran ini sudah tercatat.',
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
            'Terdapat relasi siswa atau kelas yang tidak valid.',
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
            'Data siswa atau riwayat kenaikan kelas tidak ditemukan.',
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
          'Gagal memproses kenaikan kelas atau kelulusan siswa.',
      },
      {
        status: 500,
      }
    );
  }
}