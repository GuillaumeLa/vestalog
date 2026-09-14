// Used only for the bootstrap refresh in App.jsx (before auth context is ready)
export async function bootstrapRefresh() {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error('Refresh failed')
  return res.json()
}
