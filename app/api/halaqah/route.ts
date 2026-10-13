import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const runtime = 'nodejs';

const SCHOOL_LEVEL = 'SD';

const include = {
  teacher: {
    select: {
      id: true,
      fullname: true,
    },
  },
  cps: {
    include: {
      tps: {
        orderBy: {
          id: 'asc' as const,
        },
      },
    },
    orderBy: {
      id: 'asc' as const,
    },
  },
  members: {
    where: {
      leftAt: null,
    },
    include: {
      student: {
        select: {
          id: true,
          fullname: true,
          class_name: true,
        },
      },
    },
  },
};

class ValidationError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

function fail(message: string, status = 400) {
  return NextResponse.json(
    { success: false, message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

function positive(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value > 0
  );
}

function semesterNumber(value: unknown): number | null {
  const text = String(value ?? '').trim().toLowerCase();

  if (['ganjil', '1', 'semester 1'].includes(text)) return 1;
  if (['genap', '2', 'semester 2'].includes(text)) return 2;

  return null;
}

function tartiliSubjectScope() {
  return {
    name: {
      equals: 'Tartili',
      mode: 'insensitive' as const,
    },
    level: SCHOOL_LEVEL,
  };
}

function sameIds(first: number[], second: number[]) {
  const firstSet = new Set(first);

  return (
    firstSet.size === second.length &&
    second.every(id => firstSet.has(id))
  );
}

function handleError(error: unknown, operation: string) {
  console.error(`[${operation} /api/halaqah]`, error);

  if (error instanceof ValidationError) {
    return fail(error.message, error.status);
  }

  const code = (
    error as { code?: string } | null
  )?.code;

  if (code === 'P2002') {
    return fail(
      'Nama halaqah sudah digunakan pada periode ini.',
      409
    );
  }

  if (code === 'P2021' || code === 'P2022') {
    return fail(
      'Struktur database halaqah belum sesuai. Periksa log server.',
      503
    );
  }

  if (code === 'P2025') {
    return fail('Halaqah tidak ditemukan.', 404);
  }

  return fail(
    operation === 'GET'
      ? 'Gagal memuat halaqah. Periksa log server.'
      : 'Gagal menyimpan halaqah. Periksa log server.',
    500
  );
}

/**
 * Memuat halaqah dan menyelaraskan relasi CP untuk periode aktif.
 *
 * Aturan Tartili:
 * CP.grade = jilid halaqah
 * CP.semester = semester halaqah
 *
 * Relasi disimpan agar API assessment dan report yang sudah ada
 * tetap dapat menggunakan halaqah.cps.
 */
export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return fail(auth.message, auth.status);
    }

    const result = await prisma.$transaction(
      async tx => {
        // Gunakan lock yang sama dengan proses penyimpanan halaqah.
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(74321001)
        `;

        const settings = await tx.systemSetting.findFirst({
          orderBy: { id: 'asc' },
        });

        const activeSemester = semesterNumber(settings?.semester);
        const academicYear = settings?.academicYear?.trim() || '';

        const cps = await tx.cP.findMany({
          where: {
            subject: tartiliSubjectScope(),
            grade: { gte: 1, lte: 7 },
            semester: { in: [1, 2] },
          },
          include: {
            tps: {
              orderBy: { id: 'asc' },
            },
          },
          orderBy: [
            { grade: 'asc' },
            { semester: 'asc' },
            { id: 'asc' },
          ],
        });

        const groups = await tx.halaqah.findMany({
          where: { active: true },
          select: {
            id: true,
            jilid: true,
            semester: true,
            academicYear: true,
            cps: {
              select: { id: true },
            },
          },
        });

        for (const group of groups) {
          // Relasi periode lama tidak diubah.
          if (
            !activeSemester ||
            group.academicYear.trim() !== academicYear ||
            group.semester !== activeSemester
          ) {
            continue;
          }

          const matchingIds = cps
            .filter(
              cp =>
                cp.grade === group.jilid &&
                cp.semester === group.semester
            )
            .map(cp => cp.id);

          const existingIds = group.cps.map(cp => cp.id);

          if (!sameIds(existingIds, matchingIds)) {
            await tx.halaqah.update({
              where: { id: group.id },
              data: {
                cps: {
                  set: matchingIds.map(id => ({ id })),
                },
              },
            });
          }
        }

        const data = await tx.halaqah.findMany({
          where: { active: true },
          include,
          orderBy: [
            { jilid: 'asc' },
            { name: 'asc' },
          ],
        });

        return { data, cps, settings };
      },
      { maxWait: 10000, timeout: 30000 }
    );

    const [teachers, classrooms] = await Promise.all([
      prisma.teacher.findMany({
        select: {
          id: true,
          fullname: true,
        },
        orderBy: { fullname: 'asc' },
      }),
      prisma.classRoom.findMany({
        where: { level: SCHOOL_LEVEL },
        select: { name: true },
      }),
    ]);

    const students = await prisma.student.findMany({
      where: {
        class_name: {
          in: classrooms.map(item => item.name),
        },
      },
      select: {
        id: true,
        fullname: true,
        class_name: true,
      },
      orderBy: { fullname: 'asc' },
    });

    return NextResponse.json(
      {
        success: true,
        ...result,
        teachers,
        students,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return handleError(error, 'GET');
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();

    if (!auth.authorized) {
      return fail(auth.message, auth.status);
    }

    let rawBody: unknown;

    try {
      rawBody = await request.json();
    } catch {
      return fail('JSON tidak valid.');
    }

    if (
      !rawBody ||
      typeof rawBody !== 'object' ||
      Array.isArray(rawBody)
    ) {
      return fail('Data permintaan tidak valid.');
    }

    const body = rawBody as Record<string, unknown>;

    const {
      id,
      name,
      jilid,
      academicYear,
      semester,
      studentIds,
    } = body;

    const teacherId = body.teacherId ?? null;

    if (
      (id !== undefined && !positive(id)) ||
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 100 ||
      !positive(jilid) ||
      jilid > 7 ||
      typeof academicYear !== 'string' ||
      !/^\d{4}\/\d{4}$/.test(academicYear.trim()) ||
      !positive(semester) ||
      ![1, 2].includes(semester) ||
      (teacherId !== null && !positive(teacherId)) ||
      !Array.isArray(studentIds) ||
      studentIds.length > 500 ||
      !studentIds.every(positive)
    ) {
      return fail(
        'Lengkapi nama, jilid, periode, guru, dan anggota dengan benar. ' +
        'Jilid yang tersedia adalah 1–6 dan 7 untuk Ghorib.'
      );
    }

    const memberIds = [...new Set<number>(studentIds)];
    const cleanYear = academicYear.trim();

    // cpIds dari halaman lama sengaja tidak digunakan.
    // CP ditentukan server berdasarkan jilid dan semester.
    const group = await prisma.$transaction(
      async tx => {
        await tx.$executeRaw`
          SELECT pg_advisory_xact_lock(74321001)
        `;

        const settings = await tx.systemSetting.findFirst({
          orderBy: { id: 'asc' },
        });

        const currentSemester = semesterNumber(settings?.semester);

        if (!settings || !currentSemester) {
          throw new ValidationError(
            'Lengkapi tahun ajaran dan semester pada Pengaturan sekolah.'
          );
        }

        if (
          cleanYear !== settings.academicYear.trim() ||
          semester !== currentSemester
        ) {
          throw new ValidationError(
            'Halaqah hanya dapat disimpan untuk periode aktif pada Pengaturan sekolah.'
          );
        }

        if (id !== undefined) {
          const existing = await tx.halaqah.findUnique({
            where: { id },
            select: { id: true },
          });

          if (!existing) {
            throw new ValidationError(
              'Halaqah tidak ditemukan.',
              404
            );
          }
        }

        if (teacherId !== null) {
          const teacher = await tx.teacher.findUnique({
            where: { id: teacherId },
            select: { id: true },
          });

          if (!teacher) {
            throw new ValidationError('Guru tidak ditemukan.', 404);
          }
        }

        const classrooms = await tx.classRoom.findMany({
          where: { level: SCHOOL_LEVEL },
          select: { name: true },
        });

        const validMemberCount = await tx.student.count({
          where: {
            id: { in: memberIds },
            class_name: {
              in: classrooms.map(item => item.name),
            },
          },
        });

        if (validMemberCount !== memberIds.length) {
          throw new ValidationError(
            'Anggota halaqah harus berasal dari data siswa SD.'
          );
        }

        const conflict = await tx.halaqahMember.findFirst({
          where: {
            studentId: { in: memberIds },
            leftAt: null,
            halaqah: {
              active: true,
              academicYear: cleanYear,
              semester,
            },
            ...(id !== undefined
              ? { halaqahId: { not: id } }
              : {}),
          },
          include: {
            student: true,
            halaqah: true,
          },
        });

        if (conflict) {
          throw new ValidationError(
            `${conflict.student.fullname} masih menjadi anggota ` +
            `${conflict.halaqah.name}. Keluarkan dari kelompok lama sebelum dipindahkan.`,
            409
          );
        }

        const matchingCPs = await tx.cP.findMany({
          where: {
            grade: jilid,
            semester,
            subject: tartiliSubjectScope(),
          },
          select: { id: true },
          orderBy: { id: 'asc' },
        });

        const cpConnections = matchingCPs.map(cp => ({
          id: cp.id,
        }));

        const values = {
          name: name.trim(),
          jilid,
          academicYear: cleanYear,
          semester,
          teacherId,
          active: true,
        };

        const saved = id !== undefined
          ? await tx.halaqah.update({
              where: { id },
              data: {
                ...values,
                cps: { set: cpConnections },
              },
            })
          : await tx.halaqah.create({
              data: {
                ...values,
                cps: { connect: cpConnections },
              },
            });

        const previousMembers = await tx.halaqahMember.findMany({
          where: {
            halaqahId: saved.id,
            leftAt: null,
          },
          select: { studentId: true },
        });

        await tx.halaqahMember.updateMany({
          where: {
            halaqahId: saved.id,
            leftAt: null,
            studentId: { notIn: memberIds },
          },
          data: { leftAt: new Date() },
        });

        const existingIds = new Set(
          previousMembers.map(member => member.studentId)
        );

        const additions = memberIds.filter(
          studentId => !existingIds.has(studentId)
        );

        if (additions.length) {
          await tx.halaqahMember.createMany({
            data: additions.map(studentId => ({
              halaqahId: saved.id,
              studentId,
            })),
          });
        }

        return tx.halaqah.findUniqueOrThrow({
          where: { id: saved.id },
          include,
        });
      },
      { maxWait: 10000, timeout: 30000 }
    );

    const totalTP = group.cps.reduce(
      (total, cp) => total + cp.tps.length,
      0
    );

    const message = totalTP > 0
      ? `Halaqah berhasil disimpan. ${group.cps.length} CP dan ${totalTP} TP otomatis terhubung.`
      : group.cps.length > 0
        ? 'Halaqah berhasil disimpan dan CP otomatis terhubung. Tambahkan TP pada CP tersebut sebelum input nilai.'
        : 'Halaqah berhasil disimpan. CP Tartili untuk jilid dan semester ini belum tersedia. Setelah CP/TP dibuat, muat ulang halaman halaqah agar otomatis terhubung.';

    return NextResponse.json(
      {
        success: true,
        message,
        data: group,
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    return handleError(error, 'POST');
  }
}