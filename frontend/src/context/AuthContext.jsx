import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(null)
  const [user, setUser] = useState(null)
  const [isBootstrapping, setIsBootstrapping] = useState(true)

  const login = useCallback((authResponse) => {
    setAccessToken(authResponse.accessToken)
    setUser(authResponse.user)
  }, [])

  const logout = useCallback(async () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    }).catch(() => {})
    setAccessToken(null)
    setUser(null)
  }, [])

  const setBootstrapped = useCallback(() => {
    setIsBootstrapping(false)
  }, [])

  return (
    <AuthContext.Provider value={{ accessToken, user, login, logout, isBootstrapping, setBootstrapped }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
