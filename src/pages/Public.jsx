import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, toUser, DEMO } from '../api'
import { useApp, useLoad, Loading, DoctorCards, Field, HOME } from '../ui'

function Top({ minimal }) {
  const { user } = useApp()
  return <header className="top"><Link className="logo" to="/"><i />عيادة الأمل</Link>
    <nav><Link to="/">الرئيسية</Link>
      {user ? <a href="/#doctors">الأطباء</a> : <Link to="/login">الأطباء</Link>}
      {user && <Link to={HOME[user.role]}>{user.role === 'Patient' ? 'مواعيدي' : 'لوحتي'}</Link>}</nav>
    {!minimal && <div className="acts">{user ? <Link className="btn" to={HOME[user.role]}>لوحتي</Link> : <>
      <Link className="btn out" to="/login">تسجيل الدخول</Link><Link className="btn" to="/register">إنشاء حساب</Link></>}</div>}</header>
}

function DoctorsSection() {
  const nav = useNavigate(), { user, toast } = useApp(), [spec, setSpec] = useState(null)
  const [docs] = useLoad(() => api('/Doctors').then(l => l.filter(d => d.isActive)))
  if (!docs) return <Loading />
  const specs = [...new Set(docs.map(d => d.specialization))]
  const book = id => user.role === 'Patient' ? nav('/my?doctor=' + id) : toast('الحجز متاح لحسابات المرضى فقط')
  return <><div className="chips">{specs.map(s => <button key={s} className={'chip' + (spec === s ? ' on' : '')} onClick={() => setSpec(spec === s ? null : s)}>{s}</button>)}</div>
    <DoctorCards list={spec ? docs.filter(d => d.specialization === spec) : docs} onBook={book} /></>
}

const Icon = ({ children }) => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
const FEATURES = [
  { t: 'حجز سهل وسريع', d: 'احجز موعدك بخطوات بسيطة واختر الوقت المناسب لك.',
    i: <Icon><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /><path d="m9 16 2 2 4-4" /></Icon> },
  { t: 'رعاية طبية موثوقة', d: 'فريق طبي يهتم بصحتك ويتابع حالتك باهتمام.',
    i: <Icon><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></Icon> },
  { t: 'أطباء معتمدون وذوو خبرة', d: 'أطباء بتخصصات متعددة جاهزون لخدمتك.',
    i: <Icon><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></Icon> }
]

export function Home() {
  const { user } = useApp()
  return <><Top />
    <section className="hero"><div><h1>صحتك أولاً،<br />احجز موعدك <b>بدقيقة</b></h1>
      <p>اختر الدكتور المناسب، حدد الوقت، وتابع حالة موعدك من مكان واحد.</p>
      <div className="row"><Link className="btn" to={user ? HOME[user.role] : '/register'}>احجز موعد</Link>
        {user ? <a className="btn gray" href="#doctors">تصفح الأطباء</a> : <Link className="btn gray" to="/login">تصفح الأطباء</Link>}</div></div>
      <div className="pic" role="img" aria-label="العيادة" style={{ background: 'url(/clinic.jpg) center / cover' }} /></section>
    {user && <div className="wrap" id="doctors"><DoctorsSection /></div>}
    <section className="wrap why">
      <h2>لماذا تختار عيادتنا؟</h2>
      <div className="grid">
        {FEATURES.map(f => <div className="feat" key={f.t}>
          <div className="ico">{f.i}</div><h3>{f.t}</h3><p>{f.d}</p></div>)}
      </div>
    </section>
    <footer className="foot">© {new Date().getFullYear()} عيادة الأمل</footer></>
}

