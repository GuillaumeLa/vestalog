import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import AdminLayout from '../components/AdminLayout'
import ConfirmModal from '../components/ConfirmModal'
import './admin.shared.css'
import './AdminLots.css'

const ACCENT_COLORS = ['#D9251D', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9']

const emptyForm = { name: '', description: '', internalId: '', color: '#D9251D', active: true }

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="adm-toast">{msg}</div>
}

function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${a})`
}

function ColorPicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {ACCENT_COLORS.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          style={{
            width: 32, height: 32, borderRadius: 8,
            background: c, border: 'none', cursor: 'pointer',
            outline: value === c ? `3px solid ${c}` : '2px solid transparent',
            outlineOffset: 2,
            transition: 'outline .1s',
          }}
        />
      ))}
    </div>
  )
}

function LotCard({ lot, onClick, delay }) {
  return (
    <div
      className="lot-card"
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      <div className="lot-card-stripe" style={{ background: lot.color }} />
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
          <div style={{ minWidth: 0 }}>
            <span
              className="lot-internal-id"
              style={{ background: hexAlpha(lot.color, 0.12), color: lot.color }}
            >
              {lot.internalId}
            </span>
            <h2 className="lot-name">{lot.name}</h2>
            {lot.description && <p className="lot-desc">{lot.description}</p>}
          </div>
          <span className={`lot-status ${lot.active ? 'lot-status-active' : 'lot-status-inactive'}`}>
            {lot.active ? 'Actif' : 'Inactif'}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', minHeight: 24 }}>
          {lot.sacs.length > 0
            ? lot.sacs.map(s => (
                <div key={s.id} className="sac-dot" style={{ background: s.color }}>{s.label}</div>
              ))
            : <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Aucun sac configuré</span>
          }
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-pri)', margin: 0 }}>{lot.sacs.length}</p>
              <p style={{ fontSize: 12, color: 'var(--text-sec)', margin: 0 }}>Sacs</p>
            </div>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: lot.color }}>
            Éditer
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </div>
  )
}

function LotFormFields({ form, setForm }) {
  return (
    <>
      <div>
        <label className="adm-label">Nom du lot</label>
        <input required className="adm-input" placeholder="Ex : Lot Gamma"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="adm-label">Description</label>
        <input className="adm-input" placeholder="Ex : Maraude hivernale"
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </div>
      <div>
        <label className="adm-label">ID interne</label>
        <input className="adm-input mono" placeholder="LOT-004"
          value={form.internalId}
          onChange={e => setForm(f => ({ ...f, internalId: e.target.value }))} />
      </div>
      <div>
        <label className="adm-label">Couleur d'accent</label>
        <ColorPicker value={form.color} onChange={c => setForm(f => ({ ...f, color: c }))} />
      </div>
      <div className="adm-toggle">
        <div>
          <div className="adm-toggle-label">Lot actif</div>
          <div className="adm-toggle-sub">Visible et utilisable pour les missions</div>
        </div>
        <label className="tgl">
          <input type="checkbox" checked={form.active}
            onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
          <div className="tslider" />
        </label>
      </div>
    </>
  )
}

export default function AdminLots() {
  const apiFetch = useApi()
  const navigate = useNavigate()

  const [lots, setLots]       = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast]     = useState(null)

  const [createOpen,  setCreateOpen]  = useState(false)
  const [createForm,  setCreateForm]  = useState(emptyForm)
  const [creating,    setCreating]    = useState(false)
  const [createError, setCreateError] = useState('')

  const [editLot,   setEditLot]   = useState(null)
  const [editForm,  setEditForm]  = useState(emptyForm)
  const [saving,    setSaving]    = useState(false)
  const [editError, setEditError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    apiFetch('/api/lots')
      .then(r => r.ok ? r.json() : [])
      .then(setLots)
      .finally(() => setLoading(false))
  }, [apiFetch])

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      setCreateOpen(false)
      setEditLot(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function openCreate() {
    setCreateForm(emptyForm)
    setCreateError('')
    setCreateOpen(true)
  }

  function openEdit(lot) {
    setEditLot(lot)
    setEditError('')
    setEditForm({
      name: lot.name,
      description: lot.description ?? '',
      internalId: lot.internalId,
      color: lot.color,
      active: lot.active,
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const res = await apiFetch('/api/lots', {
        method: 'POST',
        body: JSON.stringify(createForm),
      })
      if (res.ok) {
        const created = await res.json()
        setLots(prev => [...prev, created])
        setCreateOpen(false)
        setToast(`Lot « ${created.name} » créé ✓`)
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

  async function handleUpdate(e) {
    e.preventDefault()
    setSaving(true)
    setEditError('')
    try {
      const res = await apiFetch(`/api/lots/${editLot.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      })
      if (res.ok) {
        const updated = await res.json()
        setLots(prev => prev.map(l => l.id === updated.id ? updated : l))
        setEditLot(null)
        setToast('Modifications enregistrées ✓')
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
    const res = await apiFetch(`/api/lots/${editLot.id}`, { method: 'DELETE' })
    if (res.ok) {
      setLots(prev => prev.filter(l => l.id !== editLot.id))
      setEditLot(null)
      setToast('Lot supprimé')
    } else {
      setEditError('Impossible de supprimer ce lot.')
    }
  }

  return (
    <AdminLayout currentPage="lots" wide>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-pri)', margin: 0 }}>Lots &amp; Sacs</h1>
          <p style={{ fontSize: 14, color: 'var(--text-sec)', margin: '4px 0 0' }}>
            Configurez la composition de chaque lot de matériel
          </p>
        </div>
        <button className="adm-btn-primary" onClick={openCreate}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouveau lot
        </button>
      </div>

      {loading ? (
        <div className="adm-empty">Chargement…</div>
      ) : (
        <div className="lot-grid">
          {lots.map((lot, i) => (
            <LotCard key={lot.id} lot={lot} delay={i * 60} onClick={() => navigate(`/admin/lots/${lot.id}`)} />
          ))}
          <div className="lot-add-card" onClick={openCreate}>
            <div className="lot-add-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', margin: 0 }}>
              Créer un nouveau lot
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, textAlign: 'center' }}>
              Définissez la composition sacs, pochettes et consommables
            </p>
          </div>
        </div>
      )}

      {/* Modal — Créer */}
      {createOpen && (
        <div className="adm-modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Nouveau lot</h2>
              <button className="adm-modal-close" onClick={() => setCreateOpen(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form id="create-lot-form" onSubmit={handleCreate} className="adm-modal-body">
              <LotFormFields form={createForm} setForm={setCreateForm} />
              {createError && (
                <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                  {createError}
                </p>
              )}
            </form>
            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-secondary" onClick={() => setCreateOpen(false)}>Annuler</button>
              <button type="submit" form="create-lot-form" className="adm-btn-primary" disabled={creating}>
                {creating ? 'Création…' : 'Créer le lot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Éditer */}
      {editLot && (
        <div className="adm-modal-overlay" onClick={() => setEditLot(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Modifier le lot</h2>
              <button className="adm-modal-close" onClick={() => setEditLot(null)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form id="edit-lot-form" onSubmit={handleUpdate} className="adm-modal-body">
              <LotFormFields form={editForm} setForm={setEditForm} />
              {editError && (
                <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                  {editError}
                </p>
              )}
            </form>
            <div className="adm-modal-footer adm-modal-footer-split">
              <button type="button" className="adm-btn-secondary adm-btn-danger" onClick={() => setConfirmDelete(true)}>
                <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" className="adm-btn-secondary" onClick={() => setEditLot(null)}>Annuler</button>
                <button type="submit" form="edit-lot-form" className="adm-btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && editLot && (
        <ConfirmModal
          title={`Supprimer « ${editLot.name} » ?`}
          message="Ce lot et tous ses sacs seront supprimés définitivement."
          icon="🗑️"
          variant="danger"
          confirmLabel="Supprimer définitivement"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  )
}
