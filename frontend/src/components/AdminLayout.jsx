import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../hooks/useTheme'
import '../pages/admin.shared.css'
import './AdminLayout.css'

const NAV_ITEMS = [
  {
    key: 'overview',
    label: "Vue d'ensemble",
    path: null,
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: 'consumables',
    label: 'Consommables',
    path: '/admin',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
  },
  {
    key: 'lots',
    label: 'Lots & Sacs',
    path: '/admin/lots',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
  },
  {
    key: 'mission-types',
    label: 'Types de mission',
    path: '/admin/mission-types',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    key: 'users',
    label: 'Utilisateurs',
    path: '/admin/users',
    icon: (
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
]

const BREADCRUMB = {
  overview: "Vue d'ensemble",
  consumables: 'Consommables',
  lots: 'Lots & Sacs',
  'mission-types': 'Types de mission',
  users: 'Utilisateurs',
}

export default function AdminLayout({ currentPage, children, wide }) {
  const { user, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'
  const fullName = user ? `${user.firstName} ${user.lastName[0]}.` : ''

  function handleNav(item) {
    setSidebarOpen(false)
    if (item.path) navigate(item.path)
  }

  function handleLogout() {
    setUserMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-root">
      {sidebarOpen && (
        <div className="adm-overlay open" onClick={() => setSidebarOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`adm-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="adm-sidebar-head">
          <div className="adm-logo-box">
            <svg fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div className="adm-logo-title">VestaLog</div>
            <div className="adm-logo-sub">Administration</div>
          </div>
        </div>

        <nav className="adm-nav">
          <p className="adm-section-label">Administration</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`adm-nav-item${currentPage === item.key ? ' active' : ''}`}
              onClick={() => handleNav(item)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <p className="adm-section-label">Navigation</p>
          <button className="adm-nav-item" onClick={() => { setSidebarOpen(false); navigate('/missions') }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Vue bénévole
          </button>

          <div className="adm-nav-spacer" />
        </nav>

        {/* Sidebar user footer */}
        <div className="adm-user-footer">
          <div className="adm-user-row" style={{ cursor: 'default' }}>
            <div className="adm-user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="adm-user-name">{fullName}</div>
              <div className="adm-user-role">Administrateur</div>
            </div>
          </div>
          <button className="adm-logout-btn" onClick={handleLogout}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="adm-main">
        {/* Topbar */}
        <header className="adm-topbar">
          <button className="adm-menu-btn" onClick={() => setSidebarOpen((o) => !o)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="adm-breadcrumb">
            <span>Admin</span>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span className="adm-breadcrumb-current">{BREADCRUMB[currentPage] ?? currentPage}</span>
          </div>

          <div className="adm-topbar-spacer" />

          <button className="adm-theme-btn" onClick={toggle} aria-label="Basculer le thème">
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

          {/* Avatar + dropdown */}
          <div className="adm-user-menu-wrap" ref={userMenuRef}>
            <button
              className={`adm-user-avatar adm-avatar-btn${userMenuOpen ? ' open' : ''}`}
              style={{ width: 32, height: 32, fontSize: 12 }}
              onClick={() => setUserMenuOpen((o) => !o)}
              aria-label="Menu utilisateur"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="adm-user-dropdown">
                <div className="adm-udrop-header">
                  <div className="adm-user-avatar" style={{ width: 34, height: 34, fontSize: 13, flexShrink: 0 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="adm-udrop-name">{user?.firstName} {user?.lastName}</div>
                    <div className="adm-udrop-email">{user?.email}</div>
                  </div>
                </div>
                <div className="adm-udrop-divider" />
                <button className="adm-udrop-item danger" onClick={handleLogout}>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className={`adm-content${wide ? ' wide' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
