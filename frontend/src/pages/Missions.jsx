import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import AppNav from '../components/AppNav'
import ConfirmModal from '../components/ConfirmModal'
import './Missions.css'

const TYPE_LABELS = { DPS: 'DPS', SAMU_92: 'SAMU 92', FORMATION: 'Formation', MARAUDE: 'Maraude', AUTRE: 'Autre' }
const TYPE_STYLE = {
  DPS:       { background: '#FFF7ED', color: '#C2410C' },
  SAMU_92:   { background: '#EFF6FF', color: '#1D4ED8' },
  FORMATION: { background: '#F5F3FF', color: '#6D28D9' },
  MARAUDE:   { background: '#F0FDF4', color: '#166534' },
  AUTRE:     { background: '#F4F4F5', color: '#52525B' },
}
const STATUS_LABELS = { EN_COURS: 'En cours', TERMINEE: 'Terminée', ANNULEE: 'Annulée', PLANIFIEE: 'Planifiée' }
const STATUS_CLASS  = { EN_COURS: 's-en', TERMINEE: 's-ok', ANNULEE: 's-no', PLANIFIEE: 's-pl' }
const TYPES    = ['DPS', 'SAMU_92', 'FORMATION', 'MARAUDE', 'AUTRE']
const STATUSES = ['EN_COURS', 'TERMINEE', 'ANNULEE', 'PLANIFIEE']

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function toTimeInput(t) { return t ? t.substring(0, 5) : '' }
function fromTimeInput(t) { return t ? t + ':00' : null }

const emptyForm = { name: '', type: 'DPS', date: '', startTime: '', location: '', status: 'EN_COURS' }

