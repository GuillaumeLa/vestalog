import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import logo from '../assets/vestalog_logo_transparent.svg'
import './AppNav.css'

export default function AppNav() {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const isAdmin = user?.role === 'ADMIN'
  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'
  const fullName = user ? `${user.firstName} ${user.lastName}` : ''

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleLogout() {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <nav className="m-nav">
      <a href="/missions" className="m-nav-logo">
        <img src={logo} alt="VestaLog" className="m-nav-logo-img" />
      </a>

      <div className="m-nav-spacer" />

      <div className="m-nav-actions">
        <button className="m-theme-btn" onClick={toggle} aria-label="Basculer le thème">
          {theme === 'dark' ? (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707m12.728 12.728.707.707M1 12h2m18 0h2M4.22 19.78l.707-.707M18.95 5.05l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {isAdmin && (
          <button className="m-admin-badge" onClick={() => navigate('/admin')} style={{ border: 'none', cursor: 'pointer' }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Admin
          </button>
        )}

        {/* Avatar + dropdown */}
        <div className="m-user-wrap" ref={menuRef}>
          <button
            className={`m-avatar m-avatar-btn${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu utilisateur"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="m-user-dropdown">
              <div className="m-udrop-header">
                <div className="m-avatar" style={{ width: 36, height: 36, fontSize: 13, flexShrink: 0, cursor: 'default' }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="m-udrop-name">{fullName}</div>
                  <div className="m-udrop-email">{user?.email}</div>
                </div>
              </div>

              <div className="m-udrop-divider" />

              <button className="m-udrop-item" onClick={handleLogout}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
