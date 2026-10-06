import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../components/AppLayout.jsx";
import PostCard from "../components/PostCard.jsx";
import RightPanel from "../components/RightPanel.jsx";
import Waves from "../components/Waves.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getItems } from "../lib/api.js";
import { CATEGORIES } from "../lib/constants.js";
import { cleanCategory } from "../lib/format.js";
import usePostActions from "../lib/usePostActions.js";

export default function HomePage() {
  const { user, isAdmin } = useAuth();
  const [params, setParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: "" });
  const { savedIds, deletingId, toggleSave, deletePost, sharePost } = usePostActions(setPosts);

  // Category + search live in the URL so the sidebar links (/home?category=…)
  // and searches from other pages (/home?q=…) land here already filtered.
  const activeCategory = params.get("category") || "all";
  const searchQuery = params.get("q") || "";

  // Functional update: a click and a keystroke in quick succession must not
  // overwrite each other with a stale copy of the params.
  const updateParams = (changes) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(changes)) {
          if (!value || value === "all") next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    getItems()
      .then((items) => {
        setPosts(items);
        setStatus({ loading: false, error: "" });
      })
      .catch((err) => setStatus({ loading: false, error: err.message }));
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const cat = cleanCategory(activeCategory);
    return posts.filter((post) => {
      const passesCat = activeCategory === "all" || cleanCategory(post.category) === cat;
      const passesSearch =
        !q ||
        [post.itemName, post.description, post.reporterName, post.category].some((f) =>
          (f || "").toLowerCase().includes(q),
        );
      return passesCat && passesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  const title =
    activeCategory !== "all" ? activeCategory.replace(/#/g, "").trim() : searchQuery.trim() ? "Search" : "Home";

  return (
    <AppLayout title={title} search={searchQuery} onSearch={(q) => updateParams({ q })}>
      <div className="filter-bar">
        <button
          className={`category-chip${activeCategory === "all" ? " active" : ""}`}
          onClick={() => updateParams({ category: "all" })}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            className={`category-chip${cleanCategory(activeCategory) === cleanCategory(cat.name) ? " active" : ""}`}
            onClick={() => updateParams({ category: cat.name })}
          >
            {cat.short}
          </button>
        ))}
        {searchQuery.trim() && <span className="search-badge">"{searchQuery.trim()}"</span>}
      </div>

      <div className="main-scroll-view">
        <div className="wave-welcome">
          <h1 className="welcome-text">Lost It? Find It.</h1>
          <Waves />
        </div>

        <div className="feed-container">
          {status.loading ? (
            <p className="empty-msg">Loading posts…</p>
          ) : status.error ? (
            <p className="empty-msg">Could not load posts: {status.error}</p>
          ) : filtered.length === 0 ? (
            <p className="empty-msg">No posts found.</p>
          ) : (
            filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentEmail={user?.email}
                isAdmin={isAdmin}
                saved={savedIds.has(post.id)}
                deleting={deletingId === post.id}
                onToggleSave={toggleSave}
                onDelete={deletePost}
                onShare={sharePost}
              />
            ))
          )}
        </div>

        <RightPanel show={["notifications", "review"]} />
      </div>
    </AppLayout>
  );
}
