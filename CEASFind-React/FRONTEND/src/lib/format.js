import { STATUS_COLORS } from "./constants.js";

// Firestore Timestamp, a serialized {seconds}, an ISO string or a Date → Date | null
export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value.seconds === "number") return new Date(value.seconds * 1000);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value) {
  const d = toDate(value);
  return d ? d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" }) : "";
}

export function timeAgo(value) {
  const d = toDate(value);
  if (!d) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(d);
}

export function sortNewestFirst(list, field = "createdAt") {
  return [...list].sort((a, b) => (toDate(b[field])?.getTime() || 0) - (toDate(a[field])?.getTime() || 0));
}

export function statusInfo(status, fallback = "unclaimed") {
  const raw = (status || fallback).toLowerCase();
  return {
    raw,
    label: raw.charAt(0).toUpperCase() + raw.slice(1),
    color: STATUS_COLORS[raw] || "#8e8e8e",
  };
}

export function itemTitle(item) {
  return item.itemName || item.foundItem || item.lostItem || "Untitled";
}

export function cleanCategory(cat) {
  return (cat || "").replace(/#/g, "").toLowerCase().trim();
}

// Where the main action for an item lives: found items are claimed, lost items are returned.
export function itemActionPath(item) {
  return item.postType === "lost" ? `/return/${item.id}` : `/claim/${item.id}`;
}

// Notifications written by the backend (users/{uid}/notifications).
export function describeNotification(n) {
  if (n.type === "return_offer") {
    return {
      who: n.finderName || "Someone",
      text: `may have found your lost item "${n.itemName}"${n.whereFound ? ` — found at: ${n.whereFound}` : ""}.`,
      contact: [n.finderEmail, n.finderContact].filter(Boolean).join(" · "),
      color: STATUS_COLORS.synced,
      icon: "volunteer_activism",
    };
  }
  return {
    who: n.claimantName || "Someone",
    text: `wants to claim "${n.itemName}". Check their proof on the Review page.`,
    contact: [n.claimantEmail, n.claimantContact].filter(Boolean).join(" · "),
    color: STATUS_COLORS.pending,
    icon: "front_hand",
  };
}
