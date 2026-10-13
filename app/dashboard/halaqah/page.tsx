'use client';
import { useEffect, useState, type FormEvent } from 'react';

type Student = { id: number; fullname: string; class_name: string };
type TP = { id: number; code?: string; description: string };
type CP = { id: number; code: string; description: string; semester: number; grade: number; tps: TP[] };
type Group = { id: number; name: string; jilid: number; academicYear: string; semester: number; teacherId: number | null; teacher?: { fullname: string } | null; cps: CP[]; members: Array<{ studentId: number; student?: Student }> };
type Assessment = { studentId: number; tpId: number | null; type: string; score: number };
type ScoreType = 'ORAL' | 'WRITTEN';
const jilidName = (jilid: number) => jilid === 7 ? 'Ghorib' : `Jilid ${jilid}`;
const keyFor = (studentId: number, tpId: number, type: ScoreType) => `${studentId}:${tpId}:${type}`;
const newForm = { id: 0, name: '', jilid: 1, teacherId: '', academicYear: '', semester: 1 };

export default function HalaqahPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: number; fullname: string }>>([]);
  const [cps, setCps] = useState<CP[]>([]);
  const [period, setPeriod] = useState({ academicYear: '', semester: 1 });
  const [form, setForm] = useState(newForm);
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [cpIds, setCpIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'list' | 'edit' | 'scores'>('list');
  const [selected, setSelected] = useState<Group | null>(null);
  const [tpId, setTpId] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [scoresReady, setScoresReady] = useState(false);

  async function load() {
    setBusy(true);
    try {
      const response = await fetch('/api/halaqah', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal memuat halaqah.');
      const active = { academicYear: result.settings?.academicYear || '', semester: /genap|2/i.test(result.settings?.semester || '') ? 2 : 1 };
      const groupList = Array.isArray(result.data) ? result.data : Array.isArray(result.halaqahs) ? result.halaqahs : Array.isArray(result.groups) ? result.groups : null;
      if (!groupList) throw new Error('Format daftar halaqah dari API tidak sesuai.');
      setGroups(groupList); setStudents(result.students || []); setTeachers(result.teachers || []); setCps(result.cps || []);
      setPeriod(active);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal memuat data.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  const activeGroups = groups.filter(group => group.academicYear.trim() === period.academicYear.trim() && Number(group.semester) === period.semester);
  const toggle = (list: number[], id: number) => list.includes(id) ? list.filter(value => value !== id) : [...list, id];
  function edit(group?: Group) {
    setForm(group ? { id: group.id, name: group.name, jilid: group.jilid, teacherId: group.teacherId ? String(group.teacherId) : '', academicYear: period.academicYear, semester: period.semester } : { ...newForm, ...period });
    setStudentIds(group?.members.map(item => item.studentId) || []); setCpIds(group?.cps.map(item => item.id) || []);
    setQuery(''); setMessage(''); setView('edit');
  }
  async function saveGroup(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/halaqah', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: form.id || undefined, teacherId: form.teacherId ? Number(form.teacherId) : null, studentIds, cpIds }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Gagal menyimpan halaqah.');
      setView('list'); await load(); setMessage(result.message || 'Halaqah berhasil disimpan.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal menyimpan.'); }
    finally { setBusy(false); }
  }
  async function openScores(group: Group) {
    if (!group.members.length || !group.cps.some(cp => cp.semester === period.semester && cp.tps.length > 0)) { setMessage('Lengkapi anggota dan CP/TP melalui Edit Halaqah sebelum input nilai.'); return; }
    setSelected(group); setView('scores'); setTpId(''); setScores({}); setDirty({}); setScoresReady(false); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/assessment', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || 'Gagal memuat nilai.');
      const records: Assessment[] = Array.isArray(result) ? result : result.assessments ?? result.data;
      if (!Array.isArray(records)) throw new Error('Format data nilai tidak sesuai.');
      const values: Record<string, string> = {};
      const members = new Set(group.members.map(member => member.studentId));
      const tps = new Set(group.cps.filter(cp => cp.semester === period.semester).flatMap(cp => cp.tps.map(tp => tp.id)));
      for (const record of records) {
        const type = record.type === 'TP_ORAL' ? 'ORAL' : record.type === 'TP_WRITTEN' ? 'WRITTEN' : record.type;
        if (record.tpId && members.has(record.studentId) && tps.has(record.tpId) && (type === 'ORAL' || type === 'WRITTEN')) values[keyFor(record.studentId, record.tpId, type)] = String(record.score);
      }
      setScores(values); setScoresReady(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal memuat nilai.'); }
    finally { setBusy(false); }
  }
  async function saveScores(event: FormEvent) {
    event.preventDefault(); if (busy || !selected || !scoresReady) return;
    const entries = Object.keys(dirty).filter(key => dirty[key]);
    if (!entries.length) { setMessage('Belum ada perubahan nilai.'); return; }
    for (const key of entries) {
      const value = scores[key]?.trim();
      if (!value || !Number.isInteger(Number(value)) || Number(value) < 0 || Number(value) > 100) { setMessage('Isi nilai yang diubah dengan bilangan bulat 0–100. Mengosongkan kolom tidak menghapus nilai tersimpan.'); return; }
    }
    setBusy(true); setMessage(''); let saved = 0;
    try {
      for (const key of entries) {
        const [studentId, targetTp, type] = key.split(':');
        const response = await fetch('/api/assessment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId: Number(studentId), tpId: Number(targetTp), type, score: Number(scores[key]), halaqahId: selected.id }) });
        const result = await response.json();
        if (!response.ok || result.success === false) throw new Error(result.message || 'Gagal menyimpan nilai.');
        saved++; setDirty(previous => ({ ...previous, [key]: false }));
      }
      setMessage(`${saved} nilai berhasil disimpan dan dapat dibaca oleh rapor.`);
    } catch (error) { setMessage(`${saved} nilai sudah disimpan. ${error instanceof Error ? error.message : 'Gagal menyimpan.'} Perubahan yang belum tersimpan tetap tersedia; klik Simpan lagi.`); }
    finally { setBusy(false); }
  }
  function back() {
    if (Object.values(dirty).some(Boolean) && !window.confirm('Ada nilai yang belum disimpan. Tinggalkan halaman input?')) return;
    setDirty({}); setView('list'); setMessage('');
  }
  const availableCPs = selected?.cps.filter(cp => cp.semester === period.semester) || [];
  const selectedTP = availableCPs.flatMap(cp => cp.tps).find(tp => tp.id === Number(tpId));
  const members = (selected?.members || []).map(member => member.student || students.find(student => student.id === member.studentId)).filter((student): student is Student => Boolean(student)).sort((a, b) => a.fullname.localeCompare(b.fullname, 'id'));
  const control = 'mt-1 w-full rounded-sm border border-[#8c8f94] bg-white p-2';
  return <main className="min-h-screen bg-[#f0f0f1] p-4 text-[#1d2327] sm:p-6"><div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-2xl font-semibold">Halaqah Tartili</h1><p className="mt-1">{period.academicYear || 'Periode belum dimuat'} • Semester {period.semester === 1 ? 'Ganjil' : 'Genap'}</p></div>
      {view === 'list' ? <button disabled={busy || !period.academicYear} onClick={() => edit()} className="rounded-sm border border-[#2271b1] px-4 py-2 text-[#2271b1] disabled:opacity-50">Buat Halaqah Baru</button> : <button disabled={busy} onClick={back} className="rounded-sm border bg-white px-4 py-2">Kembali ke Daftar Halaqah</button>}
    </div>
    {message && <p role="status" className="border border-[#c3c4c7] bg-white p-3">{message}</p>}
    {busy && <p role="status">Memproses...</p>}
    {view === 'list' && <section className="space-y-3"><p>Pilih kelompok, lalu klik <strong>Input Nilai</strong>. Anggota mengikuti halaqah, meskipun kelas sekolah berbeda.</p>
      {!busy && !groups.length && <div className="border bg-white p-5">API belum mengembalikan halaqah. Jika kelompok sudah disimpan, periksa apakah data masih aktif dan aplikasi memakai database yang sama. <button onClick={() => void load()} className="ml-2 text-[#2271b1] underline">Muat ulang</button></div>}
      <div className="grid gap-4 md:grid-cols-2">{groups.map(group => <article key={group.id} className="space-y-3 border border-[#c3c4c7] bg-white p-5"><h2 className="text-lg font-semibold">{group.name}</h2><p>{jilidName(group.jilid)} • {group.members.length} anggota</p><p className="text-sm">{group.academicYear} • Semester {Number(group.semester) === 1 ? 'Ganjil' : 'Genap'}{group.academicYear.trim() !== period.academicYear.trim() || Number(group.semester) !== period.semester ? ' — Berbeda dari periode aktif' : ' — Periode aktif'}</p><p>Guru: {group.teacher?.fullname || teachers.find(teacher => teacher.id === group.teacherId)?.fullname || 'Belum ditentukan'}</p><p className="text-sm">{!group.members.length ? 'Tambahkan anggota melalui Edit Halaqah.' : !group.cps.some(cp => cp.semester === period.semester && cp.tps.length > 0) ? 'Lengkapi CP/TP untuk mulai input nilai.' : 'Siap input nilai.'}</p><p>{group.cps.length} CP • {group.cps.reduce((count, cp) => count + cp.tps.length, 0)} TP</p><div className="flex gap-3"><button disabled={busy || !group.members.length || !group.cps.some(cp => cp.semester === period.semester && cp.tps.length > 0) || group.academicYear.trim() !== period.academicYear.trim() || Number(group.semester) !== period.semester} onClick={() => void openScores(group)} className="rounded-sm bg-[#2271b1] px-4 py-2 font-semibold text-white disabled:opacity-50">Input Nilai</button><button disabled={busy} onClick={() => edit(group)} className="rounded-sm border px-4 py-2">Edit Halaqah</button></div></article>)}</div>
    </section>}
    {view === 'scores' && selected && <form onSubmit={saveScores} className="space-y-4 border border-[#c3c4c7] bg-white p-5"><fieldset disabled={busy || !scoresReady} className="space-y-4"><h2 className="text-xl font-semibold">Input Nilai — {selected.name}</h2><p>{jilidName(selected.jilid)} • Nilai TP saja, tanpa STS/SAS.</p><label className="block font-semibold">Pilih Tujuan Pembelajaran<select required className={control} value={tpId} onChange={event => setTpId(event.target.value)}><option value="">Pilih TP yang akan dinilai</option>{availableCPs.map(cp => <optgroup key={cp.id} label={`${cp.code}: ${cp.description}`}>{cp.tps.map(tp => <option key={tp.id} value={tp.id}>{tp.code || `TP ${tp.id}`} — {tp.description}</option>)}</optgroup>)}</select></label>
      {!availableCPs.some(cp => cp.tps.length) && <p>Belum ada TP pada CP kelompok ini. Lengkapi CP/TP dan edit halaqah terlebih dahulu.</p>}
      {selectedTP && <><p className="border bg-[#f6f7f7] p-3">{selectedTP.description}</p><div className="overflow-x-auto"><table className="w-full border-collapse text-left"><thead><tr className="bg-[#f0f0f1]"><th className="border p-3">Nama</th><th className="border p-3">Kelas Asal</th><th className="border p-3">Lisan / Praktik</th><th className="border p-3">Tertulis</th></tr></thead><tbody>{members.map(student => <tr key={student.id}><td className="border p-3">{student.fullname}</td><td className="border p-3">{student.class_name}</td>{(['ORAL', 'WRITTEN'] as const).map(type => { const key = keyFor(student.id, selectedTP.id, type); return <td key={type} className="border p-3"><input aria-label={`${student.fullname}, ${type === 'ORAL' ? 'lisan' : 'tertulis'}`} type="number" min={0} max={100} step={1} className="w-24 rounded-sm border p-2" placeholder="—" value={scores[key] ?? ''} onChange={event => { setScores(previous => ({ ...previous, [key]: event.target.value })); setDirty(previous => ({ ...previous, [key]: true })); }} /></td>; })}</tr>)}</tbody></table></div></>}
      {!members.length && <p>Kelompok ini belum memiliki anggota. Tambahkan anggota melalui Edit Halaqah.</p>}<p className="text-sm">Isi hanya kategori yang dinilai. Kolom kosong tidak dihitung sebagai nol. Perubahan beberapa TP disimpan sekaligus.</p><button type="submit" disabled={!Object.values(dirty).some(Boolean)} className="rounded-sm bg-[#2271b1] px-5 py-2 font-semibold text-white disabled:opacity-50">Simpan Nilai</button></fieldset>{!scoresReady && !busy && <button type="button" onClick={() => void openScores(selected)} className="text-[#2271b1] underline">Coba muat nilai lagi</button>}</form>}
    {view === 'edit' && <form onSubmit={saveGroup} className="space-y-4 border border-[#c3c4c7] bg-white p-5"><fieldset disabled={busy} className="space-y-4"><h2 className="text-lg font-semibold">{form.id ? 'Edit Halaqah' : 'Halaqah Baru'}</h2><p>Disimpan untuk periode {form.academicYear} • Semester {form.semester === 1 ? 'Ganjil' : 'Genap'}. Mengedit kelompok dari periode lain akan memindahkannya ke periode aktif.</p><div className="grid gap-4 sm:grid-cols-3"><label>Nama kelompok<input required maxLength={100} className={control} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} /></label><label>Jilid<select className={control} value={form.jilid} onChange={event => setForm({ ...form, jilid: Number(event.target.value) })}>{[1,2,3,4,5,6,7].map(jilid => <option key={jilid} value={jilid}>{jilidName(jilid)}</option>)}</select></label><label>Guru pembimbing<select className={control} value={form.teacherId} onChange={event => setForm({ ...form, teacherId: event.target.value })}><option value="">Belum ditentukan</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullname}</option>)}</select></label></div><section><h3 className="font-semibold">CP/TP untuk jilid ini</h3><p className="mb-2 text-sm">CP boleh dilengkapi nanti. Pilih CP Tartili sesuai jilid dan semester sebelum mulai input nilai.</p>{cps.filter(cp => cp.semester === period.semester).map(cp => <label key={cp.id} className="mb-2 flex gap-2 border p-3"><input type="checkbox" checked={cpIds.includes(cp.id)} onChange={() => setCpIds(toggle(cpIds, cp.id))} /><span>{cp.code}: {cp.description}<small className="block">{cp.tps.length} TP</small></span></label>)}{!cps.some(cp => cp.semester === period.semester) && <p className="border bg-[#f6f7f7] p-3">CP Tartili semester ini belum tersedia. Anda tetap dapat menyimpan halaqah beserta anggota. Buat CP/TP Tartili di halaman Kurikulum, kemudian pilih melalui Edit Halaqah.</p>}</section><section><h3 className="font-semibold">Anggota ({studentIds.length})</h3><input className={control} placeholder="Cari nama atau kelas" value={query} onChange={event => setQuery(event.target.value)} /><div className="mt-2 max-h-80 overflow-auto">{students.filter(student => `${student.fullname} ${student.class_name}`.toLowerCase().includes(query.toLowerCase())).map(student => { const other = activeGroups.find(group => group.id !== form.id && group.members.some(member => member.studentId === student.id)); return <label key={student.id} className="flex gap-3 border-b p-2"><input disabled={Boolean(other)} type="checkbox" checked={studentIds.includes(student.id)} onChange={() => setStudentIds(toggle(studentIds, student.id))} /><span>{student.fullname} • Kelas {student.class_name}{other && <small className="block">Masih di {other.name}; keluarkan dari kelompok lama dahulu.</small>}</span></label>; })}</div></section><button type="submit" className="rounded-sm bg-[#2271b1] px-4 py-2 text-white">Simpan Halaqah</button></fieldset></form>}
  </div></main>;
}
