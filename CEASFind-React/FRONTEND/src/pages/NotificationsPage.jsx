import { useEffect, useMemo, useState } from "react";
import AppLayout from "../components/AppLayout.jsx";
import RightPanel from "../components/RightPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getNotifications } from "../lib/api.js";
import { describeNotification, timeAgo } from "../lib/format.js";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    getNotifications(user.uid)
      .then((list) => {
        setNotifications(list);
        setStatus({ loading: false, error: "" });
      })
      .catch((err) => setStatus({ loading: false, error: err.message }));
  }, [user.uid]);

  const rows = useMemo(() => {
    const q = search.toLowerCase().trim();
    return notifications
      .map((n) => ({ n, d: describeNotification(n) }))
      .filter(({ d }) => !q || `${d.who} ${d.text}`.toLowerCase().includes(q));
  }, [notifications, search]);

  return (
    <AppLayout title="Notifications" search={search} onSearch={setSearch} searchPlaceholder="Search notifications…">
      <div className="main-scroll-view">
        <div className="card-list">
          {status.loading ? (
            <p className="empty-msg">Loading…</p>
          ) : status.error ? (
            <p className="empty-msg">Could not load notifications: {status.error}</p>
          ) : rows.length === 0 ? (
            <p className="empty-msg">No notifications.</p>
          ) : (
            rows.map(({ n, d }) => (
              <div key={n.id} className="notif-row" style={{ borderLeft: `5px solid ${d.color}` }}>
                <div className="notif-content">
                  <span className="notif-username">{d.who}</span> {d.text}
                  {d.contact && <div className="notif-contact">{d.contact}</div>}
                  {n.type !== "return_offer" && n.secretDetail && (
                    <div className="notif-contact">Proof: “{n.secretDetail}”</div>
                  )}
                  <div className="notif-time">{timeAgo(n.createdAt)}</div>
                </div>
                <span className="material-symbols-outlined notif-bell" style={{ color: d.color }}>
                  {d.icon}
                </span>
              </div>
            ))
          )}
        </div>

        <RightPanel show={["pending", "review"]} />
      </div>
    </AppLayout>
  );
}
