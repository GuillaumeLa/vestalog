import { useState, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import AdminLayout from '../components/AdminLayout'
import './admin.shared.css'
import './AdminLots.css'

const TYPE_META = {
  DPS:       { color: '#D9251D', emoji: '🚑' },
  SAMU_92:   { color: '#3B82F6', emoji: '🏥' },
  FORMATION: { color: '#8B5CF6', emoji: '📚' },
  MARAUDE:   { color: '#10B981', emoji: '🤝' },
  AUTRE:     { color: '#F59E0B', emoji: '📋' },
}

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="adm-toast">{msg}</div>
}

function TypeCard({ config, onClick, delay }) {
  const meta = TYPE_META[config.type] || { color: '#6B7280', emoji: '📋' }
  return (
    <div
      className="lot-card"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="lot-card-stripe" style={{ background: meta.color }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <span
              className="lot-internal-id"
              style={{ background: hexAlpha(meta.color, 0.12), color: meta.color }}
            >
              {meta.emoji} {config.type}
            </span>
            <h2 className="lot-name">{config.label}</h2>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
            background: config.lots.length > 0 ? hexAlpha(meta.color, 0.12) : 'var(--bg-elevated)',
            color: config.lots.length > 0 ? meta.color : 'var(--text-muted)',
          }}>
            {config.lots.length} lot{config.lots.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', minHeight: 24 }}>
          {config.lots.length > 0
            ? config.lots.map(l => (
                <div key={l.id} className="sac-dot" style={{ background: l.color }}>{l.name}</div>
              ))
            : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun lot configuré</span>
          }
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: meta.color }}>
            Configurer
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}

export default function AdminMissionTypes() {
  const apiFetch = useApi()

  const [configs, setConfigs] = useState([])
  const [lots, setLots]       = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null)

  const [editConfig, setEditConfig] = useState(null)
  const [selected, setSelected]     = useState([])
  const [saving, setSaving]         = useState(false)
  const [editError, setEditError]   = useState('')

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/mission-types').then(r => r.ok ? r.json() : []),
      apiFetch('/api/lots').then(r => r.ok ? r.json() : []),
    ]).then(([cfgs, allLots]) => {
      setConfigs(cfgs)
      setLots(allLots)
    }).finally(() => setLoading(false))
  }, [apiFetch])

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setEditConfig(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function openEdit(config) {
    setEditConfig(config)
    setSelected(config.lots.map(l => l.id))
    setEditError('')
  }

  function toggleLot(id) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSave() {
    setSaving(true)
    setEditError('')
    try {
      const res = await apiFetch(`/api/admin/mission-types/${editConfig.type}`, {
        method: 'PUT',
        body: JSON.stringify({ lotIds: selected }),
      })
      if (res.ok) {
        const updated = await res.json()
        setConfigs(prev => prev.map(c => c.type === updated.type ? updated : c))
        setEditConfig(null)
        setToast(`Configuration « ${updated.label} » enregistrée ✓`)
      } else {
        const body = await res.json().catch(() => ({}))
        setEditError(body.message || 'Une erreur est survenue.')
      }
    } catch {
      setEditError('Impossible de contacter le serveur.')
    } finally {
      setSaving(false)
    }
  }

  const meta = editConfig ? (TYPE_META[editConfig.type] || { color: '#6B7280' }) : null

  return (
    <AdminLayout currentPage="mission-types" wide>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-pri)', margin: 0 }}>Types de mission</h1>
          <p style={{ fontSize: 14, color: 'var(--text-sec)', margin: '4px 0 0' }}>
            Définissez les lots à vérifier pour chaque type de mission
          </p>
        </div>
      </div>

      {loading ? (
        <div className="adm-empty">Chargement…</div>
      ) : (
        <div className="lot-grid">
          {configs.map((config, i) => (
            <TypeCard
              key={config.type}
              config={config}
              delay={i * 60}
              onClick={() => openEdit(config)}
            />
          ))}
        </div>
      )}

      {editConfig && (
        <div className="adm-modal-overlay" onClick={() => setEditConfig(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>
                <span style={{ marginRight: 8 }}>{meta?.emoji}</span>
                Lots requis — {editConfig.label}
              </h2>
              <button className="adm-modal-close" onClick={() => setEditConfig(null)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="adm-modal-body">
              <p style={{ fontSize: 13, color: 'var(--text-sec)', margin: '0 0 16px' }}>
                Sélectionnez les lots qui doivent être vérifiés pour une mission de type <strong>{editConfig.label}</strong>.
              </p>

              {lots.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                  Aucun lot disponible — créez des lots d'abord.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {lots.map(lot => {
                    const isChecked = selected.includes(lot.id)
                    return (
                      <label
                        key={lot.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                          background: isChecked ? hexAlpha(lot.color, 0.06) : 'transparent',
                          border: `1px solid ${isChecked ? hexAlpha(lot.color, 0.3) : 'transparent'}`,
                          transition: 'background .15s, border-color .15s',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleLot(lot.id)}
                          style={{ accentColor: lot.color, width: 16, height: 16, flexShrink: 0 }}
                        />
                        <div
                          style={{
                            width: 14, height: 14, borderRadius: 4,
                            background: lot.color, flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-pri)' }}>
                            {lot.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-sec)', fontFamily: 'monospace' }}>
                            {lot.internalId}
                          </div>
                        </div>
                        {!lot.active && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                            Inactif
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
              )}

              {editError && (
                <p style={{
                  fontSize: 13, color: '#B91C1C', background: '#FEF2F2',
                  padding: '8px 12px', borderRadius: 8, margin: '12px 0 0',
                }}>
                  {editError}
                </p>
              )}
            </div>

            <div className="adm-modal-footer">
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {selected.length} lot{selected.length !== 1 ? 's' : ''} sélectionné{selected.length !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="adm-btn-secondary" onClick={() => setEditConfig(null)}>
                  Annuler
                </button>
                <button
                  type="button"
                  className="adm-btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  )
}
