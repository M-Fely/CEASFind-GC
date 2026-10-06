import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getClaims, getItemsByReporter, getNotifications } from "../lib/api.js";
import { describeNotification, itemTitle, timeAgo } from "../lib/format.js";

// Clickable summary cards shown in the right column of the signed-in pages.
// `show` picks which cards appear: "notifications", "pending", "review".
export default function RightPanel({ show = ["notifications", "pending", "review"], children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ notifications: null, pending: null, review: null });
  const showKey = show.join(",");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const wanted = showKey.split(",");
    const load = async (key, fn) => {
      try {
        const value = await fn();
        if (!cancelled) setData((d) => ({ ...d, [key]: value }));
      } catch (err) {
        console.warn(`Could not load ${key} preview:`, err);
        if (!cancelled) setData((d) => ({ ...d, [key]: [] }));
      }
    };
    if (wanted.includes("notifications")) load("notifications", () => getNotifications(user.uid));
    if (wanted.includes("pending")) load("pending", async () => (await getClaims()).filter((c) => c.claimantEmail === user.email));
    if (wanted.includes("review"))
      load("review", async () =>
        (await getItemsByReporter(user.email)).filter((i) => (i.status || "").toLowerCase() === "pending"),
      );
    return () => {
      cancelled = true;
    };
  }, [user, showKey]);

  const card = (key, title, to, body) =>
    show.includes(key) && (
      <div className="preview-card clickable" onClick={() => navigate(to)} role="link" tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && navigate(to)}>
        <h5>{title}</h5>
        {data[key] === null ? <p className="preview-empty">Loading…</p> : body(data[key])}
      </div>
    );

  return (
    <div className="right-panel">
      {card("notifications", "Notifications", "/notifications", (list) =>
        list.length === 0 ? (
          <p className="preview-empty">No new notifications.</p>
        ) : (
          list.slice(0, 3).map((n) => {
            const d = describeNotification(n);
            return (
              <div key={n.id} className="preview-notif" style={{ borderLeftColor: d.color }}>
                <p>
                  <strong>{d.who}</strong> {d.text}
                </p>
                <small>{timeAgo(n.createdAt)}</small>
              </div>
            );
          })
        ),
      )}
      {card("pending", "Pending Claims", "/pending", (list) =>
        list.length === 0 ? (
          <p className="preview-empty">No pending claims.</p>
        ) : (
          list.slice(0, 3).map((c) => (
            <p key={c.id} className="preview-line">
              • {c.itemName || "Item claim"}
            </p>
          ))
        ),
      )}
      {card("review", "Review", "/review", (list) =>
        list.length === 0 ? (
          <p className="preview-empty">Nothing to review.</p>
        ) : (
          <>
            <p className="preview-line">
              <strong>
                • {list.length} item{list.length !== 1 ? "s" : ""} with claims to check
              </strong>
            </p>
            {list.slice(0, 3).map((i) => (
              <p key={i.id} className="preview-line">
                – {itemTitle(i)}
              </p>
            ))}
          </>
        ),
      )}
      {children}
    </div>
  );
}
