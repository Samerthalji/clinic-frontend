import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api'
import { useApp, useLoad, Loading, Head, ApptTable, DoctorCards, Field } from '../ui'
export function MyAppointments() {
  const { act } = useApp(), [q] = useSearchParams()
  const [list, reload] = useLoad(() => api('/Appointments/my').then(l => l.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))))
  const [docs] = useLoad(() => api('/Doctors').then(l => l.filter(d => d.isActive)))
  const local = d => new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16)
  const empty = { doctorId: q.get('doctor') || '', date: '', notes: '' }
  const [f, setF] = useState(empty), [editId, setEditId] = useState(null)

  const submit = async e => {
    e.preventDefault()
    const body = { doctorId: +f.doctorId, appointmentDate: new Date(f.date).toISOString(), notes: f.notes }
    const ok = editId
      ? await act(() => api('/Appointments/' + editId, 'PUT', body), 'تم تعديل الموعد')
      : await act(() => api('/Appointments', 'POST', body), 'تم إرسال طلب الحجز')
    if (ok) { setF(empty); setEditId(null); reload() }
  }
  const startEdit = a => { setEditId(a.id); setF({ doctorId: a.doctorId, date: local(a.appointmentDate), notes: a.notes || '' }) }
  const cancelEdit = () => { setEditId(null); setF(empty) }
  const cancel = id => act(() => api(`/Appointments/${id}/status`, 'PATCH', { status: 'Cancelled' }), 'تم إلغاء الموعد').then(reload)

  return <><Head title="مواعيدي" /><div className="cols">
    <div className="card">{!list ? <Loading /> : <ApptTable list={list} cols={['doctor', 'date', 'status']}
      actions={a => ['Pending', 'Confirmed'].includes(a.status) && <>
        <button className="btn gray sm" onClick={() => startEdit(a)}>تعديل</button>
        <button className="btn red sm" onClick={() => cancel(a.id)}>إلغاء</button></>} />}</div>
    <form className="card" onSubmit={submit}><h2>{editId ? 'تعديل الموعد' : 'حجز موعد جديد'}</h2>
      <label>الدكتور</label><select required disabled={!!editId} value={f.doctorId} onChange={e => setF({ ...f, doctorId: e.target.value })}>
        <option value="">اختر الدكتور</option>{(docs || []).map(d => <option key={d.id} value={d.id}>د. {d.firstName} {d.lastName} — {d.specialization}</option>)}</select>
      <label>التاريخ والوقت</label><input type="datetime-local" required min={local(Date.now())} value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
      <label>ملاحظات</label><textarea rows="3" value={f.notes} onChange={e => setF({ ...f, notes: e.target.value })} />
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button className="btn full">{editId ? 'حفظ التعديل' : 'تأكيد الحجز'}</button>
        {editId && <button type="button" className="btn gray full" onClick={cancelEdit}>إلغاء</button>}</div></form></div></>
}

export function Doctors() {
  const { user, act } = useApp(), [s, setS] = useState(''), admin = user.role === 'Admin'
  const [docs, reload] = useLoad(() => api('/Doctors'))
  const book = id => (window.location.href = '/my?doctor=' + id)
  if (!docs) return <><Head title="الأطباء" /><Loading /></>
  const list = (admin ? docs : docs.filter(d => d.isActive)).filter(d => (d.firstName + d.lastName + d.specialization).includes(s))
  return <><Head title="الأطباء" />
    <input placeholder="ابحث بالاسم أو التخصص…" value={s} onChange={e => setS(e.target.value)} style={{ maxWidth: 320, marginBottom: 20 }} />
    <DoctorCards list={list} admin={admin} onBook={book}
      onToggle={id => act(() => api(`/Doctors/${id}/toggle-active`, 'PATCH')).then(reload)}
      onDelete={id => confirm('حذف الدكتور؟') && act(() => api('/Doctors/' + id, 'DELETE'), 'تم الحذف').then(reload)} /></>
}

export function Profile() {
  const { act } = useApp(), [me, reload] = useLoad(() => api('/Patients/me')), [f, setF] = useState(null)
  if (!me) return <><Head title="ملفي الشخصي" /><Loading /></>
  const v = f || { ...me, dateOfBirth: (me.dateOfBirth || '').slice(0, 10), address: me.address || '' }
  const set = k => e => setF({ ...v, [k]: e.target.value })
  const save = async e => {
    e.preventDefault()
    if (await act(() => api('/Patients/' + me.id, 'PUT', { id: me.id, firstName: v.firstName, lastName: v.lastName, phoneNumber: v.phoneNumber, dateOfBirth: v.dateOfBirth, address: v.address }), 'تم حفظ التعديلات')) { setF(null); reload() }
  }
  return <><Head title="ملفي الشخصي" /><form className="card" style={{ maxWidth: 460 }} onSubmit={save}>
    <Field label="الاسم الأول" required value={v.firstName} onChange={set('firstName')} />
    <Field label="اسم العائلة" required value={v.lastName} onChange={set('lastName')} />
    <Field label="رقم الهاتف" required value={v.phoneNumber} onChange={set('phoneNumber')} />
    <Field label="تاريخ الميلاد" type="date" required value={v.dateOfBirth} onChange={set('dateOfBirth')} />
    <Field label="العنوان" value={v.address} onChange={set('address')} />
    <div style={{ marginTop: 20 }}><button className="btn full" disabled={!f}>حفظ التعديلات</button></div></form></>
}
