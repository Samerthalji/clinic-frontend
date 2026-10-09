import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, Navigate, Link } from 'react-router-dom'

export const ST = { Pending: 'قيد الانتظار', Confirmed: 'مؤكد', Completed: 'مكتمل', Cancelled: 'ملغي' }
export const fmt = d => new Date(d).toLocaleString('ar-JO', { dateStyle: 'medium', timeStyle: 'short' })
export const HOME = { Patient: '/my', Doctor: '/mine', Admin: '/admin' }
const NAV = {
  Patient: [['/my', 'مواعيدي'], ['/doctors', 'الأطباء'], ['/profile', 'ملفي الشخصي']],
  Doctor: [['/mine', 'مواعيدي'], ['/patients', 'المرضى']],
  Admin: [['/admin', 'المواعيد'], ['/doctors', 'الأطباء'], ['/patients', 'المرضى'], ['/newuser', 'إنشاء مستخدم']]
}

const Ctx = createContext()
export const useApp = () => useContext(Ctx)
export function Provider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('mc') || 'null'))
  const [msg, setMsg] = useState('')
  const toast = useCallback(m => { setMsg(m); setTimeout(() => setMsg(''), 3000) }, [])
  const login = u => { localStorage.setItem('mc', JSON.stringify(u)); setUser(u) }
  const logout = () => { localStorage.removeItem('mc'); setUser(null) }
  // ينفّذ إجراء ويعرض رسالة نجاح أو الخطأ
  const act = async (fn, ok) => { try { const r = await fn(); if (ok) toast(ok); return r ?? true } catch (e) { toast(e.message); return false } }
  return <Ctx.Provider value={{ user, login, logout, toast, act }}>{children}
    {msg && <div className="toast" style={{ display: 'block' }}>{msg}</div>}</Ctx.Provider>
}

export function useLoad(fn, deps = []) {
  const [data, setData] = useState(null), [n, setN] = useState(0), { toast } = useApp()
  useEffect(() => { setData(null); fn().then(setData).catch(e => { toast(e.message); setData([]) }) }, [n, ...deps])
  return [data, () => setN(x => x + 1)]
}
export const Loading = () => <p className="empty">جارٍ التحميل…</p>

export function Guard({ roles }) {
  const { user } = useApp()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to={HOME[user.role]} replace />
  return <Outlet />
}
export function Shell() {
  const { user, logout } = useApp()
  return <div className="app"><aside className="side"><h2>العيادة الطبية{user.role === 'Admin' && ' · أدمن'}</h2>
    <nav>{NAV[user.role].map(([to, l]) => <NavLink key={to} to={to} className={({ isActive }) => isActive ? 'on' : ''}>{l}</NavLink>)}</nav>
    <button className="out" onClick={logout}>تسجيل الخروج</button></aside>
    <main><Outlet /></main></div>
}
export const Head = ({ title }) => { const { user } = useApp(); return <div className="head"><h1>{title}</h1><span>أهلاً {user.username}</span></div> }

export function ApptTable({ list, cols, actions }) {
  const [f, setF] = useState('All')
  if (!list.length) return <p className="empty">ما في مواعيد لحد الآن.</p>
  const rows = f === 'All' ? list : list.filter(a => a.status === f)
  const H = { doctor: 'الدكتور', patient: 'المريض', date: 'التاريخ', status: 'الحالة' }
  return <>
    <div className="tabs">{['All', ...Object.keys(ST)].map(s => <button key={s} className={'chip sm' + (f === s ? ' on' : '')} onClick={() => setF(s)}>{s === 'All' ? 'الكل' : ST[s]}</button>)}</div>
    <table><thead><tr>{cols.map(c => <th key={c}>{H[c]}</th>)}{actions && <th>إجراءات</th>}</tr></thead><tbody>
      {rows.map(a => <tr key={a.id}>{cols.map(c => <td key={c}>
        {c === 'doctor' ? <b>د. {a.doctorFullName}</b> : c === 'patient' ? <b>{a.patientFullName}</b> : c === 'date' ? fmt(a.appointmentDate)
          : <span className={'badge ' + a.status}>{ST[a.status]}</span>}</td>)}
        {actions && <td>{actions(a)}</td>}</tr>)}
      {!rows.length && <tr><td colSpan={9} className="empty">ما في نتائج بهذه الحالة.</td></tr>}</tbody></table></>
}

export function DoctorCards({ list, admin, onBook, onToggle, onDelete }) {
  if (!list.length) return <p className="empty">ما في أطباء حالياً.</p>
  return <div className="grid">{list.map(d => <div className="doc" key={d.id}><div className="av">{d.firstName[0]}</div>
    <h3>د. {d.firstName} {d.lastName}</h3><p>{d.specialization} · غرفة {d.clinicRoom}</p>
    <div className="fee">{d.consultationFee} د.أ {!d.isActive && <span className="badge Cancelled">غير فعّال</span>}</div>
    {admin ? <div className="btns"><button className="btn out sm" onClick={() => onToggle(d.id)}>{d.isActive ? 'تعطيل' : 'تفعيل'}</button>
      <button className="btn red sm" onClick={() => onDelete(d.id)}>حذف</button></div>
      : d.isActive && <button className="btn full" onClick={() => onBook(d.id)}>احجز</button>}</div>)}</div>
}
export const Field = ({ label, ...p }) => <div><label>{label}</label><input {...p} /></div>
export { Link }
