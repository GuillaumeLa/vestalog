import { useState, useRef } from 'react'
import './Login.css'
import { useTheme } from '../hooks/useTheme'

const SunIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.728 12.728.707.707M1 12h2m18 0h2M4.22 19.78l.707-.707M18.95 5.05l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
  </svg>
)
const MoonIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
  </svg>
)

export default function Login() {
  const { theme, toggle } = useTheme()
  const [step, setStep]         = useState('email')
  const [email, setEmail]       = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading]   = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [canResend, setCanResend] = useState(false)
  const cdRef = useRef(null)

  function startCountdown(sec) {
    clearInterval(cdRef.current)
    setCanResend(false)
    setCountdown(sec)
    cdRef.current = setInterval(() => {
      setCountdown(n => {
        if (n <= 1) { clearInterval(cdRef.current); setCanResend(true); return 0 }
        return n - 1
      })
    }, 1000)
  }

  async function callLogin(addr) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addr }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'Adresse non autorisée.')
    }
  }

  async function submitEmail() {
    setErrorMsg('')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Adresse email invalide.')
      return
    }
    setLoading(true)
    try {
      await callLogin(email)
      setStep('magic')
      startCountdown(60)
    } catch (e) {
      setErrorMsg(e.message || 'Impossible de contacter le serveur.')
    } finally {
      setLoading(false)
    }
  }

  async function resend() {
    setCanResend(false)
    try { await callLogin(email) } catch {}
    startCountdown(60)
  }

  return (
    <div className="login-root">
      <div className="login-wrapper">
        <div className="card">
          <button className="login-theme-btn" onClick={toggle} aria-label="Basculer le thème">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="logo-wrap">
            <div className="logo-box"><div className="logo-crx" /></div>
            <div>
              <p className="logo-title">VestaLog</p>
              <p className="logo-sub">CRF COLOMBES — GESTION MATÉRIEL</p>
            </div>
          </div>

          {step === 'email' && (
            <div className="step" role="region" aria-label="Connexion — saisie email">
              <h1 className="step-title">Connexion</h1>
              <p className="step-sub">
                Saisissez votre adresse email pour recevoir un lien de connexion.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="emailInput">Adresse email</label>
                <input
                  type="email"
                  className={`form-input${errorMsg ? ' error' : ''}`}
                  id="emailInput"
                  placeholder="prenom.nom@croix-rouge.fr"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg('') }}
                  onKeyDown={e => e.key === 'Enter' && submitEmail()}
                  autoFocus
                />
                {errorMsg && (
                  <p className="error-msg" role="alert">{errorMsg}</p>
                )}
              </div>
              <button className="btn-submit" onClick={submitEmail} disabled={loading}>
                {loading
                  ? <div className="spinner" />
                  : <>
                      <span>Recevoir le lien de connexion</span>
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width:17,height:17}}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7-7 7m-11-7h18"/>
                      </svg>
                    </>
                }
              </button>
            </div>
          )}

          {step === 'magic' && (
            <div className="step" role="region" aria-label="Lien de connexion envoyé">
              <div className="circle-icon blue" aria-hidden="true">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </div>
              <h1 className="centered-title">Vérifiez vos emails</h1>
              <div style={{display:'flex',justifyContent:'center',margin:'12px 0 18px'}}>
                <span className="email-chip">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    style={{width:13,height:13,flexShrink:0,color:'var(--text-muted)'}}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"/>
                  </svg>
                  {email}
                </span>
              </div>
              <p className="centered-sub">
                Un lien de connexion a été envoyé. Il est valide{' '}
                <strong>15 minutes</strong>. Cliquez dessus pour accéder directement à VestaLog.
              </p>
              <p className="centered-sub" style={{marginTop:8,fontSize:13,color:'var(--text-muted)'}}>
                Pas reçu ? Vérifiez vos spams.
              </p>
              <div className="resend-row">
                <button className="link-btn" onClick={() => { clearInterval(cdRef.current); setStep('email') }}>
                  ← Modifier l'email
                </button>
                <span>
                  {countdown > 0 && (
                    <span className="countdown" aria-live="polite">Renvoyer dans {countdown}s</span>
                  )}
                  {canResend && (
                    <button className="link-btn red" onClick={resend}>Renvoyer le lien</button>
                  )}
                </span>
              </div>
            </div>
          )}
        </div>

        <p className="card-footer">
          Accès réservé aux bénévoles autorisés de l'UL Colombes.<br />
          Problème ? <a href="mailto:admin@crf-colombes.fr">Contactez l'administrateur</a>
        </p>
      </div>
    </div>
  )
}
