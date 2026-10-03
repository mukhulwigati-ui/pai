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
   GET /api/assignments
   AMBIL SEMUA DATA PENUGASAN
   HANYA ADMIN
============================================================ */

export async function GET() {
  try {
    /* --------------------------------------------------------
       CEK AUTHORIZATION
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
       AMBIL DATA PENUGASAN
    -------------------------------------------------------- */

    const assignments =
      await prisma.assignment.findMany({
        include: {
          teacher: {
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
          },

          subject: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },

        orderBy: [
          {
            className: 'asc',
          },
          {
            id: 'desc',
          },
        ],
      });

    /* --------------------------------------------------------
       FILTER TAMBAHAN

       Hanya penugasan mapel jenjang SD yang
       ditampilkan.
    -------------------------------------------------------- */

    const sdAssignments =
      assignments.filter(
        (assignment) =>
          !assignment.subject?.level ||
          String(
            assignment.subject.level
          ).toUpperCase() ===
            SCHOOL_LEVEL
      );

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        total:
          sdAssignments.length,

        data:
          sdAssignments,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      'GET ASSIGNMENTS ERROR:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          'Gagal memuat data penugasan.',
      },
      {
        status: 500,
      }
    );
  }
}

/* ============================================================
   POST /api/assignments
   TAMBAH PENUGASAN USTADZ / USTADZAH
   HANYA ADMIN
============================================================ */

export async function POST(
  request: Request
) {
  try {
    /* --------------------------------------------------------
       CEK AUTHORIZATION
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

    const teacherId =
      Number(
        body?.teacherId
      );

    const subjectId =
      Number(
        body?.subjectId
      );

    const className =
      String(
        body?.className ?? ''
      )
        .trim()
        .toUpperCase();

    /* --------------------------------------------------------
       VALIDASI FIELD WAJIB
    -------------------------------------------------------- */

    if (
      !teacherId ||
      !subjectId ||
      !className
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Ustadz/Ustadzah, Mata Pelajaran, dan Kelas wajib dipilih.',
        },
        {
          status: 400,
        }
      );
    }

    if (
      !Number.isInteger(
        teacherId
      ) ||
      teacherId <= 0
    ) {
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

    if (
      !Number.isInteger(
        subjectId
      ) ||
      subjectId <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'ID mata pelajaran tidak valid.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK USTADZ / USTADZAH
    -------------------------------------------------------- */

    const teacher =
      await prisma.teacher.findUnique({
        where: {
          id:
            teacherId,
        },

        select: {
          id: true,
          fullname: true,
          role: true,
          status: true,
        },
      });

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

    /* --------------------------------------------------------
       PASTIKAN ROLE TEACHER
    -------------------------------------------------------- */

    if (
      String(
        teacher.role || ''
      ).toUpperCase() !==
      'TEACHER'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Akun yang dipilih bukan akun ustadz/ustadzah.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK STATUS
    -------------------------------------------------------- */

    if (
      String(
        teacher.status || ''
      ).toLowerCase() ===
      'nonaktif'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Ustadz/ustadzah tersebut sedang berstatus Nonaktif.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       CEK MATA PELAJARAN
       HARUS LEVEL SD
    -------------------------------------------------------- */

    const subject =
      await prisma.subject.findFirst({
        where: {
          id:
            subjectId,

          level:
            SCHOOL_LEVEL,
        },

        select: {
          id: true,
          name: true,
          level: true,
        },
      });

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Mata pelajaran jenjang SD tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       CEK KELAS
       HARUS KELAS SD 1-6
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
       CEK DUPLIKAT PENUGASAN

       Ustadz/Ustadzah + Mapel + Kelas yang sama
       tidak boleh dibuat dua kali.
    -------------------------------------------------------- */

    const existingAssignment =
      await prisma.assignment.findFirst({
        where: {
          teacherId,
          subjectId,
          className:
            classRoom.name,
        },

        select: {
          id: true,
        },
      });

    if (
      existingAssignment
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Penugasan ustadz/ustadzah untuk mata pelajaran dan kelas tersebut sudah ada.',
        },
        {
          status: 409,
        }
      );
    }

    /* --------------------------------------------------------
       CREATE ASSIGNMENT
    -------------------------------------------------------- */

    const newAssignment =
      await prisma.assignment.create({
        data: {
          teacherId,
          subjectId,
          className:
            classRoom.name,
        },

        include: {
          teacher: {
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
          },

          subject: {
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
      });

    /* --------------------------------------------------------
       RESPONSE
    -------------------------------------------------------- */

    return NextResponse.json(
      {
        success: true,

        message:
          'Penugasan ustadz/ustadzah berhasil disimpan.',

        data:
          newAssignment,
      },
      {
        status: 201,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'CREATE ASSIGNMENT ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /* --------------------------------------------------------
       DUPLICATE
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2002'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Penugasan tersebut sudah terdaftar.',
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
            'Ustadz/ustadzah atau mata pelajaran yang dipilih tidak ditemukan.',
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
          'Gagal menyimpan penugasan ustadz/ustadzah.',
      },
      {
        status: 500,
      }
    );
  }
}