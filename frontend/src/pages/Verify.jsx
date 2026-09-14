import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Verify() {
  const auth     = useAuth()
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState('')
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')

    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    fetch('/api/auth/verify', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => {
        if (!res.ok) return res.json().then(b => Promise.reject(b))
        return res.json()
      })
      .then(data => {
        auth.login(data)
        navigate('/missions', { replace: true })
      })
      .catch(err => {
        setErrorMsg(err?.message || 'Lien invalide ou expiré.')
      })
  }, [auth.login, navigate])

  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', flexDirection:'column', gap:16,
      background:'var(--bg)', color:'var(--text-pri)', fontFamily:'var(--font)'
    }}>
      {!errorMsg ? (
        <>
          <div style={{
            width:24, height:24,
            border:'2.5px solid var(--border-med)',
            borderTopColor:'var(--accent)',
            borderRadius:'50%', animation:'spin .7s linear infinite'
          }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <p style={{color:'var(--text-sec)', fontSize:14}}>Connexion en cours…</p>
        </>
      ) : (
        <>
          <p style={{color:'var(--accent)', fontWeight:600}}>{errorMsg}</p>
          <a href="/login" style={{color:'var(--text-sec)', fontSize:14}}>
            ← Retour à la connexion
          </a>
        </>
      )}
    </div>
  )
}
