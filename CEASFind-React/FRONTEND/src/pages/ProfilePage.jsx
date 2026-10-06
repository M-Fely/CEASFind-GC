import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import PostCard from "../components/PostCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDialog } from "../context/DialogContext.jsx";
import { getItemsByReporter } from "../lib/api.js";
import usePostActions from "../lib/usePostActions.js";

// /profile?user=<email> — everything one person has posted (defaults to yourself).
export default function ProfilePage() {
  const { user, isAdmin, displayName } = useAuth();
  const dialog = useDialog();
  const [params] = useSearchParams();
  const viewEmail = params.get("user") || user.email;
  const isMe = viewEmail === user.email;

  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const [search, setSearch] = useState("");
  const [highlightId, setHighlightId] = useState(null);
  const cardRefs = useRef({});
  const { savedIds, deletingId, toggleSave, deletePost, sharePost } = usePostActions(setPosts);

  useEffect(() => {
    setStatus({ loading: true, error: "" });
    getItemsByReporter(viewEmail)
      .then((list) => {
        setPosts(list);
        setStatus({ loading: false, error: "" });
      })
      .catch((err) => setStatus({ loading: false, error: err.message }));
  }, [viewEmail]);

  const name = isMe ? displayName : posts[0]?.reporterName || viewEmail;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return q
      ? posts.filter((p) => [p.itemName, p.description, p.category].some((f) => (f || "").toLowerCase().includes(q)))
      : posts;
  }, [posts, search]);

  const jumpTo = (id) => {
    cardRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightId(id);
    setTimeout(() => setHighlightId(null), 1500);
  };

  const shareProfile = async () => {
    const url = `${window.location.origin}/profile?user=${encodeURIComponent(viewEmail)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `Check out ${name} on CEAS FIND`, url });
      } catch {
        // share sheet dismissed
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      dialog.alert("Link Copied", `Profile link copied to your clipboard:\n${url}`, "link");
    } catch {
      dialog.alert("Share Profile", url, "share");
    }
  };

  return (
    <AppLayout title="Profile" search={search} onSearch={setSearch} searchPlaceholder="Search these posts…">
      <div className="main-scroll-view">
        <div className="profile-header-container">
          <div className="profile-header-card">
            <div className="profile-info">
              <h2>{name}</h2>
              <p>{viewEmail.endsWith("@gordoncollege.edu.ph") ? "Verified User" : viewEmail}</p>
            </div>
            <div className="profile-stats-group">
              <div className="post-count-badge">
                <span>{posts.length}</span>
                <span className="post-count-label">Posts</span>
              </div>
              <button className="share-profile-btn" onClick={shareProfile}>
                <span className="material-symbols-outlined">share</span> Share Profile
              </button>
            </div>
          </div>
        </div>

        <div className="feed-container">
          {status.loading ? (
            <p className="empty-msg">Loading posts…</p>
          ) : status.error ? (
            <p className="empty-msg">Could not load posts: {status.error}</p>
          ) : filtered.length === 0 ? (
            <p className="empty-msg">{posts.length === 0 ? "No posts yet. Reported items will appear here." : "No matching posts."}</p>
          ) : (
            filtered.map((post) => (
              <div
                key={post.id}
                ref={(el) => (cardRefs.current[post.id] = el)}
                className={highlightId === post.id ? "highlighted" : undefined}
              >
                <PostCard
                  post={post}
                  currentEmail={user.email}
                  isAdmin={isAdmin}
                  saved={savedIds.has(post.id)}
                  deleting={deletingId === post.id}
                  onToggleSave={toggleSave}
                  onDelete={deletePost}
                  onShare={sharePost}
                />
              </div>
            ))
          )}
        </div>

        <div className="right-panel">
          <div className="photo-gallery-container">
            <h5>Posted Photos</h5>
            {posts.some((p) => p.img_url) ? (
              <div className="photo-gallery">
                {posts
                  .filter((p) => p.img_url)
                  .map((p) => (
                    <img key={p.id} className="gallery-img" src={p.img_url} alt={p.itemName} onClick={() => jumpTo(p.id)} />
                  ))}
              </div>
            ) : (
              <p className="preview-empty">No photos available.</p>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
