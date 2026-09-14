import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useApi } from "../hooks/useApi";
import ConfirmModal from "../components/ConfirmModal";
import AdminLayout from "../components/AdminLayout";
import "./AdminUsers.css";

function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2800);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className="adm-toast">{msg}</div>;
}

function avatar(u) {
  return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
}

const AVATAR_COLORS = [
  "#3B82F6", "#8B5CF6", "#10B981", "#F59E0B",
  "#D9251D", "#0EA5E9", "#EC4899", "#14B8A6",
];

export default function AdminUsers() {
  const { user } = useAuth();
  const apiFetch = useApi();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    apiFetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : []))
      .then(setUsers)
      .finally(() => setLoading(false));
  }, [apiFetch]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setPendingAction(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = users.filter((u) => {
    const matchFilter =
      filter === "all" ||
      (filter === "admin" && u.role === "ADMIN") ||
      (filter === "member" && u.role === "MEMBER");
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  async function executeRoleChange() {
    if (!pendingAction) return;
    const { userId, newRole } = pendingAction;
    const res = await apiFetch(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setToast(
        newRole === "ADMIN"
          ? `${updated.firstName} ${updated.lastName} est maintenant administrateur`
          : `${updated.firstName} ${updated.lastName} rétrogradé bénévole`
      );
    } else {
      setToast("Erreur lors de la mise à jour du rôle");
    }
    setPendingAction(null);
  }

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const memberCount = users.filter((u) => u.role === "MEMBER").length;

  return (
    <AdminLayout currentPage="users">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-pri)", margin: 0 }}>
            Utilisateurs
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-sec)", margin: "4px 0 0" }}>
            Gérer les accès et les rôles des membres
          </p>
        </div>
      </div>

      {/* Filter + search bar */}
      <div className="usr-toolbar">
        <div className="usr-tabs">
          {[
            { key: "all", label: "Tous", count: users.length },
            { key: "admin", label: "Admins", count: adminCount },
            { key: "member", label: "Bénévoles", count: memberCount },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`usr-tab${filter === tab.key ? " active" : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              <span className="usr-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="adm-search-wrap" style={{ flex: 1, maxWidth: 280 }}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="adm-search"
            style={{ width: "100%" }}
            placeholder="Rechercher par nom ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="adm-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div className="adm-empty">Chargement…</div>
        ) : filtered.length === 0 ? (
          <div className="adm-empty">Aucun utilisateur trouvé.</div>
        ) : (
          filtered.map((u, i) => {
            const isSelf = u.email === user?.email;
            const isAdmin = u.role === "ADMIN";
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div key={u.id} className="usr-row">
                <div className="usr-avatar" style={{ background: color }}>
                  {avatar(u)}
                </div>
                <div className="usr-info">
                  <div className="usr-name-row">
                    <span className="usr-name">
                      {u.firstName} {u.lastName}
                      {isSelf && <span className="usr-self">(vous)</span>}
                    </span>
                    <span className={isAdmin ? "usr-badge admin" : "usr-badge member"}>
                      {isAdmin ? "Admin" : "Bénévole"}
                    </span>
                  </div>
                  <span className="usr-email">{u.email}</span>
                </div>
                <div className="usr-actions">
                  {isSelf ? (
                    <span className="usr-self-tag">Mon compte</span>
                  ) : isAdmin ? (
                    <button
                      className="adm-btn-secondary"
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() =>
                        setPendingAction({ userId: u.id, newRole: "MEMBER", userName: `${u.firstName} ${u.lastName}` })
                      }
                    >
                      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                      Rétrograder
                    </button>
                  ) : (
                    <button
                      className="adm-btn-primary"
                      style={{ fontSize: 12, padding: "6px 12px" }}
                      onClick={() =>
                        setPendingAction({ userId: u.id, newRole: "ADMIN", userName: `${u.firstName} ${u.lastName}` })
                      }
                    >
                      <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      Passer admin
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {pendingAction && (
        <ConfirmModal
          title={pendingAction.newRole === "ADMIN" ? "Passer administrateur ?" : "Rétrograder en bénévole ?"}
          message={
            pendingAction.newRole === "ADMIN"
              ? `${pendingAction.userName} aura accès à toutes les fonctions d'administration.`
              : `${pendingAction.userName} perdra ses droits d'administration.`
          }
          icon={pendingAction.newRole === "ADMIN" ? "🔑" : "👤"}
          variant={pendingAction.newRole === "ADMIN" ? "success" : "warning"}
          confirmLabel={pendingAction.newRole === "ADMIN" ? "Passer admin" : "Rétrograder"}
          onConfirm={executeRoleChange}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}
