import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import AppNav from '../components/AppNav'
import ConfirmModal from '../components/ConfirmModal'
import './InventoryCheck.css'

const POLL_INTERVAL = 4000

export default function InventoryCheck() {
  const { id: missionId } = useParams()
  const navigate = useNavigate()
  const apiFetch = useApi()

  const [check, setCheck] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentLot, setCurrentLot] = useState(0)
  const [toggling, setToggling] = useState(new Set())
  const [completing, setCompleting] = useState(false)
  const [confirmComplete, setConfirmComplete] = useState(false)

  const checkIdRef = useRef(null)
  const pollRef = useRef(null)
  const inFlightRef = useRef(0) // nombre de toggles en cours — la poll ne doit pas écraser pendant ce temps

  const fetchState = useCallback(async (checkId) => {
    if (inFlightRef.current > 0) return // ne pas écraser un état optimiste pendant un toggle en cours
    const res = await apiFetch(`/api/inv-checks/${checkId}`)
    if (res.ok) {
      const data = await res.json()
      setCheck(data)
    }
  }, [apiFetch])

  useEffect(() => {
    let mounted = true

    apiFetch(`/api/inv-checks/mission/${missionId}`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error('Impossible de démarrer la vérification')
        return res.json()
      })
      .then(data => {
        if (!mounted) return
        setCheck(data)
        checkIdRef.current = data.id
        setLoading(false)

        // Start polling for collaborative updates
        pollRef.current = setInterval(() => {
          if (checkIdRef.current) fetchState(checkIdRef.current)
        }, POLL_INTERVAL)
      })
      .catch(err => {
        if (!mounted) return
        setError(err.message || 'Erreur inattendue')
        setLoading(false)
      })

    return () => {
      mounted = false
      clearInterval(pollRef.current)
    }
  }, [missionId, apiFetch, fetchState])

  async function handleToggle(itemId) {
    if (toggling.has(itemId) || check?.status === 'COMPLETED') return

    setToggling(prev => new Set(prev).add(itemId))
    inFlightRef.current++

    // Optimistic toggle
    setCheck(prev => prev ? applyToggle(prev, itemId) : prev)

    try {
      const res = await apiFetch(`/api/inv-checks/${checkIdRef.current}/items/${itemId}`, {
        method: 'PATCH',
      })
      if (res.ok) {
        const updated = await res.json()
        setCheck(updated)
      }
    } finally {
      inFlightRef.current--
      setToggling(prev => {
        const next = new Set(prev)
        next.delete(itemId)
        return next
      })
    }
  }

  async function handleComplete() {
    setConfirmComplete(false)
    setCompleting(true)
    try {
      const res = await apiFetch(`/api/inv-checks/${checkIdRef.current}/complete`, { method: 'POST' })
      if (res.ok) {
        const updated = await res.json()
        setCheck(updated)
        clearInterval(pollRef.current)
      }
    } finally {
      setCompleting(false)
    }
  }

  if (loading) {
    return (
      <div className="ic-page">
        <AppNav />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="ic-spinner" />
        </div>
      </div>
    )
  }

  if (error || !check) {
    return (
      <div className="ic-page">
        <AppNav />
        <main className="ic-main">
          <button className="md-back-btn" onClick={() => navigate(`/missions/${missionId}`)}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour à la mission
          </button>
          <div className="ic-empty" style={{ marginTop: 16 }}>{error || 'Erreur inattendue'}</div>
        </main>
      </div>
    )
  }

  const lots = check.lots ?? []
  const isDone = check.status === 'COMPLETED'
  const pct = check.totalItems > 0 ? Math.round((check.checkedItems / check.totalItems) * 100) : 0
  const isLastLot = currentLot === lots.length - 1
  const lot = lots[currentLot]

  return (
    <div className="ic-page">
      <AppNav />

      <main className="ic-main">
        {/* Back */}
        <button className="md-back-btn" onClick={() => navigate(`/missions/${missionId}`)}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Retour à la mission
        </button>

        {/* Header */}
        <div className="ic-header" style={{ marginTop: 12 }}>
          <div className="ic-header-left">
            <h1 className="ic-mission-name">{check.missionName}</h1>
            <p className="ic-sub">Vérification du matériel</p>
          </div>
        </div>

        {/* Completed banner */}
        {isDone && (
          <div className="ic-done-banner">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: 20, height: 20, flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Vérification finalisée — {check.checkedItems}/{check.totalItems} items cochés
          </div>
        )}

        {/* Progress */}
        {check.totalItems > 0 && (
          <div className="ic-progress-wrap">
            <div className="ic-progress-row">
              <span className="ic-progress-label">Progression globale</span>
              <span className="ic-progress-count">{check.checkedItems} / {check.totalItems} items</span>
            </div>
            <div className="ic-progress-bar">
              <div
                className={`ic-progress-fill${pct === 100 ? ' ic-progress-fill--done' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* No lots configured */}
        {lots.length === 0 && (
          <div className="ic-empty">
            Aucun lot n'est configuré pour ce type de mission.<br />
            Contactez un administrateur pour configurer les types de mission.
          </div>
        )}

        {/* Wizard */}
        {lots.length > 0 && (
          <>
            {/* Lot tabs */}
            <div className="ic-lot-tabs">
              {lots.map((l, i) => (
                <button
                  key={l.lotId}
                  className={`ic-lot-tab${i === currentLot ? ' active' : ''}`}
                  onClick={() => setCurrentLot(i)}
                >
                  <span className="ic-lot-tab-dot" style={{ background: l.color }} />
                  {l.name}
                  <span className="ic-lot-tab-progress">{l.checkedItems}/{l.totalItems}</span>
                </button>
              ))}
            </div>

            {/* Current lot */}
            <div className="ic-lot-header">
              <div className="ic-lot-color-bar" style={{ background: lot.color }} />
              <h2 className="ic-lot-title">{lot.name}</h2>
              <span className="ic-lot-subtitle">
                {lot.checkedItems}/{lot.totalItems} vérifiés
              </span>
            </div>

            {lot.sacs.map(sac => {
              const sacTotal = sac.directItems.length + sac.pochettes.reduce((n, p) => n + p.items.length, 0)
              const sacChecked = sac.directItems.filter(i => i.checked).length
                + sac.pochettes.reduce((n, p) => n + p.items.filter(i => i.checked).length, 0)

              return (
                <div key={sac.sacId} className="ic-sac">
                  <div className="ic-sac-header">
                    <span className="ic-sac-color" style={{ background: sac.color }} />
                    <span className="ic-sac-label">{sac.label}</span>
                    <span className="ic-sac-progress">{sacChecked}/{sacTotal}</span>
                  </div>

                  {/* Direct items (no pochette) */}
                  {sac.directItems.length > 0 && (
                    <div className="ic-direct-items">
                      {sac.directItems.map(item => (
                        <ItemRow
                          key={item.invCheckItemId}
                          item={item}
                          disabled={isDone || toggling.has(item.invCheckItemId)}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  )}

                  {/* Pochettes */}
                  {sac.pochettes.map(pochette => (
                    <div key={pochette.pochetteId} className="ic-pochette">
                      <div className="ic-pochette-header">
                        <span>{pochette.emoji}</span>
                        {pochette.name}
                      </div>
                      {pochette.items.map(item => (
                        <ItemRow
                          key={item.invCheckItemId}
                          item={item}
                          disabled={isDone || toggling.has(item.invCheckItemId)}
                          onToggle={handleToggle}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Navigation */}
            <div className="ic-nav">
              <div>
                {currentLot > 0 && (
                  <button className="btn-secondary" onClick={() => setCurrentLot(i => i - 1)}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Lot précédent
                  </button>
                )}
              </div>

              <div>
                {!isLastLot ? (
                  <button className="btn-primary" onClick={() => setCurrentLot(i => i + 1)}>
                    Lot suivant
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : !isDone ? (
                  <button
                    className="btn-primary"
                    style={{ background: 'var(--green)', borderColor: 'var(--green)' }}
                    onClick={() => setConfirmComplete(true)}
                    disabled={completing}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {completing ? 'Finalisation…' : 'Finaliser la vérification'}
                  </button>
                ) : (
                  <button className="btn-secondary" onClick={() => navigate(`/missions/${missionId}`)}>
                    Retour à la mission
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {confirmComplete && (
        <ConfirmModal
          title="Finaliser la vérification ?"
          message={
            check.checkedItems < check.totalItems
              ? `Attention : ${check.totalItems - check.checkedItems} item(s) ne sont pas encore cochés. Continuer quand même ?`
              : `Tous les items sont vérifiés. Confirmer la finalisation ?`
          }
          icon="✅"
          variant={check.checkedItems < check.totalItems ? 'warning' : 'success'}
          confirmLabel="Finaliser"
          onConfirm={handleComplete}
          onCancel={() => setConfirmComplete(false)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ItemRow({ item, disabled, onToggle }) {
  return (
    <div className={`ic-item${item.checked ? ' checked' : ''}`}>
      <input
        type="checkbox"
        className="ic-checkbox"
        checked={item.checked}
        disabled={disabled}
        onChange={() => onToggle(item.invCheckItemId)}
      />
      <span className="ic-item-name">{item.consumableName}</span>
      <div className="ic-item-tags">
        {item.hasExpiry && <span className="ic-item-tag">Exp.</span>}
        {item.hasLotNumber && <span className="ic-item-tag">Lot</span>}
      </div>
      <span className="ic-item-qty">×{item.quantity}</span>
      {item.checked && item.checkedByName && (
        <span className="ic-item-checker" title={item.checkedByName}>✓ {item.checkedByName}</span>
      )}
    </div>
  )
}

// Pure function: optimistically toggle an item in check state
function applyToggle(check, itemId) {
  const toggleInList = list =>
    list.map(i => i.invCheckItemId === itemId ? { ...i, checked: !i.checked } : i)

  const countChecked = sacs =>
    sacs.reduce((n, sac) =>
      n + sac.directItems.filter(i => i.checked).length
        + sac.pochettes.reduce((m, p) => m + p.items.filter(i => i.checked).length, 0),
      0
    )

  const newLots = check.lots.map(lot => {
    const newSacs = lot.sacs.map(sac => ({
      ...sac,
      directItems: toggleInList(sac.directItems),
      pochettes: sac.pochettes.map(p => ({ ...p, items: toggleInList(p.items) })),
    }))
    return { ...lot, sacs: newSacs, checkedItems: countChecked(newSacs) }
  })

  return {
    ...check,
    lots: newLots,
    checkedItems: newLots.reduce((n, l) => n + l.checkedItems, 0),
  }
}
