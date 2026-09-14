import { useEffect, useRef } from 'react'
import './ConfirmModal.css'

const VARIANT_STYLES = {
  danger: {
    iconBg: 'rgba(239,68,68,.12)',
    iconColor: '#f87171',
    btnBg: '#DC2626',
    btnHover: '#B91C1C',
  },
  success: {
    iconBg: 'rgba(16,185,129,.12)',
    iconColor: '#34d399',
    btnBg: '#059669',
    btnHover: '#047857',
  },
  warning: {
    iconBg: 'rgba(245,158,11,.12)',
    iconColor: '#fbbf24',
    btnBg: '#D97706',
    btnHover: '#B45309',
  },
  info: {
    iconBg: 'rgba(59,130,246,.12)',
    iconColor: '#60a5fa',
    btnBg: '#2563EB',
    btnHover: '#1D4ED8',
  },
}

export default function ConfirmModal({
  title,
  message,
  icon,
  variant = 'danger',
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm,
  onCancel,
}) {
  const s = VARIANT_STYLES[variant] ?? VARIANT_STYLES.danger
  const modalRef = useRef(null)

  useEffect(() => {
    const el = modalRef.current
    if (!el) return

    // Move focus to confirm button on open
    const confirmBtn = el.querySelector('.cm-btn-confirm')
    confirmBtn?.focus()

    // Focus trap
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const trap = (e) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    el.addEventListener('keydown', trap)
    return () => el.removeEventListener('keydown', trap)
  }, [])

  return (
    <div className="cm-overlay" onClick={onCancel} role="presentation">
      <div
        className="cm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cm-title-text"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        {icon && (
          <div className="cm-icon-wrap" style={{ background: s.iconBg }}>
            {typeof icon === 'string' ? (
              <span style={{ fontSize: 22, lineHeight: 1 }}>{icon}</span>
            ) : (
              <span style={{ color: s.iconColor, display: 'flex' }}>{icon}</span>
            )}
          </div>
        )}

        {/* Text */}
        <div className="cm-body">
          {title && <p className="cm-title" id="cm-title-text">{title}</p>}
          {message && <p className="cm-message">{message}</p>}
        </div>

        {/* Actions */}
        <div className="cm-footer">
          <button className="cm-btn-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className="cm-btn-confirm"
            style={{ '--btn-bg': s.btnBg, '--btn-hover': s.btnHover }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
