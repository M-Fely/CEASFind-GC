import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useDialog } from "../context/DialogContext.jsx";
import { deleteItem, getSavedIds, saveItem, unsaveItem } from "./api.js";
import { itemActionPath } from "./format.js";

// Bookmark / delete / share behaviour shared by every feed of PostCards.
// `setPosts` lets a successful delete drop the post from the caller's list.
export default function usePostActions(setPosts) {
  const { user } = useAuth();
  const dialog = useDialog();
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    getSavedIds(user.uid)
      .then((ids) => setSavedIds(new Set(ids)))
      .catch((err) => console.warn("Could not load saved items:", err));
  }, [user]);

  const setSaved = (id, on) =>
    setSavedIds((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });

  const toggleSave = async (post) => {
    if (!user) return dialog.alert("Login Required", "Please log in to save items.", "lock");
    const wasSaved = savedIds.has(post.id);
    setSaved(post.id, !wasSaved); // optimistic
    try {
      if (wasSaved) await unsaveItem(user.uid, post.id);
      else await saveItem(user.uid, post.id);
    } catch (err) {
      console.error("Save toggle failed:", err);
      setSaved(post.id, wasSaved);
      dialog.alert("Bookmark Failed", err.message, "error");
    }
  };

  const deletePost = async (post) => {
    const ok = await dialog.confirm(
      "Delete Post",
      "Are you sure you want to delete this post? This cannot be undone.",
      { icon: "delete_forever", danger: true, confirmLabel: "Delete" },
    );
    if (!ok) return;
    setDeletingId(post.id);
    try {
      await deleteItem(post.id, user);
      setPosts((list) => list.filter((p) => p.id !== post.id));
    } catch (err) {
      await dialog.alert("Delete Failed", err.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const sharePost = async (post) => {
    const link = `${window.location.origin}${itemActionPath(post)}`;
    try {
      await navigator.clipboard.writeText(link);
      dialog.alert("Link Copied", `A link to this item was copied to your clipboard:\n${link}`, "link");
    } catch {
      dialog.alert("Share This Item", link, "share");
    }
  };

  return { savedIds, deletingId, toggleSave, deletePost, sharePost };
}
