'use client';
import { useEffect, useState, type FormEvent } from 'react';
type Student = { id: number; fullname: string; class_name: string };
type CP = { id: number; code: string; description: string; semester: number; grade: number; tps: Array<{ id: number; description: string }> };
type Group = { id: number; name: string; jilid: number; academicYear: string; semester: number; teacherId: number | null; cps: CP[]; members: Array<{ studentId: number }> };
export default function HalaqahPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Array<{ id: number; fullname: string }>>([]);
  const [cps, setCps] = useState<CP[]>([]);
  const [form, setForm] = useState({ id: 0, name: '', jilid: 1, teacherId: '', academicYear: '', semester: 1 });
  const [studentIds, setStudentIds] = useState<number[]>([]);
  const [cpIds, setCpIds] = useState<number[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState('');
  async function load() {
    setBusy(true);
    try {
      const response = await fetch('/api/halaqah', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      setGroups(result.data); setStudents(result.students); setTeachers(result.teachers); setCps(result.cps);
      setForm(previous => ({ ...previous, academicYear: result.settings?.academicYear || '', semester: /genap|2/i.test(result.settings?.semester || '') ? 2 : 1 }));
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal memuat data.'); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  function edit(group: Group) {
    setForm({ id: group.id, name: group.name, jilid: group.jilid, teacherId: group.teacherId ? String(group.teacherId) : '', academicYear: group.academicYear, semester: group.semester });
    setStudentIds(group.members.map(item => item.studentId)); setCpIds(group.cps.map(item => item.id)); setMessage('');
  }
  function reset() { setForm(previous => ({ ...previous, id: 0, name: '', jilid: 1, teacherId: '' })); setStudentIds([]); setCpIds([]); }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/halaqah', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, id: form.id || undefined, teacherId: form.teacherId ? Number(form.teacherId) : null, studentIds, cpIds }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message);
      reset(); await load(); setMessage('Halaqah berhasil disimpan.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal menyimpan.'); }
    finally { setBusy(false); }
  }
  const toggle = (list: number[], id: number) => list.includes(id) ? list.filter(value => value !== id) : [...list, id];
  return <main className="min-h-screen bg-[#f0f0f1] p-6 text-[#1d2327]">
    <div className="mx-auto max-w-5xl space-y-5">
      <h1 className="text-2xl">Halaqah Tartili</h1>
      <p>Kelompok berdasarkan jilid. Kelas sekolah setiap anak tetap sama.</p>
      {message && <p role="status" className="border bg-white p-3">{message}</p>}
      <section className="border border-[#c3c4c7] bg-white p-4">
        <h2 className="mb-3 font-semibold">Kelompok periode {form.academicYear} • Semester {form.semester}</h2>
        <div className="flex flex-wrap gap-2">{groups.filter(group => group.academicYear === form.academicYear && group.semester === form.semester).map(group => <button disabled={busy} key={group.id} onClick={() => edit(group)} className="rounded border p-3">{group.name} • Jilid {group.jilid} • {group.members.length} anak</button>)}</div>
        <button disabled={busy} onClick={reset} className="mt-3 text-[#2271b1] underline">Buat halaqah baru</button>
      </section>
      <form onSubmit={save} className="space-y-4 border border-[#c3c4c7] bg-white p-5">
        <fieldset disabled={busy} className="space-y-4">
          <h2 className="font-semibold">{form.id ? 'Edit Halaqah' : 'Halaqah Baru'}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <label>Nama kelompok<input required maxLength={100} className="mt-1 w-full border p-2" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="Jilid 2 — Kelompok A" /></label>
            <label>Jilid<input required type="number" min={1} max={20} className="mt-1 w-full border p-2" value={form.jilid} onChange={event => setForm({ ...form, jilid: Number(event.target.value) })} /></label>
            <label>Guru pembimbing<select className="mt-1 w-full border p-2" value={form.teacherId} onChange={event => setForm({ ...form, teacherId: event.target.value })}><option value="">-- Belum ditentukan --</option>{teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.fullname}</option>)}</select></label>
          </div>
          <section><h3 className="font-semibold">CP/TP untuk jilid ini</h3><p className="mb-2 text-sm">Pilih CP Tartili yang materinya sesuai jilid. CP dapat digunakan oleh anggota lintas kelas.</p>
            {cps.filter(cp => cp.semester === form.semester).map(cp => <label key={cp.id} className="mb-2 flex gap-2 border p-3"><input type="checkbox" checked={cpIds.includes(cp.id)} onChange={() => setCpIds(toggle(cpIds, cp.id))} /><span>{cp.code}: {cp.description}<small className="block">Kelas asal CP {cp.grade} • {cp.tps.length} TP</small></span></label>)}
            {!cps.some(cp => cp.semester === form.semester) && <p>Buat CP/TP mapel Tartili di halaman kurikulum terlebih dahulu.</p>}
          </section>
          <section><h3 className="font-semibold">Anggota ({studentIds.length} anak)</h3><input className="my-2 w-full border p-2" placeholder="Cari nama atau kelas sekolah" value={query} onChange={event => setQuery(event.target.value)} />
            <div className="max-h-80 overflow-auto">{students.filter(student => `${student.fullname} ${student.class_name}`.toLowerCase().includes(query.toLowerCase())).map(student => {
              const other = groups.find(group => group.id !== form.id && group.academicYear === form.academicYear && group.semester === form.semester && group.members.some(member => member.studentId === student.id));
              return <label key={student.id} className="flex gap-3 border-b p-2"><input disabled={Boolean(other)} type="checkbox" checked={studentIds.includes(student.id)} onChange={() => setStudentIds(toggle(studentIds, student.id))} /><span>{student.fullname} • Kelas {student.class_name}{other && <small className="block">Masih di {other.name}; keluarkan dari kelompok lama dahulu.</small>}</span></label>;
            })}</div>
          </section>
          <button type="submit" className="rounded bg-[#2271b1] px-4 py-2 text-white">{busy ? 'Memproses...' : 'Simpan Halaqah'}</button>
        </fieldset>
      </form>
    </div>
  </main>;
}
