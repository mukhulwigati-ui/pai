import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';
const fail = (message: string, status = 400) => NextResponse.json({ success: false, message }, { status });
const include = {
  teacher: { select: { id: true, fullname: true } },
  cps: { include: { tps: true } },
  members: { where: { leftAt: null }, include: { student: { select: { id: true, fullname: true, class_name: true } } } },
};
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.authorized) return fail(auth.message, auth.status);
  try {
    const [data, teachers, cps, settings, students] = await Promise.all([
      prisma.halaqah.findMany({ where: { active: true }, include, orderBy: [{ jilid: 'asc' }, { name: 'asc' }] }),
      prisma.teacher.findMany({ select: { id: true, fullname: true }, orderBy: { fullname: 'asc' } }),
      prisma.cP.findMany({ where: { subject: { name: { equals: 'Tartili', mode: 'insensitive' }, level: 'SD' } }, include: { tps: true }, orderBy: { id: 'asc' } }),
      prisma.systemSetting.findFirst({ orderBy: { id: 'asc' } }),
      prisma.student.findMany({ where: { class_name: { in: (await prisma.classRoom.findMany({ where: { level: 'SD' }, select: { name: true } })).map(item => item.name) } }, select: { id: true, fullname: true, class_name: true }, orderBy: { fullname: 'asc' } }),
    ]);
    return NextResponse.json({ success: true, data, teachers, cps, settings, students });
  } catch (error) {
  console.error('[GET /api/halaqah]', error);

  return fail(
    'Gagal memuat halaqah. Periksa error pada terminal server.',
    500
  );
}
}
export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.authorized) return fail(auth.message, auth.status);
  let body;
  try { body = await request.json(); } catch { return fail('JSON tidak valid.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fail('Data tidak valid.');
  const { id, name, jilid, academicYear, semester, teacherId, studentIds, cpIds } = body;
  const positive = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
  if ((id !== undefined && !positive(id)) || typeof name !== 'string' || !name.trim() || name.length > 100 ||
      !positive(jilid) || jilid > 20 || typeof academicYear !== 'string' || !/^\d{4}\/\d{4}$/.test(academicYear) ||
      ![1, 2].includes(semester) || (teacherId !== null && !positive(teacherId)) ||
      !Array.isArray(studentIds) || studentIds.length > 500 || !studentIds.every(positive) ||
      !Array.isArray(cpIds) || !cpIds.length || cpIds.length > 100 || !cpIds.every(positive)) return fail('Lengkapi data halaqah, CP, dan anggota dengan benar.');
  const ids = [...new Set<number>(studentIds)];
  const curriculumIds = [...new Set<number>(cpIds)];
  try {
    const group = await prisma.$transaction(async tx => {
      // Serialisasi pengubahan keanggotaan agar dua admin tidak memasukkan anak
      // ke kelompok berbeda pada periode yang sama secara bersamaan.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74321001)`;
      const settings = await tx.systemSetting.findFirst({ orderBy: { id: 'asc' } });
      const currentSemester = /genap|2/i.test(settings?.semester || '') ? 2 : 1;
      if (academicYear !== settings?.academicYear || semester !== currentSemester) throw new Error('Pengubahan halaqah hanya untuk periode aktif pada pengaturan sekolah.');
      if (id && !(await tx.halaqah.findUnique({ where: { id } }))) throw new Error('Halaqah tidak ditemukan.');
      if (teacherId && !(await tx.teacher.findUnique({ where: { id: teacherId } }))) throw new Error('Guru tidak ditemukan.');
      const classrooms = await tx.classRoom.findMany({ where: { level: 'SD' }, select: { name: true } });
      if (await tx.student.count({ where: { id: { in: ids }, class_name: { in: classrooms.map(item => item.name) } } }) !== ids.length) throw new Error('Anggota harus berasal dari data anak SD.');
      if (await tx.cP.count({ where: { id: { in: curriculumIds }, semester, subject: { name: { equals: 'Tartili', mode: 'insensitive' }, level: 'SD' } } }) !== curriculumIds.length) throw new Error('Pilih CP Tartili untuk semester aktif.');
      const conflict = await tx.halaqahMember.findFirst({ where: { studentId: { in: ids }, leftAt: null, halaqah: { active: true, academicYear, semester }, ...(id ? { halaqahId: { not: id } } : {}) }, include: { student: true, halaqah: true } });
      if (conflict) throw new Error(`${conflict.student.fullname} masih menjadi anggota ${conflict.halaqah.name}. Keluarkan dari kelompok lama sebelum dipindahkan.`);
      const values = { name: name.trim(), jilid, academicYear, semester, teacherId, cps: { set: curriculumIds.map(id => ({ id })) } };
      const saved = id ? await tx.halaqah.update({ where: { id }, data: values }) : await tx.halaqah.create({ data: { ...values, cps: { connect: curriculumIds.map(id => ({ id })) } } });
      const previous = await tx.halaqahMember.findMany({ where: { halaqahId: saved.id, leftAt: null } });
      await tx.halaqahMember.updateMany({ where: { halaqahId: saved.id, leftAt: null, studentId: { notIn: ids } }, data: { leftAt: new Date() } });
      const existing = new Set(previous.map(item => item.studentId));
      const additions = ids.filter(studentId => !existing.has(studentId));
      if (additions.length) await tx.halaqahMember.createMany({ data: additions.map(studentId => ({ halaqahId: saved.id, studentId })) });
      return saved;
    });
    return NextResponse.json({ success: true, message: 'Halaqah berhasil disimpan.', data: group });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') return fail('Nama halaqah sudah dipakai pada periode ini.', 409);
    return fail(error instanceof Error && !error.message.includes('Invalid') ? error.message : 'Gagal menyimpan halaqah.');
  }
}
