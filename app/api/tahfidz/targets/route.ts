import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
const surahs: Record<number, string> = {
  67:'Al-Mulk',68:'Al-Qalam',69:'Al-Haqqah',70:'Al-Ma‘arij',71:'Nuh',72:'Al-Jinn',73:'Al-Muzzammil',74:'Al-Muddassir',75:'Al-Qiyamah',76:'Al-Insan',77:'Al-Mursalat',
  78:'An-Naba’',79:'An-Nazi‘at',80:'‘Abasa',81:'At-Takwir',82:'Al-Infitar',83:'Al-Mutaffifin',84:'Al-Insyiqaq',85:'Al-Buruj',86:'At-Tariq',87:'Al-A‘la',88:'Al-Ghasyiyah',89:'Al-Fajr',90:'Al-Balad',91:'Asy-Syams',92:'Al-Lail',93:'Ad-Duha',94:'Asy-Syarh',95:'At-Tin',96:'Al-‘Alaq',97:'Al-Qadr',98:'Al-Bayyinah',99:'Az-Zalzalah',100:'Al-‘Adiyat',101:'Al-Qari‘ah',102:'At-Takasur',103:'Al-‘Asr',104:'Al-Humazah',105:'Al-Fil',106:'Quraisy',107:'Al-Ma‘un',108:'Al-Kausar',109:'Al-Kafirun',110:'An-Nasr',111:'Al-Lahab',112:'Al-Ikhlas',113:'Al-Falaq',114:'An-Nas',
};
const targets = [
  {grade:1,semester:1,start:78,end:81},{grade:1,semester:2,start:82,end:85},
  {grade:2,semester:1,start:86,end:92},{grade:2,semester:2,start:93,end:99},
  {grade:3,semester:1,start:100,end:107},{grade:3,semester:2,start:108,end:114},
  {grade:4,semester:1,start:67,end:69},{grade:4,semester:2,start:70,end:72},
  {grade:5,semester:1,start:73,end:74},{grade:5,semester:2,start:75,end:77},
  {grade:6,semester:1,start:78,end:114},{grade:6,semester:2,start:67,end:77},
];
export async function POST() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) return NextResponse.json({success:false,message:auth.message},{status:auth.status});
    const totals = await prisma.$transaction(async tx => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(74321002)`;
      const matches = await tx.subject.findMany({where:{level:'SD',name:{equals:"Tahfidz Al Qur'an",mode:'insensitive'}}});
      if (matches.length !== 1) throw new Error('Pastikan tersedia tepat satu mapel SD bernama Tahfidz Al Qur\'an.');
      const subjectId = matches[0].id;
      let createdCP = 0; let createdTP = 0;
      for (const target of targets) {
        const {grade,semester,start,end} = target;
        const juz = start >= 78 ? 30 : 29;
        const mode = grade === 6 ? 'murajaah' : 'hafalan';
        const code = `CP-TAH-K${grade}-S${semester}-TARGET`;
        const matchesCP = await tx.cP.findMany({where:{code}});
        if (matchesCP.length > 1 || matchesCP.some(cp => cp.subjectId !== subjectId || cp.grade !== grade || cp.semester !== semester)) throw new Error(`Kode ${code} sudah digunakan oleh kurikulum lain. Periksa terlebih dahulu.`);
        const cp = matchesCP[0] || await tx.cP.create({data:{code,subjectId,grade,semester,description:`Peserta didik menunjukkan pencapaian ${mode} surah ${surahs[start]} sampai ${surahs[end]} pada Juz ${juz}, dengan memperhatikan kelancaran, tajwid, dan makhraj sesuai penilaian guru.`}});
        if (!matchesCP.length) createdCP++;
        for (let number = start; number <= end; number++) {
          const tpCode = `TP-${code}-SURAH${number}`;
          const existing = await tx.tP.findMany({where:{code:tpCode}});
          if (existing.length > 1 || existing.some(tp => tp.cpId !== cp.id)) throw new Error(`Kode ${tpCode} bermasalah. Periksa data kurikulum.`);
          if (!existing.length) {
            await tx.tP.create({data:{cpId:cp.id,code:tpCode,description:grade === 6
              ? `Peserta didik menyetorkan murajaah seluruh surah ${surahs[number]} pada Juz ${juz}.`
              : `Peserta didik menyetorkan hafalan seluruh surah ${surahs[number]} pada Juz ${juz}.`}});
            createdTP++;
          }
        }
      }
      return {createdCP,createdTP};
    },{maxWait:10000,timeout:60000});
    return NextResponse.json({success:true,message:`Target Tahfidz siap. Ditambahkan ${totals.createdCP} CP dan ${totals.createdTP} TP. Data yang sudah ada tetap dipertahankan.`,data:totals});
  } catch(error) {
    console.error('[POST /api/tahfidz/targets]',error);
    return NextResponse.json({success:false,message:error instanceof Error && !('code' in error) ? error.message : 'Gagal menyiapkan target Tahfidz. Periksa log server.'},{status:400});
  }
}