export function Login() {
  const { login, act } = useApp(), nav = useNavigate(), [f, setF] = useState({ email: '', password: '' })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const go = u => { login(u); nav(HOME[u.role]) }
  const submit = async e => { e.preventDefault(); const r = await act(() => api('/Auth/Login', 'POST', f)); if (r) go(toUser(r)) }

  return (
    <><Top minimal />
      <div className="login-page-container">
        <div className="login-form-side">
          <form className="card auth compact-auth" onSubmit={submit}>
            <h2>تسجيل الدخول</h2>
            <p style={{ color: 'var(--mute)', fontSize: 14 }}>أدخل بياناتك للمتابعة</p>
            <Field label="البريد الإلكتروني" type="email" value={f.email} onChange={set('email')} required />
            <Field label="كلمة المرور" type="password" value={f.password} onChange={set('password')} required />
            <div style={{ marginTop: 16 }}><button className="btn full">دخول</button></div>
            <p className="empty">ليس لديك حساب بعد؟{' '}<Link to="/register" style={{ color: 'var(--brand)' }}>أنشئ حساب</Link></p>
            {DEMO && <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, marginTop: 12 }}><small style={{ color: 'var(--mute)' }}>وضع المعاينة — ادخل كـ:</small>
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>{[['Patient', 'مريض'], ['Doctor', 'دكتور'], ['Admin', 'أدمن']].map(([r, l]) =>
                <button type="button" key={r} className="btn out sm" style={{ flex: 1 }} onClick={() => go({ token: 'demo', role: r, username: l })}>{l}</button>)}</div></div>}
          </form>
        </div>
        <div className="login-image-side" style={{ background: 'url(/clinic.jpg) center / cover' }}>
          <div className="login-overlay">
            <h2>أهلاً بك مجدداً!</h2>
            <p>نسعد بعودتك. سجّل دخولك للوصول إلى ملفك الشخصي وحجوزاتك بكل سهولة.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export function Register() {
  const { login, act } = useApp(), nav = useNavigate()
  const [f, setF] = useState({ firstName: '', lastName: '', username: '', email: '', phoneNumber: '', password: '', dateOfBirth: '' })
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const submit = async e => {
    e.preventDefault()
    const r = await act(() => api('/Auth/Register', 'POST', { ...f, dateOfBirth: f.dateOfBirth || null }))
    if (r) { const u = toUser(r === true ? {} : r); login({ ...u, role: u.role || 'Patient' }); nav('/my') }
  }
  return (
    <><Top minimal />
      <div className="login-page-container">
        <div className="login-form-side">
          <form className="card auth compact-auth" onSubmit={submit}>
            <h2>إنشاء حساب مريض</h2>
            <p style={{ color: 'var(--mute)', fontSize: 14 }}>عبّي بياناتك لتبدأ بحجز مواعيدك</p>
            <div className="row2">
              <Field label="الاسم الأول" required value={f.firstName} onChange={set('firstName')} />
              <Field label="اسم العائلة" required value={f.lastName} onChange={set('lastName')} />
            </div>
            <Field label="اسم المستخدم" required value={f.username} onChange={set('username')} />
            <Field label="البريد الإلكتروني" type="email" required value={f.email} onChange={set('email')} />
            <div className="row2">
              <Field label="رقم الهاتف" type="tel" required value={f.phoneNumber} onChange={set('phoneNumber')} />
              <Field label="تاريخ الميلاد" type="date" value={f.dateOfBirth} onChange={set('dateOfBirth')} />
            </div>
            <Field label="كلمة المرور" type="password" required value={f.password} onChange={set('password')} />
            <div style={{ marginTop: 16 }}><button className="btn full">إنشاء حساب</button></div>
            <p className="empty">لديك حساب بالفعل؟{' '}<Link to="/login" style={{ color: 'var(--brand)' }}>سجّل دخولك</Link></p>
          </form>
        </div>
        <div className="login-image-side" style={{ background: 'url(/clinic.jpg) center / cover' }}>
          <div className="login-overlay">
            <h2>أهلاً بك في عيادة الأمل</h2>
            <p>أنشئ حسابك لحجز مواعيدك ومتابعة حالتك بكل سهولة.</p>
          </div>
        </div>
      </div>
    </>
  )
}