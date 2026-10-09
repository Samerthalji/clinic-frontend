// ===== الإعدادات =====
export const API = 'https://localhost:7047/api' // رابط الباك إند
export const DEMO = false // true = بيانات تجريبية بدون باك إند

const h = n => new Date(Date.now() + n * 36e5).toISOString()
const M = {
  docs: [
    { id: 1, firstName: 'سامي', lastName: 'الخطيب', specialization: 'قلبية', clinicRoom: '101', consultationFee: 25, isActive: true },
    { id: 2, firstName: 'لينا', lastName: 'عودة', specialization: 'أطفال', clinicRoom: '102', consultationFee: 20, isActive: true },
    { id: 3, firstName: 'كريم', lastName: 'حداد', specialization: 'جلدية', clinicRoom: '201', consultationFee: 22, isActive: true },
    { id: 4, firstName: 'هديل', lastName: 'النمري', specialization: 'عظام', clinicRoom: '202', consultationFee: 30, isActive: false }],
  pats: [
    { id: 1, firstName: 'أحمد', lastName: 'يوسف', phoneNumber: '0780000001', dateOfBirth: '1995-04-12', address: 'عمّان' },
    { id: 2, firstName: 'رنا', lastName: 'سالم', phoneNumber: '0780000002', dateOfBirth: '1989-09-30', address: 'إربد' },
    { id: 3, firstName: 'محمود', lastName: 'العلي', phoneNumber: '0780000003', dateOfBirth: '2001-01-05', address: 'الزرقاء' }],
  appts: [
    { id: 1, doctorId: 1, patientId: 1, status: 'Pending', appointmentDate: h(5) },
    { id: 2, doctorId: 2, patientId: 1, status: 'Confirmed', appointmentDate: h(30) },
    { id: 3, doctorId: 3, patientId: 1, status: 'Completed', appointmentDate: h(-72) },
    { id: 4, doctorId: 1, patientId: 2, status: 'Confirmed', appointmentDate: h(3) },
    { id: 5, doctorId: 1, patientId: 3, status: 'Pending', appointmentDate: h(26) }]
}
const dto = a => {
  const d = M.docs.find(x => x.id === a.doctorId), p = M.pats.find(x => x.id === a.patientId)
  return { ...a, doctorFullName: `${d.firstName} ${d.lastName}`, patientFullName: `${p.firstName} ${p.lastName}` }
}
async function mock(path, method, body) {
  const [p, q] = path.split('?'); let m
  await new Promise(r => setTimeout(r, 250))
  if (p === '/Auth/Login') return { token: 'demo', roles: [body.email.includes('admin') ? 'Admin' : body.email.includes('dr') ? 'Doctor' : 'Patient'], username: 'تجريبي' }
  if (p === '/Doctors') return M.docs
  if (p === '/Appointments/my') return M.appts.filter(a => a.patientId === 1).map(dto)
  if (p === '/Appointments/doctor/my') return M.appts.filter(a => a.doctorId === 1).map(dto)
  if (m = p.match(/^\/Appointments\/doctor\/(\d+)$/)) return M.appts.filter(a => a.doctorId == m[1]).map(dto)
  if (p === '/Appointments' && method === 'POST') { M.appts.push({ id: Date.now(), patientId: 1, status: 'Pending', ...body }); return null }
  if (m = p.match(/^\/Appointments\/(\d+)\/status$/)) { M.appts.find(a => a.id == m[1]).status = body.status; return null }
  if ((m = p.match(/^\/Appointments\/(\d+)$/)) && method === 'DELETE') { M.appts = M.appts.filter(a => a.id != m[1]); return null }
  if (p === '/Patients/me') return M.pats[0]
  if ((m = p.match(/^\/Patients\/(\d+)$/)) && method === 'PUT') { Object.assign(M.pats.find(x => x.id == m[1]), body); return null }
  if (p === '/Patients') return { totalCount: M.pats.length, data: M.pats }
  if (p === '/Patients/search') return M.pats.filter(x => (x.firstName + x.lastName).includes(new URLSearchParams(q).get('name')))
  if (m = p.match(/^\/Doctors\/(\d+)\/toggle-active$/)) { const d = M.docs.find(x => x.id == m[1]); d.isActive = !d.isActive; return null }
  if ((m = p.match(/^\/Doctors\/(\d+)$/)) && method === 'DELETE') { M.docs = M.docs.filter(x => x.id != m[1]); return null }
  return null
}

let refreshing = null
function refresh() {
  const s = JSON.parse(localStorage.getItem('mc') || 'null')
  if (!s?.refreshToken) return Promise.resolve(false)
  refreshing ||= fetch(API + '/Auth/RefreshToken', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: s.refreshToken }) })
    .then(r => r.ok ? r.json() : null)
    .then(r => { if (!r?.token) return false; localStorage.setItem('mc', JSON.stringify({ ...s, token: r.token, refreshToken: r.refreshToken || s.refreshToken })); return true })
    .catch(() => false).finally(() => { refreshing = null })
  return refreshing
}

export async function api(path, method = 'GET', body) {
  if (DEMO) return mock(path, method, body)
  const call = () => {
    const s = JSON.parse(localStorage.getItem('mc') || 'null')
    return fetch(API + path, {
      method, body: body ? JSON.stringify(body) : undefined,
      headers: { 'Content-Type': 'application/json', ...(s ? { Authorization: 'Bearer ' + s.token } : {}) }
    })
  }
  let res = await call()
  if (res.status === 401 && !path.startsWith('/Auth') && await refresh()) res = await call() // تجديد التوكن مرة وحدة
  if (res.status === 401) { localStorage.removeItem('mc'); location.assign('/login'); throw new Error('سجّلي الدخول من جديد') }
  if (res.status === 403) throw new Error('ليس لديك صلاحية لهذا الإجراء')
  const txt = await res.text(); let data = null
  try { data = txt ? JSON.parse(txt) : null } catch { data = txt }
  if (!res.ok) throw new Error((typeof data === 'string' ? data : data?.message || (data?.errors && Object.values(data.errors).flat()[0])) || 'صار خطأ، حاول مرة ثانية')
  return data
}
// حوّلي أسماء الحقول هنا حسب الـ AuthModel عندك
export const toUser = r => ({ token: r.token || r.accessToken, refreshToken: r.refreshToken, role: (r.roles || [])[0], username: r.username })
