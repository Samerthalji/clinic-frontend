import { useState } from 'react'
import { api } from '../api'
import { useApp, useLoad, Loading, Head, ApptTable, Field, ST } from '../ui'

const Btn = ({ children, ...p }) => <button className="btn sm" {...p}>{children}</button>
function statusActions(a, set, del) {
  return <>{a.status === 'Pending' && <Btn onClick={() => set(a.id, 'Confirmed')}>تأكيد</Btn>}
    {a.status === 'Confirmed' && <button className="btn gray sm" onClick={() => set(a.id, 'Completed')}>إكمال</button>}
    {['Pending', 'Confirmed'].includes(a.status) && !del && <button className="btn red sm" onClick={() => set(a.id, 'Cancelled')}>إلغاء</button>}
    {del && <button className="btn red sm" onClick={() => del(a.id)}>حذف</button>}</>
}

export function DoctorAppointments() {
  const { act } = useApp()
  const [list, reload] = useLoad(() => api('/Appointments/doctor/my').then(l => l.sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))))
  const set = (id, status) => act(() => api(`/Appointments/${id}/status`, 'PATCH', { status }), 'تم تحديث الحالة').then(reload)
  return <><Head title="مواعيد المرضى" /><div className="card">{!list ? <Loading /> :
    <ApptTable list={list} cols={['patient', 'date', 'status']} actions={a => statusActions(a, set)} />}</div></>
}

