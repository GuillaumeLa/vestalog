import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { bootstrapRefresh } from './api/client'
import Login from './pages/Login'
import Verify from './pages/Verify'
import Missions from './pages/Missions'
import MissionDetail from './pages/MissionDetail'
import InventoryCheck from './pages/InventoryCheck'
import AdminConsumables from './pages/AdminConsumables'
import AdminLots from './pages/AdminLots'
import AdminLotDetail from './pages/AdminLotDetail'
import AdminMissionTypes from './pages/AdminMissionTypes'
import AdminUsers from './pages/AdminUsers'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

function AppInner() {
  const auth = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    bootstrapRefresh()
      .then(data => auth.login(data))
      .catch(() => {})
      .finally(() => {
        setReady(true)
        auth.setBootstrapped()
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!ready) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg)'
    }}>
      <div style={{
        width: 24, height: 24,
        border: '2.5px solid var(--border-med)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin .7s linear infinite'
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <Routes>
      <Route path="/login"     element={<Login />} />
      <Route path="/verify"    element={<Verify />} />
      <Route path="/dashboard" element={<Navigate to="/missions" replace />} />
      <Route path="/missions"     element={<PrivateRoute><Missions /></PrivateRoute>} />
      <Route path="/missions/:id" element={<PrivateRoute><MissionDetail /></PrivateRoute>} />
      <Route path="/missions/:id/inventory" element={<PrivateRoute><InventoryCheck /></PrivateRoute>} />
      <Route path="/admin"            element={<AdminRoute><AdminConsumables /></AdminRoute>} />
      <Route path="/admin/lots"       element={<AdminRoute><AdminLots /></AdminRoute>} />
      <Route path="/admin/lots/:id"   element={<AdminRoute><AdminLotDetail /></AdminRoute>} />
      <Route path="/admin/mission-types" element={<AdminRoute><AdminMissionTypes /></AdminRoute>} />
      <Route path="/admin/users"          element={<AdminRoute><AdminUsers /></AdminRoute>} />
      <Route path="*"          element={<Navigate to={auth.accessToken ? '/missions' : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </AuthProvider>
  )
}
