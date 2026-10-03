import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

/* ============================================================
   HELPER: NORMALISASI ID
============================================================ */

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
   DELETE /api/teachers/bulk
   HAPUS BANYAK USTADZ / USTADZAH
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
       AMBIL BODY
    -------------------------------------------------------- */

    const body =
      await request.json();

    const ids =
      normalizeIds(
        body?.ids
      );

    /* --------------------------------------------------------
       VALIDASI
    -------------------------------------------------------- */

    if (
      ids.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Tidak ada data ustadz/ustadzah yang dipilih.',
        },
        {
          status: 400,
        }
      );
    }

    /* --------------------------------------------------------
       AMBIL DATA YANG AKAN DIHAPUS
    -------------------------------------------------------- */

    const teachers =
      await prisma.teacher.findMany(
        {
          where: {
            id: {
              in: ids,
            },
          },

          select: {
            id: true,
            identity_number: true,
            fullname: true,
            role: true,
            status: true,
          },
        }
      );

    if (
      teachers.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Data ustadz/ustadzah yang dipilih tidak ditemukan.',
        },
        {
          status: 404,
        }
      );
    }

    /* --------------------------------------------------------
       JANGAN IZINKAN ADMIN IKUT TERHAPUS
    -------------------------------------------------------- */

    const adminAccounts =
      teachers.filter(
        (teacher) =>
          String(
            teacher.role || ''
          ).toUpperCase() ===
          'ADMIN'
      );

    const teacherAccounts =
      teachers.filter(
        (teacher) =>
          String(
            teacher.role || ''
          ).toUpperCase() !==
          'ADMIN'
      );

    if (
      teacherAccounts.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Tidak ada akun ustadz/ustadzah yang dapat dihapus. Akun Administrator dilindungi.',
        },
        {
          status: 403,
        }
      );
    }

    const validIds =
      teacherAccounts.map(
        (teacher) =>
          teacher.id
      );

    /* --------------------------------------------------------
       HAPUS DATA

       Catatan:
       Akun ADMIN tidak dimasukkan ke validIds.
    -------------------------------------------------------- */

    const result =
      await prisma.teacher.deleteMany(
        {
          where: {
            id: {
              in:
                validIds,
            },

            role: {
              not:
                'ADMIN',
            },
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
          `${result.count} data ustadz/ustadzah berhasil dihapus.`,

        deleted:
          result.count,

        requested:
          ids.length,

        protectedAdmins:
          adminAccounts.length,

        deletedData:
          teacherAccounts.map(
            (teacher) => ({
              id:
                teacher.id,

              identity_number:
                teacher.identity_number,

              fullname:
                teacher.fullname,
            })
          ),

        protectedData:
          adminAccounts.map(
            (teacher) => ({
              id:
                teacher.id,

              fullname:
                teacher.fullname,
            })
          ),
      },
      {
        status: 200,
      }
    );
  } catch (
    error: unknown
  ) {
    console.error(
      'DELETE /api/teachers/bulk ERROR:',
      error
    );

    const prismaError =
      error as {
        code?: string;
      };

    /* --------------------------------------------------------
       FOREIGN KEY

       Misalnya ustadz/ustadzah masih dipakai:
       - Assignment
       - nilai
       - kelas
       - data akademik lainnya
    -------------------------------------------------------- */

    if (
      prismaError?.code ===
      'P2003'
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Sebagian data ustadz/ustadzah tidak dapat dihapus karena masih terhubung dengan data akademik lainnya.',
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
          'Gagal melakukan hapus massal ustadz/ustadzah.',
      },
      {
        status: 500,
      }
    );
  }
}