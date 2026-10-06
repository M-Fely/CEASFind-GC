import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import ItemThumb from "../components/ItemThumb.jsx";
import RightPanel from "../components/RightPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getClaims, getItem } from "../lib/api.js";
import { statusInfo, timeAgo } from "../lib/format.js";

// Claimant's view: the claims I've submitted and where each item stands now.
export default function PendingPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]); // [{ claim, item | null }]
  const [status, setStatus] = useState({ loading: true, error: "" });

  useEffect(() => {
    (async () => {
      try {
        const mine = (await getClaims()).filter((c) => c.claimantEmail === user.email);
        const items = await Promise.allSettled(mine.map((c) => getItem(c.itemID)));
        setEntries(mine.map((claim, i) => ({ claim, item: items[i].status === "fulfilled" ? items[i].value : null })));
        setStatus({ loading: false, error: "" });
      } catch (err) {
        setStatus({ loading: false, error: err.message });
      }
    })();
  }, [user.email]);

  return (
    <AppLayout title="Pending">
      <div className="main-scroll-view">
        <div className="card-list">
          {status.loading ? (
            <p className="empty-msg">Loading…</p>
          ) : status.error ? (
            <p className="empty-msg">Could not load your claims: {status.error}</p>
          ) : entries.length === 0 ? (
            <p className="empty-msg">
              No pending claims. Found something that's yours? Hit <strong>Claim</strong> on its post.
            </p>
          ) : (
            entries.map(({ claim, item }) => {
              // The item's live status tells the claimant whether the reporter approved it.
              const s = item ? statusInfo(item.status) : { label: "Removed", color: "#8e8e8e" };
              return (
                <div key={claim.id} className="pending-post-card">
                  <ItemThumb src={item?.img_url} />
                  <div className="pending-info">
                    <div className="pending-title">
                      Proof of ownership for <span>{claim.itemName || item?.itemName || "an item"}</span>
                    </div>
                    <p className="pending-proof">“{claim.proofDescription}”</p>
                    <p className="pending-meta">
                      {item?.reporterName ? `Reported by ${item.reporterName}` : ""}
                      {claim.timestamp ? ` · sent ${timeAgo(claim.timestamp)}` : ""}
                    </p>
                  </div>
                  <div className="pending-actions">
                    <span className="status-badge" style={{ background: s.color }}>
                      {s.label}
                    </span>
                    {item?.reporterEmail && (
                      <a className="contact-btn" href={`mailto:${item.reporterEmail}`}>
                        <span className="material-symbols-outlined">mail</span> Contact
                      </a>
                    )}
                    {item && (
                      <Link className="contact-btn" to={`/profile?user=${encodeURIComponent(item.reporterEmail || "")}`}>
                        <span className="material-symbols-outlined">person</span> Reporter
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <RightPanel show={["notifications", "review"]} />
      </div>
    </AppLayout>
  );
}
