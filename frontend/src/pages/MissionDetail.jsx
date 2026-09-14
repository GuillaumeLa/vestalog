import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import AppNav from '../components/AppNav'
import ConfirmModal from '../components/ConfirmModal'
import './Missions.css'
import './MissionDetail.css'

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
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function toTimeInput(t) { return t ? t.substring(0, 5) : '' }
function fromTimeInput(t) { return t ? t + ':00' : null }

function Avatar({ user, size = 32, fontSize = 12 }) {
  const initials = user?.initials || (user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?')
  return (
    <div
      className="md-avatar"
      style={{ width: size, height: size, fontSize }}
      title={`${user.firstName} ${user.lastName}`}
    >
      {initials}
    </div>
  )
}

export default function MissionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user: me } = useAuth()
  const apiFetch = useApi()

  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [collabOpen, setCollabOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [confirmRemove, setConfirmRemove] = useState(null)

  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const [invCheck, setInvCheck] = useState(undefined) // undefined=chargement, null=aucune, objet=existante

  const isAdmin = me?.role === 'ADMIN'

  useEffect(() => {
    apiFetch(`/api/missions/${id}`)
      .then(r => {
        if (r.status === 404 || r.status === 403) { setNotFound(true); return null }
        return r.ok ? r.json() : null
      })
      .then(data => { if (data) setMission(data) })
      .finally(() => setLoading(false))
  }, [apiFetch, id])

  useEffect(() => {
    apiFetch(`/api/inv-checks/mission/${id}`)
      .then(r => r.status === 404 ? null : r.ok ? r.json() : null)
      .then(data => setInvCheck(data))
      .catch(() => setInvCheck(null))
  }, [apiFetch, id])

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      setCollabOpen(false)
      setEditOpen(false)
      setConfirmRemove(null)
      setConfirmDelete(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function openEdit() {
    setEditForm({
      name:      mission.name,
      type:      mission.type,
      date:      mission.date ?? '',
      startTime: toTimeInput(mission.startTime),
      location:  mission.location ?? '',
      status:    mission.status,
    })
    setEditError('')
    setEditOpen(true)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setSaving(true)
    setEditError('')
    try {
      const res = await apiFetch(`/api/missions/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name:      editForm.name,
          type:      editForm.type,
          date:      editForm.date || null,
          startTime: fromTimeInput(editForm.startTime),
          location:  editForm.location || null,
          status:    editForm.status,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMission(updated)
        setEditOpen(false)
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
    const res = await apiFetch(`/api/missions/${id}`, { method: 'DELETE' })
    if (res.ok) navigate('/missions')
    else setEditError('Impossible de supprimer cette mission.')
  }

  async function handleInvite(e) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    try {
      const res = await apiFetch(`/api/missions/${id}/participants`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail }),
      })
      if (res.ok) {
        const updated = await res.json()
        setMission(updated)
        setInviteEmail('')
      } else {
        const body = await res.json().catch(() => ({}))
        setInviteError(body.message || 'Une erreur est survenue.')
      }
    } catch {
      setInviteError('Impossible de contacter le serveur.')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemoveParticipant(userId) {
    setConfirmRemove(null)
    const res = await apiFetch(`/api/missions/${id}/participants/${userId}`, { method: 'DELETE' })
    if (res.ok) {
      const updated = await res.json()
      setMission(updated)
    }
  }

  if (loading) {
    return (
      <div className="missions-page">
        <AppNav />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="md-spinner" />
        </div>
      </div>
    )
  }

  if (notFound || !mission) {
    return (
      <div className="missions-page">
        <AppNav />
        <main className="m-main">
          <button className="md-back-btn" onClick={() => navigate('/missions')}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour aux missions
          </button>
          <div className="m-card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-sec)', marginTop: 16 }}>
            Mission introuvable ou accès refusé.
          </div>
        </main>
      </div>
    )
  }

  const allMembers = [
    ...(mission.creator ? [{ ...mission.creator, role: 'creator' }] : []),
    ...mission.participants.map(p => ({ ...p, role: 'participant' })),
  ]

  const canManageParticipants = isAdmin ||
    (mission.creator && mission.creator.email === me?.email)

  return (
    <div className="missions-page">
      <AppNav />

      <main className="m-main">
        {/* Back */}
        <button className="md-back-btn" onClick={() => navigate('/missions')}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour aux missions
        </button>

        {/* Mission card */}
        <div className="m-card m-card-current" style={{ marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                  <span className={`status-badge ${STATUS_CLASS[mission.status]}`}>
                    {STATUS_LABELS[mission.status]}
                  </span>
                  <span style={{ ...TYPE_STYLE[mission.type], padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 600 }}>
                    {TYPE_LABELS[mission.type]}
                  </span>
                  <span className="m-mono" style={{ fontSize: 12, color: 'var(--text-sec)' }}>{mission.reference}</span>
                </div>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: 'var(--text-pri)' }}>{mission.name}</h1>
                {(mission.location || mission.date || mission.startTime) && (
                  <p style={{ fontSize: 14, color: 'var(--text-sec)', margin: 0 }}>
                    {[
                      mission.location,
                      formatDate(mission.date),
                      toTimeInput(mission.startTime) || null,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {isAdmin && (
                <button className="btn-secondary" onClick={openEdit} style={{ padding: '6px 12px', fontSize: 12, gap: 5, flexShrink: 0 }}>
                  <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Modifier
                </button>
              )}
            </div>

            {/* Collaborators row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginRight: 2 }}>Bénévoles</span>
              <div className="md-avatar-stack">
                {allMembers.slice(0, 5).map(u => (
                  <Avatar key={u.id} user={u} />
                ))}
                {allMembers.length > 5 && (
                  <div className="md-avatar md-avatar-more">+{allMembers.length - 5}</div>
                )}
                {allMembers.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun bénévole assigné</span>
                )}
              </div>
              <button
                className="md-collab-btn"
                onClick={() => { setInviteError(''); setCollabOpen(true) }}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Gérer
              </button>
            </div>
          </div>
        </div>

        {/* Action cards */}
        <p className="m-section-label" style={{ marginBottom: 12 }}>Actions</p>
        <div className="md-action-grid">
          <button className="md-action-card md-action-card--primary" onClick={() => navigate(`/missions/${id}/inventory`)}>
            <div className="md-action-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span className="md-action-title">Vérification du matériel</span>
                {invCheck?.status === 'COMPLETED' && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'rgba(16,185,129,.12)', padding: '2px 8px', borderRadius: 99, lineHeight: 1.6 }}>
                    Terminée
                  </span>
                )}
                {invCheck?.status === 'IN_PROGRESS' && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'rgba(79,126,255,.12)', padding: '2px 8px', borderRadius: 99, lineHeight: 1.6 }}>
                    En cours
                  </span>
                )}
              </div>
              <div className="md-action-desc">
                {invCheck?.status === 'IN_PROGRESS' && `${invCheck.checkedItems} / ${invCheck.totalItems} items cochés`}
                {invCheck?.status === 'COMPLETED' && `${invCheck.checkedItems} / ${invCheck.totalItems} items cochés`}
                {(invCheck === null || invCheck === undefined) && 'Contrôler les lots et consommables'}
              </div>
            </div>
            <svg className="md-action-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button className="md-action-card" disabled>
            <div className="md-action-icon md-action-icon--sec">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div className="md-action-title">Rapport de mission</div>
              <div className="md-action-desc">Générer le bilan de la mission</div>
            </div>
            <svg className="md-action-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </main>

      {/* COLLABORATORS MODAL */}
      {collabOpen && (
        <div className="modal-overlay" onClick={() => setCollabOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bénévoles de la mission</h2>
              <button className="modal-close" onClick={() => setCollabOpen(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="modal-body">
              {/* Members list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {allMembers.length === 0 && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    Aucun bénévole pour l'instant.
                  </p>
                )}
                {allMembers.map(u => (
                  <div key={u.id} className="md-member-row">
                    <Avatar user={u} size={34} fontSize={13} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-pri)' }}>
                        {u.firstName} {u.lastName}
                        {u.role === 'creator' && (
                          <span className="md-creator-badge">Créateur</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-sec)' }}>{u.email}</div>
                    </div>
                    {u.role === 'participant' && canManageParticipants && (
                      <button
                        className="md-remove-btn"
                        onClick={() => setConfirmRemove(u)}
                        title="Retirer"
                      >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Invite form */}
              {canManageParticipants && (
                <>
                  <div className="md-divider" />
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                    Inviter un bénévole
                  </p>
                  <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="email@exemple.fr"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className="btn-primary" disabled={inviting} style={{ flexShrink: 0 }}>
                      {inviting ? '…' : 'Inviter'}
                    </button>
                  </form>
                  {inviteError && (
                    <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                      {inviteError}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer">
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {allMembers.length} bénévole{allMembers.length !== 1 ? 's' : ''}
              </span>
              <button type="button" className="btn-secondary" onClick={() => setCollabOpen(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL (admin only) */}
      {editOpen && (
        <div className="modal-overlay" onClick={() => setEditOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Modifier la mission</h2>
              <button className="modal-close" onClick={() => setEditOpen(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <form id="md-edit-form" onSubmit={handleUpdate} className="modal-body">
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
                <button type="button" className="btn-secondary" onClick={() => setEditOpen(false)}>Annuler</button>
                <button type="submit" form="md-edit-form" className="btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmRemove && (
        <ConfirmModal
          title={`Retirer ${confirmRemove.firstName} ${confirmRemove.lastName} ?`}
          message="Ce bénévole n'aura plus accès à cette mission."
          icon="👤"
          variant="danger"
          confirmLabel="Retirer"
          onConfirm={() => handleRemoveParticipant(confirmRemove.id)}
          onCancel={() => setConfirmRemove(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmModal
          title={`Supprimer « ${mission.name} » ?`}
          message="Cette mission sera supprimée définitivement. Cette action est irréversible."
          icon="🗑️"
          variant="danger"
          confirmLabel="Supprimer la mission"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