export function Admin() {
  const { act } = useApp()
  const [d, reload] = useLoad(async () => {
    const [docs, pr] = await Promise.all([api('/Doctors'), api('/Patients?pageNumber=1&pageSize=1')])
    const all = (await Promise.all(docs.map(x => api('/Appointments/doctor/' + x.id)))).flat().sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))
    return { docs, all, patients: pr.totalCount }
  })
  if (!d?.all) return <><Head title="إدارة المواعيد" /><Loading /></>
  const today = new Date().toDateString()
  const stats = [['مواعيد اليوم', d.all.filter(a => new Date(a.appointmentDate).toDateString() === today).length],
    ['قيد الانتظار', d.all.filter(a => a.status === 'Pending').length], ['الأطباء الفعّالون', d.docs.filter(x => x.isActive).length], ['المرضى', d.patients]]
  const set = (id, status) => act(() => api(`/Appointments/${id}/status`, 'PATCH', { status }), 'تم تحديث الحالة').then(reload)
  const del = id => confirm('حذف هذا الموعد نهائياً؟') && act(() => api('/Appointments/' + id, 'DELETE'), 'تم الحذف').then(reload)
  return <><Head title="إدارة المواعيد" />
    <div className="stats">{stats.map(([l, n]) => <div className="stat" key={l}><small>{l}</small><b>{n}</b></div>)}</div>
    <div className="card"><ApptTable list={d.all} cols={['patient', 'doctor', 'date', 'status']} actions={a => <>
  <select value={a.status} onChange={e => set(a.id, e.target.value)} style={{ width: 'auto', padding: '6px 10px' }}>
    {Object.entries(ST).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
  </select>
  <button className="btn red sm" onClick={() => del(a.id)}>حذف</button></>} /></div></>
}
export function Patients() {
  const { user, act } = useApp(), admin = user.role === 'Admin'
  const [name, setName] = useState(''), [edit, setEdit] = useState(null), [page, setPage] = useState(1)
  const size = 10, searching = !!name.trim()
  const [r, reload] = useLoad(() => searching
    ? api('/Patients/search?name=' + encodeURIComponent(name)).then(data => ({ data })).catch(() => ({ data: [] }))
    : api(`/Patients?pageNumber=${page}&pageSize=${size}`), [name, page])
  const pages = Math.max(1, Math.ceil((r?.totalCount || 0) / size))
  const set = k => e => setEdit({ ...edit, [k]: e.target.value })
  const open = p => setEdit({ ...p, dateOfBirth: (p.dateOfBirth || '').slice(0, 10), address: p.address || '' })
  const search = e => { setName(e.target.value); setPage(1) }
  const save = async e => {
    e.preventDefault()
    const { id, firstName, lastName, phoneNumber, dateOfBirth, address } = edit
    if (await act(() => api('/Patients/' + id, 'PUT', { id, firstName, lastName, phoneNumber, dateOfBirth, address }), 'تم حفظ التعديلات')) { setEdit(null); reload() }
  }
  return <><Head title="المرضى" />
    {edit && <form className="card" style={{ maxWidth: 460, marginBottom: 20 }} onSubmit={save}>
      <h2>تعديل بيانات المريض</h2>
      <Field label="الاسم الأول" required value={edit.firstName} onChange={set('firstName')} />
      <Field label="اسم العائلة" required value={edit.lastName} onChange={set('lastName')} />
      <Field label="رقم الهاتف" required value={edit.phoneNumber} onChange={set('phoneNumber')} />
      <Field label="تاريخ الميلاد" type="date" required value={edit.dateOfBirth} onChange={set('dateOfBirth')} />
      <Field label="العنوان" value={edit.address} onChange={set('address')} />
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button className="btn full">حفظ</button>
        <button type="button" className="btn gray full" onClick={() => setEdit(null)}>إلغاء</button></div></form>}
    <div className="card">
      <input placeholder="ابحث بالاسم…" value={name} onChange={search} style={{ marginBottom: 14 }} />
      {!r ? <Loading /> : !r.data.length ? <p className="empty">ما في نتائج.</p> : <>
        <table><thead><tr><th>الاسم</th><th>الهاتف</th><th>تاريخ الميلاد</th><th>العنوان</th>{admin && <th>إجراءات</th>}</tr></thead><tbody>
          {r.data.map(p => <tr key={p.id}><td><b>{p.firstName} {p.lastName}</b></td><td>{p.phoneNumber}</td>
            <td>{p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString('ar-JO') : '—'}</td><td>{p.address}</td>
            {admin && <td><button className="btn gray sm" onClick={() => open(p)}>تعديل</button></td>}</tr>)}</tbody></table>
        {!searching && <div className="pager">
          <button className="btn gray sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</button>
          <span>صفحة {page} من {pages}</span>
          <button className="btn gray sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>التالي</button>
          <span style={{ color: 'var(--mute)', marginInlineStart: 'auto' }}>{r.totalCount} مريض</span></div>}</>}</div></>
}
export function NewUser() {
  const { act } = useApp()
  const init = { firstName: '', lastName: '', username: '', email: '', phoneNumber: '', password: '', dateOfBirth: '', role: 'Patient' }
  const [f, setF] = useState(init)
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = async e => {
    e.preventDefault()
    if (await act(() => api('/Auth/RegisterWithRole', 'POST', { ...f, dateOfBirth: f.dateOfBirth || null }), 'تم إنشاء المستخدم')) setF(init)
  }
  return <><Head title="إنشاء مستخدم" />
    <form className="card newuser" onSubmit={submit}>
      <div className="row2">
        <Field label="الاسم الأول" required value={f.firstName} onChange={set('firstName')} />
        <Field label="اسم العائلة" required value={f.lastName} onChange={set('lastName')} />
      </div>
      <div className="row2">
        <Field label="اسم المستخدم" required value={f.username} onChange={set('username')} />
        <Field label="البريد الإلكتروني" type="email" required value={f.email} onChange={set('email')} />
      </div>
      <div className="row2">
        <Field label="رقم الهاتف" type="tel" required value={f.phoneNumber} onChange={set('phoneNumber')} />
        <Field label="تاريخ الميلاد" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} />
      </div>
      <div className="row2">
        <Field label="كلمة المرور" type="password" required value={f.password} onChange={set('password')} />
        <div>
          <label>الدور</label>
          <select value={f.role} onChange={set('role')}>
            <option value="Patient">مريض</option>
            <option value="Doctor">دكتور</option>
            <option value="Admin">أدمن</option>
          </select>
        </div>
      </div>
      <div style={{ marginTop: 20 }}><button className="btn full">إنشاء</button></div>
    </form></>
}