import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import ItemThumb from "../components/ItemThumb.jsx";
import RightPanel from "../components/RightPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDialog } from "../context/DialogContext.jsx";
import { deleteItem, getItemsByReporter } from "../lib/api.js";
import { formatDate, itemTitle, statusInfo } from "../lib/format.js";

export default function HistoryPage() {
  const { user } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    getItemsByReporter(user.email)
      .then((list) => {
        setItems(list);
        setStatus({ loading: false, error: "" });
      })
      .catch((err) => setStatus({ loading: false, error: err.message }));
  }, [user.email]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q ? items.filter((i) => [itemTitle(i), i.category, i.description].some((f) => (f || "").toLowerCase().includes(q))) : items;
  }, [items, search]);

  const remove = async (item) => {
    const ok = await dialog.confirm("Delete Post", "Delete this post? This cannot be undone.", {
      icon: "delete_forever",
      danger: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    setDeletingId(item.id);
    try {
      await deleteItem(item.id, user);
      setItems((list) => list.filter((i) => i.id !== item.id));
    } catch (err) {
      dialog.alert("Delete Failed", err.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AppLayout title="History" search={search} onSearch={setSearch} searchPlaceholder="Search your posts…">
      <div className="main-scroll-view">
        <div className="card-list">
          {status.loading ? (
            <p className="empty-msg">Loading…</p>
          ) : status.error ? (
            <p className="empty-msg">Could not load history: {status.error}</p>
          ) : items.length === 0 ? (
            <p className="empty-msg">No activity yet. Go report a lost or found item!</p>
          ) : filtered.length === 0 ? (
            <p className="empty-msg">No matching posts.</p>
          ) : (
            filtered.map((item) => {
              const s = statusInfo(item.status);
              return (
                <div key={item.id} className="history-card">
                  <ItemThumb src={item.img_url} />
                  <div className="history-info">
                    <strong>{itemTitle(item)}</strong>
                    <p>
                      <strong>Type:</strong> {item.postType === "lost" ? "Lost Item" : "Found Item"}
                    </p>
                    <p className="history-date">
                      <span className="material-symbols-outlined">schedule</span>
                      {formatDate(item.createdAt) || "Unknown date"}
                    </p>
                  </div>
                  <div className="history-actions">
                    <span className="status-badge" style={{ background: s.color }}>
                      {s.label}
                    </span>
                    <button className="small-btn" onClick={() => navigate(`/post?edit=${item.id}`)}>
                      Edit
                    </button>
                    <button className="small-btn danger" disabled={deletingId === item.id} onClick={() => remove(item)}>
                      {deletingId === item.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <RightPanel />
      </div>
    </AppLayout>
  );
}
