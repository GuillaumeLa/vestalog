import { useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'

// Module-level promise to deduplicate concurrent refresh calls
let _refreshPromise = null

export function useApi() {
  const auth = useAuth()
  // Always points to the latest auth without staling the callback
  const authRef = useRef(auth)
  authRef.current = auth

  return useCallback(async (url, options = {}) => {
    const { accessToken, login, logout } = authRef.current

    const makeRequest = (token) => fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    let res = await makeRequest(accessToken)

    if (res.status !== 401) return res

    try {
      if (!_refreshPromise) {
        _refreshPromise = fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })
          .then(r => { if (!r.ok) throw new Error('Refresh failed'); return r.json() })
          .then(data => { login(data); return data.accessToken })
          .finally(() => { _refreshPromise = null })
      }
      const newToken = await _refreshPromise
      return makeRequest(newToken)
    } catch {
      logout()
      return res
    }
  }, []) // Stable — reads auth via ref
}
