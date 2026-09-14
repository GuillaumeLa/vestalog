import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import AdminLayout from '../components/AdminLayout'
import ConfirmModal from '../components/ConfirmModal'
import './admin.shared.css'
import './AdminLotDetail.css'

const ACCENT_COLORS = ['#D9251D', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#0EA5E9']

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="adm-toast">{msg}</div>
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
            width: 28, height: 28, borderRadius: 7,
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

function ItemRow({ item, onDelete, onUpdate }) {
  const [qty, setQty] = useState(item.quantity)

  useEffect(() => { setQty(item.quantity) }, [item.quantity])

  function handleBlur() {
    if (qty !== item.quantity && qty > 0) onUpdate(item.id, qty)
  }

  return (
    <div className="ld-item-row">
      <span className="ld-item-id">{item.consumable.internalId}</span>
      <span className="ld-item-name">{item.consumable.name}</span>
      <input
        type="number"
        min="1"
        value={qty}
        onChange={e => setQty(parseInt(e.target.value, 10) || 1)}
        onBlur={handleBlur}
        className="ld-item-qty"
      />
      <button
        type="button"
        className="ld-item-del"
        onClick={() => onDelete(item.id)}
        title="Supprimer"
      >
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function AdminLotDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const apiFetch = useApi()

  const [lot, setLot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [collapsedSacs, setCollapsedSacs] = useState(new Set())
  const [collapsedPochettes, setCollapsedPochettes] = useState(new Set())

  // Edit lot modal
  const [editLotOpen, setEditLotOpen] = useState(false)
  const [editLotForm, setEditLotForm] = useState({ name: '', description: '', internalId: '', color: '#D9251D', active: true })
  const [editLotSaving, setEditLotSaving] = useState(false)
  const [editLotError, setEditLotError] = useState('')

  // Add sac modal
  const [sacModal, setSacModal] = useState(false)
  const [sacForm, setSacForm] = useState({ label: '', color: '#3B82F6' })
  const [sacAdding, setSacAdding] = useState(false)
  const [sacError, setSacError] = useState('')

  // Add pochette modal (stores sacId)
  const [pochetteModal, setPochetteModal] = useState(null)
  const [pochetteForm, setPochetteForm] = useState({ name: '', emoji: '📦' })
  const [pochetteAdding, setPochetteAdding] = useState(false)
  const [pochetteError, setPochetteError] = useState('')

  // Add item modal
  const [itemModal, setItemModal] = useState(null) // { type: 'pochette'|'direct', targetId }
  const [itemSearch, setItemSearch] = useState('')
  const [itemResults, setItemResults] = useState([])
  const [itemSearching, setItemSearching] = useState(false)
  const [itemSelected, setItemSelected] = useState(null)
  const [itemQty, setItemQty] = useState(1)
  const [itemAdding, setItemAdding] = useState(false)
  const [itemError, setItemError] = useState('')

  // Confirm delete sac
  const [confirmDeleteSac, setConfirmDeleteSac] = useState(null)
  const [confirmDeletePochette, setConfirmDeletePochette] = useState(null)

  useEffect(() => {
    apiFetch(`/api/lots/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(lotData => {
        setLot(lotData)
        if (lotData) {
          setCollapsedSacs(new Set(lotData.sacs.map(s => s.id)))
          setEditLotForm({
            name: lotData.name,
            description: lotData.description ?? '',
            internalId: lotData.internalId,
            color: lotData.color,
            active: lotData.active,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [apiFetch])

  // Debounced server-side search — runs only when the item modal is open
  useEffect(() => {
    if (!itemModal) { setItemResults([]); return }
    const t = setTimeout(async () => {
      setItemSearching(true)
      try {
        const url = itemSearch.trim()
          ? `/api/consumables?q=${encodeURIComponent(itemSearch.trim())}`
          : '/api/consumables'
        const res = await apiFetch(url)
        if (res.ok) setItemResults(await res.json())
      } finally {
        setItemSearching(false)
      }
    }, 250)
    return () => clearTimeout(t)
  }, [itemSearch, itemModal, apiFetch])

  useEffect(() => {
    const onKey = e => {
      if (e.key !== 'Escape') return
      setEditLotOpen(false)
      setSacModal(false)
      setPochetteModal(null)
      setItemModal(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // Immutable helpers
  function updateSac(sacId, fn) {
    setLot(prev => ({ ...prev, sacs: prev.sacs.map(s => s.id === sacId ? fn(s) : s) }))
  }

  function updatePochette(sacId, pochetteId, fn) {
    updateSac(sacId, sac => ({
      ...sac,
      pochettes: sac.pochettes.map(p => p.id === pochetteId ? fn(p) : p),
    }))
  }

  // Lot metadata
  async function handleEditLot(e) {
    e.preventDefault()
    setEditLotSaving(true)
    setEditLotError('')
    try {
      const res = await apiFetch(`/api/lots/${id}`, { method: 'PUT', body: JSON.stringify(editLotForm) })
      if (res.ok) {
        const updated = await res.json()
        setLot(prev => ({ ...prev, ...updated }))
        setEditLotOpen(false)
        setToast('Lot mis à jour ✓')
      } else {
        const body = await res.json().catch(() => ({}))
        setEditLotError(body.message || 'Erreur lors de la mise à jour.')
      }
    } catch { setEditLotError('Impossible de contacter le serveur.') }
    finally { setEditLotSaving(false) }
  }

  // Sac
  function openAddSac() {
    setSacForm({ label: '', color: '#3B82F6' })
    setSacError('')
    setSacModal(true)
  }

  async function handleAddSac(e) {
    e.preventDefault()
    setSacAdding(true)
    setSacError('')
    try {
      const res = await apiFetch(`/api/lots/${id}/sacs`, { method: 'POST', body: JSON.stringify(sacForm) })
      if (res.ok) {
        const sac = await res.json()
        setLot(prev => ({ ...prev, sacs: [...prev.sacs, sac] }))
        setCollapsedSacs(prev => new Set([...prev, sac.id]))
        setSacModal(false)
        setToast(`Sac « ${sac.label} » ajouté ✓`)
      } else {
        const body = await res.json().catch(() => ({}))
        setSacError(body.message || 'Erreur lors de la création.')
      }
    } catch { setSacError('Impossible de contacter le serveur.') }
    finally { setSacAdding(false) }
  }

  async function handleDeleteSac() {
    const sacId = confirmDeleteSac
    setConfirmDeleteSac(null)
    try {
      const res = await apiFetch(`/api/sacs/${sacId}`, { method: 'DELETE' })
      if (res.ok) {
        setLot(prev => ({ ...prev, sacs: prev.sacs.filter(s => s.id !== sacId) }))
        setToast('Sac supprimé')
      } else {
        setToast('Erreur lors de la suppression du sac')
      }
    } catch {
      setToast('Erreur réseau lors de la suppression du sac')
    }
  }

  // Pochette
  function openAddPochette(sacId) {
    setPochetteForm({ name: '', emoji: '📦' })
    setPochetteError('')
    setPochetteModal(sacId)
  }

  async function handleAddPochette(e) {
    e.preventDefault()
    setPochetteAdding(true)
    setPochetteError('')
    try {
      const res = await apiFetch(`/api/sacs/${pochetteModal}/pochettes`, { method: 'POST', body: JSON.stringify(pochetteForm) })
      if (res.ok) {
        const pochette = await res.json()
        updateSac(pochetteModal, sac => ({ ...sac, pochettes: [...sac.pochettes, pochette] }))
        setPochetteModal(null)
        setToast(`Pochette « ${pochette.name} » ajoutée ✓`)
      } else {
        const body = await res.json().catch(() => ({}))
        setPochetteError(body.message || 'Erreur lors de la création.')
      }
    } catch { setPochetteError('Impossible de contacter le serveur.') }
    finally { setPochetteAdding(false) }
  }

  async function handleDeletePochette() {
    const { sacId, pochetteId } = confirmDeletePochette
    setConfirmDeletePochette(null)
    try {
      const res = await apiFetch(`/api/pochettes/${pochetteId}`, { method: 'DELETE' })
      if (res.ok) {
        updateSac(sacId, sac => ({ ...sac, pochettes: sac.pochettes.filter(p => p.id !== pochetteId) }))
        setToast('Pochette supprimée')
      } else {
        setToast('Erreur lors de la suppression de la pochette')
      }
    } catch {
      setToast('Erreur réseau lors de la suppression de la pochette')
    }
  }

  // Items
  function openAddItem(type, targetId) {
    setItemSearch('')
    setItemSelected(null)
    setItemQty(1)
    setItemError('')
    setItemModal({ type, targetId })
  }

  async function handleAddItem(e) {
    e.preventDefault()
    if (!itemSelected) { setItemError('Sélectionnez un consommable.'); return }
    setItemAdding(true)
    setItemError('')
    const { type, targetId } = itemModal
    const url = type === 'pochette'
      ? `/api/pochettes/${targetId}/items`
      : `/api/sacs/${targetId}/items/direct`
    try {
      const res = await apiFetch(url, { method: 'POST', body: JSON.stringify({ consumableId: itemSelected, quantity: itemQty }) })
      if (res.ok) {
        const item = await res.json()
        if (type === 'pochette') {
          const sacId = lot.sacs.find(s => s.pochettes.some(p => p.id === targetId))?.id
          updatePochette(sacId, targetId, p => ({ ...p, items: [...p.items, item] }))
        } else {
          updateSac(targetId, sac => ({ ...sac, directItems: [...sac.directItems, item] }))
        }
        setItemModal(null)
        setToast('Article ajouté ✓')
      } else {
        const body = await res.json().catch(() => ({}))
        setItemError(body.message || 'Erreur lors de l\'ajout.')
      }
    } catch { setItemError('Impossible de contacter le serveur.') }
    finally { setItemAdding(false) }
  }

  async function handleDeleteItem(itemId) {
    try {
      const res = await apiFetch(`/api/items/${itemId}`, { method: 'DELETE' })
      if (!res.ok) { setToast('Erreur lors de la suppression'); return }
      setLot(prev => ({
        ...prev,
        sacs: prev.sacs.map(s => ({
          ...s,
          directItems: s.directItems.filter(i => i.id !== itemId),
          pochettes: s.pochettes.map(p => ({
            ...p,
            items: p.items.filter(i => i.id !== itemId),
          })),
        })),
      }))
    } catch {
      setToast('Erreur réseau lors de la suppression de l\'article')
    }
  }

  async function handleUpdateItemQty(itemId, qty) {
    const res = await apiFetch(`/api/items/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity: qty }) })
    if (!res.ok) { setToast('Erreur lors de la mise à jour de la quantité'); return }
    setLot(prev => ({
      ...prev,
      sacs: prev.sacs.map(s => ({
        ...s,
        directItems: s.directItems.map(i => i.id === itemId ? { ...i, quantity: qty } : i),
        pochettes: s.pochettes.map(p => ({
          ...p,
          items: p.items.map(i => i.id === itemId ? { ...i, quantity: qty } : i),
        })),
      })),
    }))
  }

  // Computed
  const totalArticles = lot ? lot.sacs.reduce((acc, s) =>
    acc + s.directItems.length + s.pochettes.reduce((a, p) => a + p.items.length, 0), 0) : 0

  // Render
  if (loading) {
    return (
      <AdminLayout currentPage="lots" wide>
        <div className="adm-empty">Chargement…</div>
      </AdminLayout>
    )
  }

  if (!lot) {
    return (
      <AdminLayout currentPage="lots" wide>
        <div className="adm-empty">Lot introuvable.</div>
      </AdminLayout>
    )
  }

  function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r},${g},${b},${a})`
  }

  return (
    <AdminLayout currentPage="lots" wide>
      {/* Page header */}
      <div className="ld-page-header">
        <button className="ld-back-btn" onClick={() => navigate('/admin/lots')}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Lots &amp; Sacs
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="lot-internal-id"
              style={{ background: hexAlpha(lot.color, 0.12), color: lot.color }}
            >
              {lot.internalId}
            </span>
            <h1 className="ld-lot-title">{lot.name}</h1>
            <span className={`lot-status ${lot.active ? 'lot-status-active' : 'lot-status-inactive'}`}>
              {lot.active ? 'Actif' : 'Inactif'}
            </span>
          </div>
          {lot.description && <p className="ld-lot-desc">{lot.description}</p>}
          <p className="ld-lot-meta">
            {lot.sacs.length} sac{lot.sacs.length !== 1 ? 's' : ''}
            {' · '}
            {totalArticles} article{totalArticles !== 1 ? 's' : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="adm-btn-secondary" onClick={() => { setEditLotForm({ name: lot.name, description: lot.description ?? '', internalId: lot.internalId, color: lot.color, active: lot.active }); setEditLotError(''); setEditLotOpen(true) }}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Éditer
          </button>
          <button className="adm-btn-primary" onClick={openAddSac}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un sac
          </button>
        </div>
      </div>

      {/* Sac grid */}
      <div className="ld-sac-grid">
        {lot.sacs.map(sac => {
          const isCollapsed = collapsedSacs.has(sac.id)
          return (
            <div key={sac.id} className="ld-sac-card">
              {/* Sac header */}
              <div className="ld-sac-header" style={{ background: sac.color }}>
                <div className="ld-sac-label">{sac.label}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="ld-sac-title">Sac {sac.label}</span>
                  <span className="ld-sac-count">
                    {sac.pochettes.length} pochette{sac.pochettes.length !== 1 ? 's' : ''}
                    {sac.directItems.length > 0 && ` · ${sac.directItems.length} direct${sac.directItems.length !== 1 ? 's' : ''}`}
                    {' · '}
                    {sac.directItems.length + sac.pochettes.reduce((a, p) => a + p.items.length, 0)} art.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="ld-sac-icon-btn"
                    onClick={() => setCollapsedSacs(prev => {
                      const next = new Set(prev)
                      next.has(sac.id) ? next.delete(sac.id) : next.add(sac.id)
                      return next
                    })}
                    title={isCollapsed ? 'Développer' : 'Réduire'}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                      style={{ transform: isCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    className="ld-sac-icon-btn"
                    onClick={() => setConfirmDeleteSac(sac.id)}
                    title="Supprimer le sac"
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Sac body */}
              {!isCollapsed && (
                <div className="ld-sac-body">
                  {/* Pochettes */}
                  {sac.pochettes.map(pochette => {
                    const isPochetteCollapsed = collapsedPochettes.has(pochette.id)
                    return (
                      <div key={pochette.id} className="ld-pochette-block">
                        <div className="ld-pochette-header">
                          <span className="ld-pochette-emoji">{pochette.emoji}</span>
                          <span className="ld-pochette-name">{pochette.name}</span>
                          <span className="ld-pochette-count">{pochette.items.length} art.</span>
                          <button
                            className="ld-icon-btn"
                            onClick={() => setCollapsedPochettes(prev => {
                              const next = new Set(prev)
                              next.has(pochette.id) ? next.delete(pochette.id) : next.add(pochette.id)
                              return next
                            })}
                            title={isPochetteCollapsed ? 'Développer' : 'Réduire'}
                          >
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                              style={{ transform: isPochetteCollapsed ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            className="ld-icon-btn ld-icon-btn-danger"
                            onClick={() => setConfirmDeletePochette({ sacId: sac.id, pochetteId: pochette.id })}
                            title="Supprimer la pochette"
                          >
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>

                        {!isPochetteCollapsed && (
                          <div className="ld-items-list">
                            {pochette.items.map(item => (
                              <ItemRow
                                key={item.id}
                                item={item}
                                onDelete={handleDeleteItem}
                                onUpdate={handleUpdateItemQty}
                              />
                            ))}
                            <button
                              type="button"
                              className="ld-add-item-btn"
                              onClick={() => openAddItem('pochette', pochette.id)}
                            >
                              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                              Ajouter un consommable
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Direct items */}
                  {(sac.directItems.length > 0 || sac.pochettes.length === 0) && (
                    <div className="ld-direct-block">
                      <div className="ld-direct-header">
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="ld-pochette-name">Consommables directs</span>
                        <span className="ld-pochette-count">{sac.directItems.length} art.</span>
                      </div>
                      <div className="ld-items-list">
                        {sac.directItems.map(item => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            onDelete={handleDeleteItem}
                            onUpdate={handleUpdateItemQty}
                          />
                        ))}
                        <button
                          type="button"
                          className="ld-add-item-btn"
                          onClick={() => openAddItem('direct', sac.id)}
                        >
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Ajouter un consommable
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Sac footer */}
                  <div className="ld-sac-footer">
                    <button
                      type="button"
                      className="ld-footer-btn"
                      onClick={() => openAddPochette(sac.id)}
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      + Pochette
                    </button>
                    <button
                      type="button"
                      className="ld-footer-btn ld-footer-btn-direct"
                      onClick={() => openAddItem('direct', sac.id)}
                    >
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      + Direct
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Add sac card */}
        <div className="ld-add-sac-card" onClick={openAddSac}>
          <div className="lot-add-icon">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-sec)', margin: 0 }}>Ajouter un sac</p>
        </div>
      </div>

      {/* Modal — Éditer le lot */}
      {editLotOpen && (
        <div className="adm-modal-overlay" onClick={() => setEditLotOpen(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Modifier le lot</h2>
              <button className="adm-modal-close" onClick={() => setEditLotOpen(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form id="edit-lot-form" onSubmit={handleEditLot} className="adm-modal-body">
              <div>
                <label className="adm-label">Nom du lot</label>
                <input required className="adm-input" value={editLotForm.name}
                  onChange={e => setEditLotForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="adm-label">Description</label>
                <input className="adm-input" value={editLotForm.description}
                  onChange={e => setEditLotForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div>
                <label className="adm-label">ID interne</label>
                <input className="adm-input mono" value={editLotForm.internalId}
                  onChange={e => setEditLotForm(f => ({ ...f, internalId: e.target.value }))} />
              </div>
              <div>
                <label className="adm-label">Couleur d'accent</label>
                <ColorPicker value={editLotForm.color} onChange={c => setEditLotForm(f => ({ ...f, color: c }))} />
              </div>
              <div className="adm-toggle">
                <div>
                  <div className="adm-toggle-label">Lot actif</div>
                </div>
                <label className="tgl">
                  <input type="checkbox" checked={editLotForm.active}
                    onChange={e => setEditLotForm(f => ({ ...f, active: e.target.checked }))} />
                  <div className="tslider" />
                </label>
              </div>
              {editLotError && (
                <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                  {editLotError}
                </p>
              )}
            </form>
            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-secondary" onClick={() => setEditLotOpen(false)}>Annuler</button>
              <button type="submit" form="edit-lot-form" className="adm-btn-primary" disabled={editLotSaving}>
                {editLotSaving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Nouveau sac */}
      {sacModal && (
        <div className="adm-modal-overlay" onClick={() => setSacModal(false)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Nouveau sac</h2>
              <button className="adm-modal-close" onClick={() => setSacModal(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form id="add-sac-form" onSubmit={handleAddSac} className="adm-modal-body">
              <div>
                <label className="adm-label">Label du sac <span style={{ fontWeight: 400, color: 'var(--text-sec)' }}>(ex : A, B1, Alpha)</span></label>
                <input required className="adm-input" placeholder="A" value={sacForm.label}
                  onChange={e => setSacForm(f => ({ ...f, label: e.target.value }))} />
              </div>
              <div>
                <label className="adm-label">Couleur</label>
                <ColorPicker value={sacForm.color} onChange={c => setSacForm(f => ({ ...f, color: c }))} />
              </div>
              {sacError && (
                <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                  {sacError}
                </p>
              )}
            </form>
            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-secondary" onClick={() => setSacModal(false)}>Annuler</button>
              <button type="submit" form="add-sac-form" className="adm-btn-primary" disabled={sacAdding}>
                {sacAdding ? 'Création…' : 'Créer le sac'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Nouvelle pochette */}
      {pochetteModal && (
        <div className="adm-modal-overlay" onClick={() => setPochetteModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Nouvelle pochette</h2>
              <button className="adm-modal-close" onClick={() => setPochetteModal(null)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form id="add-pochette-form" onSubmit={handleAddPochette} className="adm-modal-body">
              <div>
                <label className="adm-label">Nom de la pochette</label>
                <input required className="adm-input" placeholder="Ex : Pochette Trauma" value={pochetteForm.name}
                  onChange={e => setPochetteForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="adm-label">Emoji</label>
                <input className="adm-input" placeholder="📦" value={pochetteForm.emoji}
                  onChange={e => setPochetteForm(f => ({ ...f, emoji: e.target.value }))} />
              </div>
              {pochetteError && (
                <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                  {pochetteError}
                </p>
              )}
            </form>
            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-secondary" onClick={() => setPochetteModal(null)}>Annuler</button>
              <button type="submit" form="add-pochette-form" className="adm-btn-primary" disabled={pochetteAdding}>
                {pochetteAdding ? 'Création…' : 'Créer la pochette'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Ajouter un consommable */}
      {itemModal && (
        <div className="adm-modal-overlay" onClick={() => setItemModal(null)}>
          <div className="adm-modal" onClick={e => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Ajouter un consommable</h2>
              <button className="adm-modal-close" onClick={() => setItemModal(null)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form id="item-form" onSubmit={handleAddItem} className="adm-modal-body">
              <div>
                <label className="adm-label">Rechercher</label>
                <div className="adm-search-wrap">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    className="adm-search"
                    placeholder="Nom ou ID…"
                    style={{ width: '100%', paddingLeft: 30 }}
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="ld-cons-list">
                {itemSearching
                  ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Recherche…</p>
                  : itemResults.length === 0
                    ? <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        {itemSearch.trim() ? 'Aucun résultat' : 'Saisissez un nom ou un ID'}
                      </p>
                    : itemResults.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`ld-cons-row${itemSelected === c.id ? ' selected' : ''}`}
                        onClick={() => setItemSelected(c.id)}
                      >
                        <span className="ld-item-id">{c.internalId}</span>
                        <span className="ld-cons-name">{c.name}</span>
                        {itemSelected === c.id && (
                          <svg style={{ width: 16, height: 16, color: 'var(--accent)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    ))
                }
              </div>
              <div>
                <label className="adm-label">Quantité</label>
                <input
                  type="number"
                  min="1"
                  className="adm-input"
                  value={itemQty}
                  onChange={e => setItemQty(parseInt(e.target.value, 10) || 1)}
                  style={{ width: 100 }}
                />
              </div>
              {itemError && (
                <p style={{ fontSize: 13, color: '#B91C1C', background: '#FEF2F2', padding: '8px 12px', borderRadius: 8, margin: 0 }}>
                  {itemError}
                </p>
              )}
            </form>
            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-secondary" onClick={() => setItemModal(null)}>Annuler</button>
              <button type="submit" form="item-form" className="adm-btn-primary" disabled={itemAdding || !itemSelected}>
                {itemAdding ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteSac && (
        <ConfirmModal
          title="Supprimer ce sac ?"
          message="Le sac, ses pochettes et tous ses articles seront supprimés définitivement."
          icon="🗑️"
          variant="danger"
          confirmLabel="Supprimer définitivement"
          onConfirm={handleDeleteSac}
          onCancel={() => setConfirmDeleteSac(null)}
        />
      )}

      {confirmDeletePochette && (
        <ConfirmModal
          title="Supprimer cette pochette ?"
          message="La pochette et tous ses articles seront supprimés définitivement."
          icon="🗑️"
          variant="danger"
          confirmLabel="Supprimer définitivement"
          onConfirm={handleDeletePochette}
          onCancel={() => setConfirmDeletePochette(null)}
        />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  )
}
