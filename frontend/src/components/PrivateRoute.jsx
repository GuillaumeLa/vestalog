import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PrivateRoute({ children }) {
  const { accessToken, isBootstrapping } = useAuth()
  if (isBootstrapping) return null
  if (!accessToken) return <Navigate to="/login" replace />
  return children
}