export default function Missions() {
  const { user } = useAuth()
  const apiFetch  = useApi()
  const navigate  = useNavigate()
  const [missions, setMissions] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [shown,    setShown]    = useState(5)

  const [createOpen,  setCreateOpen]  = useState(false)
  const [createForm,  setCreateForm]  = useState(emptyForm)
  const [creating,    setCreating]    = useState(false)
  const [createError, setCreateError] = useState('')

  const [editMission, setEditMission] = useState(null)
  const [editForm,    setEditForm]    = useState({})
  const [saving,      setSaving]      = useState(false)
  const [editError,   setEditError]   = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isAdmin = user?.role === 'ADMIN'

  useEffect(() => {
    apiFetch('/api/missions')
      .then(r => r.ok ? r.json() : [])
      .then(setMissions)
      .finally(() => setLoading(false))
  }, [apiFetch])

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      setCreateOpen(false)
      setEditMission(null)
      setConfirmDelete(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const currentMissions = missions.filter(m => m.status === 'EN_COURS')
  const historyMissions  = missions.filter(m => m.status !== 'EN_COURS')

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const res = await apiFetch('/api/missions', {
        method: 'POST',
        body: JSON.stringify({
          name:      createForm.name,
          type:      createForm.type,
          date:      createForm.date      || null,
          startTime: fromTimeInput(createForm.startTime),
          location:  createForm.location  || null,
          status:    createForm.status,
        }),
      })
      if (res.ok) {
        const created = await res.json()
        setMissions(prev => [created, ...prev])
        setCreateOpen(false)
        setCreateForm(emptyForm)
      } else {
        const body = await res.json().catch(() => ({}))
        setCreateError(body.message || 'Une erreur est survenue.')
      }
    } catch {
      setCreateError('Impossible de contacter le serveur.')
    } finally {
      setCreating(false)
    }
  }

  function openEdit(m) {
    setEditMission(m)
    setEditError('')
    setEditForm({
      name:      m.name,
      type:      m.type,
      date:      m.date      ?? '',
      startTime: toTimeInput(m.startTime),
      location:  m.location  ?? '',
      status:    m.status,
    })
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSaving(true)
    setEditError('')
    try {
      const res = await apiFetch(`/api/missions/${editMission.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name:      editForm.name,
          type:      editForm.type,
          date:      editForm.date      || null,
          startTime: fromTimeInput(editForm.startTime),
          location:  editForm.location  || null,
          status:    editForm.status,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMissions(prev => prev.map(m => m.id === updated.id ? updated : m))
        setEditMission(null)
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

  async function handleDelete() {
    setConfirmDelete(false)
    const res = await apiFetch(`/api/missions/${editMission.id}`, { method: 'DELETE' })
    if (res.ok) {
      setMissions(prev => prev.filter(m => m.id !== editMission.id))
      setEditMission(null)
    } else {
      setEditError('Impossible de supprimer cette mission.')
    }
  }

  return (
    <div className="missions-page">
      <AppNav />

      <main className="m-main">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-pri)', margin: 0 }}>Missions</h1>
            <p style={{ fontSize: 14, color: 'var(--text-sec)', margin: '4px 0 0' }}>
              Dispositifs de secours et interventions terrain
            </p>
          </div>
          <button className="btn-primary" onClick={() => { setCreateError(''); setCreateOpen(true) }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Créer une mission
          </button>
        </div>

        {/* Missions en cours */}
        {currentMissions.length > 0 && (
          <>
            <p className="m-section-label">
              {currentMissions.length === 1 ? 'Mission en cours' : 'Missions en cours'}
            </p>
            {currentMissions.map(m => (
              <div key={m.id} className="m-card m-card-current" style={{ marginBottom: 32, overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="status-badge s-en">
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }} />
                          En cours
                        </span>
                        <span style={{ ...TYPE_STYLE[m.type], padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                          {TYPE_LABELS[m.type]}
                        </span>
                        <span className="m-mono" style={{ fontSize: 12, color: 'var(--text-sec)' }}>{m.reference}</span>
                      </div>
                      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-pri)' }}>{m.name}</h2>
                      {(m.location || m.date) && (
                        <p style={{ fontSize: 14, color: 'var(--text-sec)', margin: 0 }}>
                          {[m.location, formatDate(m.date), toTimeInput(m.startTime)].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                      {isAdmin && (
                        <button className="btn-secondary" onClick={() => openEdit(m)} style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}>
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                          Modifier
                        </button>
                      )}
                      <button className="btn-primary" style={{ fontSize: 13 }} onClick={() => navigate(`/missions/${m.id}`)}>
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Vérification Matos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Historique */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="m-section-label" style={{ margin: 0 }}>Historique</p>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--surface2)', color: 'var(--text-sec)' }}>
            {historyMissions.length} mission{historyMissions.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="m-card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-sec)', fontSize: 14 }}>Chargement…</div>
          ) : historyMissions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-sec)', fontSize: 14 }}>
              Aucune mission dans l'historique.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="m-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Mission</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Statut</th>
                    {isAdmin && <th style={{ width: 110 }} />}
                  </tr>
                </thead>
                <tbody>
                  {historyMissions.slice(0, shown).map(m => (
                    <tr key={m.id}>
                      <td><span className="m-mono" style={{ fontSize: 12, color: 'var(--text-sec)' }}>{m.reference}</span></td>
                      <td><p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-pri)', margin: 0 }}>{m.name}</p></td>
                      <td>
                        <span style={{ ...TYPE_STYLE[m.type], padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>
                          {TYPE_LABELS[m.type]}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-sec)' }}>{formatDate(m.date)}</td>
                      <td><span className={`status-badge ${STATUS_CLASS[m.status]}`}>{STATUS_LABELS[m.status]}</span></td>
                      {isAdmin && (
                        <td>
                          <button className="btn-secondary" onClick={() => openEdit(m)}
                            style={{ padding: '6px 12px', fontSize: 12, gap: 5 }}>
                            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                            Modifier
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="m-table-footer">
            <p style={{ fontSize: 12, color: 'var(--text-sec)', margin: 0 }}>
              {Math.min(shown, historyMissions.length)} sur {historyMissions.length} mission{historyMissions.length !== 1 ? 's' : ''}
            </p>
            {shown < historyMissions.length && (
              <button className="btn-load-more" onClick={() => setShown(s => s + 10)}>Charger plus →</button>
            )}
          </div>
        </div>
      </main>

      {/* MODAL CRÉER */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Créer une mission</h2>
              <button className="modal-close" onClick={() => setCreateOpen(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form id="create-mission-form" onSubmit={handleCreate} className="modal-body">
              <div>
                <label className="form-label">Nom de la mission</label>
                <input required className="form-input" placeholder="Ex : DPS Fête nationale Colombes"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Type</label>
                <div className="type-grid">
                  {TYPES.map(t => (
                    <button key={t} type="button"
                      className={`type-btn${createForm.type === t ? ' selected' : ''}`}
                      onClick={() => setCreateForm(f => ({ ...f, type: t }))}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={createForm.date}
                    onChange={e => setCreateForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Heure de début</label>
                  <input type="time" className="form-input" value={createForm.startTime}
                    onChange={e => setCreateForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Lieu (optionnel)</label>
                <input className="form-input" placeholder="Ex : Stade Géo André, Colombes"
                  value={createForm.location}
                  onChange={e => setCreateForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              {createError && (
                <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                  {createError}
                </p>
              )}
            </form>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setCreateOpen(false)}>Annuler</button>
              <button type="submit" form="create-mission-form" className="btn-primary" disabled={creating}>
                {creating ? 'Création…' : 'Créer la mission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFIER */}
      {editMission && (
        <div className="modal-overlay" onClick={() => setEditMission(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier la mission</h2>
              <button className="modal-close" onClick={() => setEditMission(null)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form id="edit-mission-form" onSubmit={handleUpdate} className="modal-body">
              <div>
                <label className="form-label">Nom</label>
                <input required className="form-input" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Type</label>
                <div className="type-grid">
                  {TYPES.map(t => (
                    <button key={t} type="button"
                      className={`type-btn${editForm.type === t ? ' selected' : ''}`}
                      onClick={() => setEditForm(f => ({ ...f, type: t }))}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-grid-2">
                <div>
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={editForm.date}
                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Heure</label>
                  <input type="time" className="form-input" value={editForm.startTime}
                    onChange={e => setEditForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Lieu</label>
                <input className="form-input" value={editForm.location}
                  onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Statut</label>
                <select className="form-input" value={editForm.status}
                  onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              {editError && (
                <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                  {editError}
                </p>
              )}
            </form>
            <div className="modal-footer modal-footer-split">
              <button type="button" className="btn-secondary btn-delete"
                onClick={() => setConfirmDelete(true)}>
                <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
                Supprimer
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="btn-secondary" onClick={() => setEditMission(null)}>Annuler</button>
                <button type="submit" form="edit-mission-form" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && editMission && (
        <ConfirmModal
          title={`Supprimer « ${editMission.name} » ?`}
          message="Cette mission sera supprimée définitivement. Cette action est irréversible."
          icon="🗑️"
          variant="danger"
          confirmLabel="Supprimer la mission"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
    </div>
  )
}
