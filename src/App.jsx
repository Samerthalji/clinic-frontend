import { Routes, Route, Navigate } from 'react-router-dom'
import { Guard, Shell } from './ui'
import { Home, Login, Register } from './pages/Public'
import { MyAppointments, Doctors, Profile } from './pages/Patient'
import { DoctorAppointments, Patients, Admin, NewUser } from './pages/Staff'

export default function App() {
  return <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route element={<Guard />}><Route element={<Shell />}>
      <Route element={<Guard roles={['Patient']} />}><Route path="/my" element={<MyAppointments />} /><Route path="/profile" element={<Profile />} /></Route>
      <Route element={<Guard roles={['Doctor']} />}><Route path="/mine" element={<DoctorAppointments />} /></Route>
      <Route element={<Guard roles={['Doctor', 'Admin']} />}><Route path="/patients" element={<Patients />} /></Route>
      <Route element={<Guard roles={['Admin']} />}>
        <Route path="/admin" element={<Admin />} /><Route path="/newuser" element={<NewUser />} /></Route>
      <Route element={<Guard roles={['Patient', 'Admin']} />}><Route path="/doctors" element={<Doctors />} /></Route>
    </Route></Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
}
