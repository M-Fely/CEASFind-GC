import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout.jsx";
import ItemThumb from "../components/ItemThumb.jsx";
import RightPanel from "../components/RightPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDialog } from "../context/DialogContext.jsx";
import { getClaims, getItemsByReporter, markItemClaimed } from "../lib/api.js";
import { itemTitle, timeAgo } from "../lib/format.js";

// Reporter's view: their found items that have pending claims, with each
// claimant's proof of ownership, and a button to mark the item as claimed.
export default function ReviewPage() {
  const { user } = useAuth();
  const dialog = useDialog();
  const [entries, setEntries] = useState([]); // [{ item, claims }]
  const [status, setStatus] = useState({ loading: true, error: "", done: false });
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const items = await getItemsByReporter(user.email);
        const pending = items.filter((i) => (i.status || "").toLowerCase() === "pending");
        const claims = pending.length ? await getClaims() : [];
        setEntries(
          pending.map((item) => ({
            item,
            claims: claims.filter((c) => c.itemID === item.id && (c.status || "").toLowerCase() === "pending"),
          })),
        );
        setStatus({ loading: false, error: "", done: false });
      } catch (err) {
        setStatus({ loading: false, error: err.message, done: false });
      }
    })();
  }, [user.email]);

  const markClaimed = async (item) => {
    const ok = await dialog.confirm(
      "Mark as Claimed",
      `Confirm that "${itemTitle(item)}" has been returned to its owner?`,
      { icon: "task_alt" },
    );
    if (!ok) return;
    setUpdatingId(item.id);
    try {
      await markItemClaimed(item.id);
      setEntries((list) => list.filter((e) => e.item.id !== item.id));
      setStatus((s) => ({ ...s, done: true }));
    } catch (err) {
      dialog.alert("Error", err.message, "error");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppLayout title="Review">
      <div className="main-scroll-view">
        <div className="card-list">
          {status.loading ? (
            <p className="empty-msg">Loading…</p>
          ) : status.error ? (
            <p className="empty-msg">Could not load reviews: {status.error}</p>
          ) : entries.length === 0 ? (
            <p className="empty-msg">{status.done ? "All claims have been processed." : "No pending claims to review."}</p>
          ) : (
            entries.map(({ item, claims }) => (
              <div key={item.id} className="review-post-card">
                <ItemThumb src={item.img_url} size={65} />
                <div className="review-info">
                  <strong>{itemTitle(item)}</strong>
                  <p className="review-sub">
                    {item.postType === "lost" ? "Lost Item" : "Found Item"} · {item.category || ""}
                  </p>
                  {claims.length > 0 ? (
                    claims.map((c) => (
                      <div key={c.id} className="claim-box">
                        <p className="claim-name">{c.claimantName || "GC Student"}</p>
                        <p className="claim-contact">
                          {[c.claimantEmail, c.claimantContact].filter(Boolean).join(" · ")}
                          {c.timestamp ? ` · ${timeAgo(c.timestamp)}` : ""}
                        </p>
                        <p className="claim-proof">{c.proofDescription || ""}</p>
                      </div>
                    ))
                  ) : (
                    <p className="claim-none">No claim details on file.</p>
                  )}
                </div>
                <div className="review-actions">
                  <span className="status-badge" style={{ background: "#b45309" }}>
                    PENDING
                  </span>
                  <button className="small-btn" disabled={updatingId === item.id} onClick={() => markClaimed(item)}>
                    {updatingId === item.id ? "Updating…" : "Mark as Claimed"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <RightPanel show={["notifications", "pending"]} />
      </div>
    </AppLayout>
  );
}
