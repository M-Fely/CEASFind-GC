// Data layer for CEAS FIND.
// Items, claims, bookmarks and notifications go through the Express backend
// (BACKEND/server.js, mounted under /api). User registration talks to Firestore
// directly, exactly like the original auth.js did.
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase.js";
import { sortNewestFirst } from "./format.js";

// In dev, Vite proxies /api to the backend (see vite.config.js). Set
// VITE_API_URL to point at a backend hosted somewhere else.
const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function request(path, { method = "GET", json, form } = {}) {
  const options = { method };
  if (json) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(json);
  } else if (form) {
    options.body = form;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new Error("Could not connect to the server. Is the backend running?");
  }

  const text = await res.text();
  let data = text;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // plain-text response
  }
  if (!res.ok) {
    const message = (data && data.error) || (typeof data === "string" && data) || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return data;
}

const qs = (params) => new URLSearchParams(params).toString();

// ── Users (Firestore) ────────────────────────────────────────────────────────

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function registerUser(user, rawCode) {
  const code = (rawCode || "").toUpperCase().trim();
  if (!code) throw new Error("Please enter your CEAS course code.");

  const configSnap = await getDoc(doc(db, "config", "codes"));
  if (!configSnap.exists()) throw new Error("Database Error: Course codes not configured.");
  if (!(configSnap.data().list || []).includes(code)) {
    throw new Error("Invalid CEAS course code. Please try again.");
  }

  const displayName = user.displayName || "GC Student";
  const nameParts = displayName.split(" ");
  const profile = {
    displayName,
    firstName: nameParts[0] || "GC",
    lastName: nameParts.slice(1).join(" ") || "Student",
    email: user.email,
    courseCode: code,
    role: "student",
    createdAt: new Date(),
  };
  await setDoc(doc(db, "users", user.uid), profile);
  return profile;
}

// ── Items ────────────────────────────────────────────────────────────────────

export async function getItems() {
  return sortNewestFirst(await request("/item"));
}

export async function getItem(id) {
  try {
    return await request(`/item/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err.status === 404) return null;
    throw err;
  }
}

export async function getItemsByReporter(email) {
  return sortNewestFirst(await request(`/item/history?${qs({ userEmail: email })}`));
}

function itemForm(fields, file) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    // Empty strings are sent on purpose so an edit can clear a field.
    if (value !== undefined && value !== null) form.append(key, value);
  }
  if (file) form.append("img_url", file);
  return form;
}

export async function createItem(fields, file) {
  return request("/item", { method: "POST", form: itemForm(fields, file) });
}

export async function updateItem(id, fields, file) {
  return request(`/item/${encodeURIComponent(id)}`, { method: "PUT", form: itemForm(fields, file) });
}

export async function deleteItem(id, user) {
  return request(`/item/${encodeURIComponent(id)}?${qs({ requesterEmail: user.email, requesterUid: user.uid })}`, {
    method: "DELETE",
  });
}

export async function markItemClaimed(id) {
  return request(`/item/${encodeURIComponent(id)}/claim`, { method: "PUT" });
}

// ── Claims (someone claims a FOUND item) ─────────────────────────────────────

export async function submitClaim(itemId, { claimantName, claimantEmail, claimantContact, secretDetail }) {
  return request(`/item/${encodeURIComponent(itemId)}/submit-claim`, {
    method: "POST",
    json: { claimantName, claimantEmail, claimantContact, secretDetail },
  });
}

export async function getClaims() {
  return sortNewestFirst(await request("/claims"), "timestamp");
}

// ── Return offers (someone found a LOST item) ────────────────────────────────

export async function submitReturnOffer(itemId, { finderName, finderEmail, finderContact, whereFound, additionalDetails }) {
  return request(`/item/${encodeURIComponent(itemId)}/return-offer`, {
    method: "POST",
    json: { finderName, finderEmail, finderContact, whereFound, additionalDetails },
  });
}

// ── Bookmarks ────────────────────────────────────────────────────────────────

export async function getSavedIds(uid) {
  return request(`/saved?${qs({ uid })}`);
}

export async function saveItem(uid, postId) {
  return request("/saved", { method: "POST", json: { uid, postId } });
}

export async function unsaveItem(uid, postId) {
  return request(`/saved/${encodeURIComponent(postId)}?${qs({ uid })}`, { method: "DELETE" });
}

// ── Notifications ────────────────────────────────────────────────────────────

export async function getNotifications(uid) {
  return request(`/notifications?${qs({ uid })}`);
}
