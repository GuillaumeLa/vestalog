import { useState, useEffect } from "react";
import { useApi } from "../hooks/useApi";
import ConfirmModal from "../components/ConfirmModal";
import AdminLayout from "../components/AdminLayout";
import "./admin.shared.css";

const emptyForm = {
  name: "",
  internalId: "",
  hasExpiry: false,
  hasLotNumber: false,
};

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="adm-toast">{msg}</div>;
}

export default function AdminConsumables() {
  const apiFetch = useApi();

  const [consumables, setConsumables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    apiFetch("/api/consumables")
      .then((r) => (r.ok ? r.json() : []))
      .then(setConsumables)
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      setCreateOpen(false);
      setEditItem(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = consumables.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.internalId.toLowerCase().includes(search.toLowerCase()),
  );

  async function handleCreate(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const res = await apiFetch("/api/consumables", {
        method: "POST",
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        const created = await res.json();
        setConsumables((prev) => [...prev, created]);
        setCreateOpen(false);
        setCreateForm(emptyForm);
        setToast("Consommable enregistré ✓");
      } else {
        const body = await res.json().catch(() => ({}));
        setCreateError(body.message || "Une erreur est survenue.");
      }
    } catch {
      setCreateError("Impossible de contacter le serveur.");
    } finally {
      setCreating(false);
    }
  }

  function openEdit(c) {
    setEditItem(c);
    setEditError("");
    setEditForm({
      name: c.name,
      internalId: c.internalId,
      hasExpiry: c.hasExpiry,
      hasLotNumber: c.hasLotNumber,
    });
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setEditError("");
    try {
      const res = await apiFetch(`/api/consumables/${editItem.id}`, {
        method: "PUT",
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        const updated = await res.json();
        setConsumables((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c)),
        );
        setEditItem(null);
        setToast("Modifications enregistrées ✓");
      } else {
        const body = await res.json().catch(() => ({}));
        setEditError(body.message || "Une erreur est survenue.");
      }
    } catch {
      setEditError("Impossible de contacter le serveur.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setConfirmDelete(false);
    const res = await apiFetch(`/api/consumables/${editItem.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setConsumables((prev) => prev.filter((c) => c.id !== editItem.id));
      setEditItem(null);
      setToast("Consommable supprimé");
    } else {
      setEditError("Impossible de supprimer ce consommable.");
    }
  }

  return (
    <AdminLayout currentPage="consumables">
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-pri)", margin: 0 }}>
            Consommables
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-sec)", margin: "4px 0 0" }}>
            Définir les articles gérés dans les lots et sacs
          </p>
        </div>
        <button
          className="adm-btn-primary"
          onClick={() => { setCreateForm(emptyForm); setCreateOpen(true); }}
        >
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouveau consommable
        </button>
      </div>

      {/* Table */}
      <div className="adm-section-header">
        <p className="adm-section-title">Articles enregistrés</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div className="adm-search-wrap">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              className="adm-search"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="adm-count-badge">
            {filtered.length} article{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="adm-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="adm-empty">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">
            {consumables.length === 0 ? "Aucun consommable enregistré." : "Aucun résultat."}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>ID interne</th>
                  <th>Nom</th>
                  <th className="center">Péremption</th>
                  <th className="center">N° de lot</th>
                  <th style={{ width: 56 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span className="adm-mono" style={{ fontSize: 12, fontWeight: 500, color: "var(--text-sec)" }}>
                        {c.internalId}
                      </span>
                    </td>
                    <td style={{ fontSize: 14, fontWeight: 600, color: "var(--text-pri)" }}>
                      {c.name}
                    </td>
                    <td className="center">
                      <span className={c.hasExpiry ? "b-yes" : "b-no"}>
                        {c.hasExpiry ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="center">
                      <span className={c.hasLotNumber ? "b-yes" : "b-no"}>
                        {c.hasLotNumber ? "Oui" : "Non"}
                      </span>
                    </td>
                    <td className="right">
                      <button
                        className="adm-btn-secondary"
                        onClick={() => openEdit(c)}
                        style={{ padding: "6px 10px", fontSize: 12, gap: 4 }}
                      >
                        <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal — Create */}
      {createOpen && (
        <div className="adm-modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Nouveau consommable</h2>
              <button className="adm-modal-close" onClick={() => setCreateOpen(false)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form id="create-consumable-form" onSubmit={handleCreate} className="adm-modal-body">
              <div>
                <label className="adm-label">Nom de l'article</label>
                <input
                  required
                  className="adm-input"
                  placeholder="Ex : Bande hémostatique CAT"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="adm-label">ID interne <span style={{ fontWeight: 400, color: 'var(--text-sec)' }}>(laisser vide pour génération automatique)</span></label>
                <input
                  className="adm-input mono"
                  placeholder="CONS-000"
                  value={createForm.internalId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, internalId: e.target.value }))}
                />
              </div>
              <div className="adm-toggle">
                <div>
                  <div className="adm-toggle-label">A une date de péremption</div>
                  <div className="adm-toggle-sub">Suivi de l'expiration requis</div>
                </div>
                <label className="tgl">
                  <input type="checkbox" checked={createForm.hasExpiry} onChange={(e) => setCreateForm((f) => ({ ...f, hasExpiry: e.target.checked }))} />
                  <div className="tslider" />
                </label>
              </div>
              <div className="adm-toggle">
                <div>
                  <div className="adm-toggle-label">A un numéro de lot</div>
                  <div className="adm-toggle-sub">Traçabilité par numéro de lot</div>
                </div>
                <label className="tgl">
                  <input type="checkbox" checked={createForm.hasLotNumber} onChange={(e) => setCreateForm((f) => ({ ...f, hasLotNumber: e.target.checked }))} />
                  <div className="tslider" />
                </label>
              </div>
              {createError && (
                <p style={{ fontSize: 13, color: "#B91C1C", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8, margin: 0 }}>
                  {createError}
                </p>
              )}
            </form>
            <div className="adm-modal-footer">
              <button type="button" className="adm-btn-secondary" onClick={() => setCreateOpen(false)}>Annuler</button>
              <button type="submit" form="create-consumable-form" className="adm-btn-primary" disabled={creating}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {creating ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — Edit */}
      {editItem && (
        <div className="adm-modal-overlay" onClick={() => setEditItem(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-header">
              <h2>Modifier le consommable</h2>
              <button className="adm-modal-close" onClick={() => setEditItem(null)}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form id="edit-consumable-form" onSubmit={handleUpdate} className="adm-modal-body">
              <div>
                <label className="adm-label">Nom</label>
                <input required className="adm-input" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="adm-label">ID interne</label>
                <input className="adm-input mono" value={editForm.internalId} onChange={(e) => setEditForm((f) => ({ ...f, internalId: e.target.value }))} />
              </div>
              <div className="adm-toggle">
                <div className="adm-toggle-label">Péremption</div>
                <label className="tgl">
                  <input type="checkbox" checked={editForm.hasExpiry} onChange={(e) => setEditForm((f) => ({ ...f, hasExpiry: e.target.checked }))} />
                  <div className="tslider" />
                </label>
              </div>
              <div className="adm-toggle">
                <div className="adm-toggle-label">Numéro de lot</div>
                <label className="tgl">
                  <input type="checkbox" checked={editForm.hasLotNumber} onChange={(e) => setEditForm((f) => ({ ...f, hasLotNumber: e.target.checked }))} />
                  <div className="tslider" />
                </label>
              </div>
              {editError && (
                <p style={{ fontSize: 13, color: "#B91C1C", background: "#FEF2F2", padding: "8px 12px", borderRadius: 8, margin: 0 }}>
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
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" className="adm-btn-secondary" onClick={() => setEditItem(null)}>Annuler</button>
                <button type="submit" form="edit-consumable-form" className="adm-btn-primary" disabled={saving}>
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && editItem && (
        <ConfirmModal
          title={`Supprimer « ${editItem.name} » ?`}
          message="Cette action est irréversible. Le consommable sera retiré de tous les lots associés."
          icon="🗑️"
          variant="danger"
          confirmLabel="Supprimer définitivement"
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}
