import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDialog } from "../context/DialogContext.jsx";
import { getItem, getSavedIds, unsaveItem } from "../lib/api.js";
import { formatDate, itemActionPath, statusInfo } from "../lib/format.js";

const plural = (n) => `${n} bookmarked item${n !== 1 ? "s" : ""}`;

export default function SavedPage() {
  const { user } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [search, setSearch] = useState("");
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const ids = await getSavedIds(user.uid);
        // Fetch live data for each bookmark; deleted posts simply drop out.
        const results = await Promise.allSettled(ids.map((id) => getItem(id)));
        setPosts(results.map((r) => (r.status === "fulfilled" ? r.value : null)).filter(Boolean));
        setStatus({ loading: false, error: "" });
      } catch (err) {
        setStatus({ loading: false, error: err.message });
      }
    })();
  }, [user.uid]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return posts;
    return posts.filter((p) =>
      [p.itemName, p.category, p.description, p.reporterName].some((f) => (f || "").toLowerCase().includes(q)),
    );
  }, [posts, search]);

  const unsave = async (post) => {
    if (!(await dialog.confirm("Remove Bookmark", "Remove this bookmark?", { icon: "bookmark_remove" }))) return;
    setRemovingId(post.id);
    try {
      await unsaveItem(user.uid, post.id);
      setPosts((list) => list.filter((p) => p.id !== post.id));
    } catch (err) {
      dialog.alert("Failed to Remove Bookmark", err.message, "error");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AppLayout title="Bookmarks" search={search} onSearch={setSearch} searchPlaceholder="Search saved…">
      <div className="main-scroll-view">
        <div className="card-list">
          {status.loading ? (
            [0, 1, 2].map((i) => <div key={i} className="skeleton" />)
          ) : status.error ? (
            <p className="empty-msg">Failed to load bookmarks: {status.error}</p>
          ) : posts.length === 0 ? (
            <p className="empty-msg">
              No bookmarks yet.
              <br />
              Hit the bookmark button on any item to save it here.
            </p>
          ) : filtered.length === 0 ? (
            <p className="empty-msg">No matching bookmarks.</p>
          ) : (
            filtered.map((post) => {
              const s = statusInfo(post.status);
              const location = post.foundLocation || post.lostLocation;
              const date = formatDate(post.createdAt);
              return (
                <div key={post.id} className="saved-card">
                  {post.img_url && <img className="saved-card-img" src={post.img_url} alt={post.itemName} />}
                  <div className="saved-card-body">
                    <div className="saved-card-thumb">
                      {post.img_url ? (
                        <img src={post.img_url} alt="" />
                      ) : (
                        <span className="material-symbols-outlined">image</span>
                      )}
                    </div>
                    <div className="saved-card-info">
                      <div className="item-name">{post.itemName || "Unknown Item"}</div>
                      <div className="item-meta">
                        {[post.category, location, date].filter(Boolean).join(" · ")}
                      </div>
                      <div className="item-reporter">
                        By <strong>{post.reporterName || "Unknown"}</strong> ·{" "}
                        {post.postType === "lost" ? "Lost Item" : "Found Item"}
                      </div>
                    </div>
                    <div className="saved-card-actions">
                      <span className="status-pill" style={{ background: s.color }}>
                        {s.label}
                      </span>
                      <div className="card-btn-row">
                        <button className="btn-view" onClick={() => navigate(itemActionPath(post))}>
                          {post.postType === "lost" ? "Return / View" : "Claim / View"}
                        </button>
                        <button
                          className="btn-unsave"
                          title="Remove bookmark"
                          disabled={removingId === post.id}
                          onClick={() => unsave(post)}
                        >
                          <span className="material-symbols-outlined">bookmark_remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="right-panel">
          <div className="preview-card">
            <h5>Quick Stats</h5>
            <p className="preview-line">{status.loading ? "Loading…" : plural(posts.length)}</p>
          </div>
          <div className="preview-card">
            <h5>Tip</h5>
            <p className="preview-line">
              Bookmarked items are synced to your account — they'll appear on any device you log into.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
