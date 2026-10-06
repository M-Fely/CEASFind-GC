import { Link, useNavigate } from "react-router-dom";
import { formatDate, itemActionPath, statusInfo } from "../lib/format.js";

const FILLED = { fontVariationSettings: '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24' };

export default function PostCard({ post, currentEmail, isAdmin, saved, onToggleSave, onDelete, onShare, deleting }) {
  const navigate = useNavigate();
  const status = statusInfo(post.status);
  const isLost = post.postType === "lost";
  const isOwner = Boolean(currentEmail) && currentEmail === post.reporterEmail;
  const canDelete = isOwner || isAdmin;

  // Lost items get "I Found This!", found items get "Claim"; never on your own post.
  const canAct = !isOwner && (isLost ? ["searching", "unclaimed"].includes(status.raw) : status.raw === "unclaimed");
  const actionLabel = isOwner ? "Your Post" : canAct ? (isLost ? "I Found This!" : "Claim") : status.label;

  return (
    <div className="post-card">
      <div className="post-card-head">
        <div>
          <Link to={`/profile?user=${encodeURIComponent(post.reporterEmail || "")}`} className="post-author">
            <strong>{post.reporterName || "Unknown"}</strong>
          </Link>
          <p className="post-meta">
            {formatDate(post.createdAt)} | {post.category || ""}
          </p>
        </div>
        <div className="post-card-head-right">
          {canDelete && (
            <button
              className="delete-post-btn"
              onClick={() => onDelete(post)}
              disabled={deleting}
              title={isOwner ? "Delete your post" : "Admin: Delete post"}
            >
              <span className="material-symbols-outlined">delete</span> {deleting ? "Deleting…" : "Delete"}
            </button>
          )}
          <span className="status-badge" style={{ background: status.color }}>
            {status.label}
          </span>
        </div>
      </div>

      <div className="post-body">
        <p>
          <strong>Item:</strong> {post.itemName || ""}
        </p>
        <p>
          <strong>Type:</strong> {isLost ? "Lost Item" : "Found Item"}
        </p>
        {(post.foundLocation || post.lostLocation) && (
          <p>
            <strong>{isLost ? "Last seen:" : "Found at:"}</strong> {post.foundLocation || post.lostLocation}
            {post.lostWhen ? ` · ${post.lostWhen}` : ""}
          </p>
        )}
        {post.description && <p className="post-description">{post.description}</p>}
      </div>

      {post.img_url && <img className="post-image" src={post.img_url} alt={post.itemName || "Item photo"} />}

      <div className="post-actions">
        <button
          className={`action-btn${isLost && canAct ? " lost-action" : ""}`}
          disabled={!canAct}
          onClick={() => navigate(itemActionPath(post))}
        >
          <span className="material-symbols-outlined">{isLost ? "volunteer_activism" : "front_hand"}</span>
          {actionLabel}
        </button>

        <button className={`action-btn${saved ? " active" : ""}`} onClick={() => onToggleSave(post)}>
          <span className="material-symbols-outlined" style={saved ? FILLED : undefined}>
            bookmark
          </span>
          {saved ? "Saved" : "Save"}
        </button>

        {isOwner && (
          <button className="action-btn" onClick={() => navigate(`/post?edit=${post.id}`)}>
            <span className="material-symbols-outlined">edit</span> Edit
          </button>
        )}

        <button className="action-btn" onClick={() => onShare(post)}>
          <span className="material-symbols-outlined">share</span> Share
        </button>
      </div>
    </div>
  );
}
