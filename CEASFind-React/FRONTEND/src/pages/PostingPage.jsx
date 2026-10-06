import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Waves, { BrandHeader } from "../components/Waves.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDialog } from "../context/DialogContext.jsx";
import { createItem, getItem, updateItem } from "../lib/api.js";
import { POSTABLE_CATEGORIES, ROOMS } from "../lib/constants.js";
import "../styles/form-page.css";

const EMPTY_FORM = { itemName: "", location: "", lostWhen: "", category: "", description: "", file: null, preview: "" };

const MODES = {
  found: {
    tab: "I Found an Item",
    tabIcon: "search_hands_free",
    subtitle: "Reporting a found item",
    status: "Unclaimed",
    nameLabel: "Item name (what you found)",
    namePlaceholder: "e.g. Blue water bottle",
    locationLabel: "Where was it found?",
    descLabel: "Description",
    descPlaceholder: "Add more details about the item...",
    uploadText: "upload photo of item",
    submit: "Add Post",
  },
  lost: {
    tab: "I Lost an Item",
    tabIcon: "help_outline",
    subtitle: "Posting a lost item lookup",
    status: "Searching",
    nameLabel: "What did you lose?",
    namePlaceholder: "e.g. My ID, Black umbrella...",
    locationLabel: "Where do you think you lost it?",
    descLabel: "Description / Identifying details",
    descPlaceholder: "Color, brand, distinguishing features...",
    uploadText: "upload reference photo (optional)",
    submit: "Post Lost Item",
  },
};

// Textarea that grows with its content, like the original auto-resizing inputs.
function AutoTextarea(props) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [props.value]);
  return <textarea ref={ref} rows={1} {...props} />;
}

function CategoryInput({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const query = value.replace("#", "").toLowerCase();
  const matches = POSTABLE_CATEGORIES.filter((c) => c.toLowerCase().includes(query));

  return (
    <div className="hashtag-container">
      <AutoTextarea
        placeholder="#Add Category"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      {open && matches.length > 0 && (
        <div className="suggestions">
          {matches.map((m) => (
            <div
              key={m}
              className="sug-item"
              // mousedown fires before the textarea's blur closes the list
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(m);
                setOpen(false);
              }}
            >
              #{m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PostingPage() {
  const { user, displayName } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("edit");

  const [mode, setMode] = useState("found");
  const [forms, setForms] = useState({ found: EMPTY_FORM, lost: EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editId));

  const setField = (m, field, value) => setForms((f) => ({ ...f, [m]: { ...f[m], [field]: value } }));

  useEffect(() => {
    if (!editId) return;
    getItem(editId)
      .then(async (item) => {
        if (!item) {
          await dialog.alert("Not Found", "That post no longer exists.", "error");
          return navigate("/history", { replace: true });
        }
        if (item.reporterEmail !== user.email) {
          await dialog.alert("Not Allowed", "You can only edit your own posts.", "block");
          return navigate("/home", { replace: true });
        }
        const m = item.postType === "lost" ? "lost" : "found";
        setMode(m);
        setForms((f) => ({
          ...f,
          [m]: {
            ...EMPTY_FORM,
            itemName: item.itemName || "",
            location: (m === "lost" ? item.lostLocation : item.foundLocation) || "",
            lostWhen: item.lostWhen || "",
            category: item.category || "",
            description: item.description || "",
            preview: item.img_url || "",
          },
        }));
      })
      .catch((err) => dialog.alert("Error", `Failed to load item for edit: ${err.message}`, "error"))
      .finally(() => setLoadingEdit(false));
    // Load once per edit id; dialog/navigate/user are stable for that.
  }, [editId]);

  const pickImage = (m, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForms((f) => ({ ...f, [m]: { ...f[m], file, preview: ev.target.result } }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    const form = forms[mode];
    const isFound = mode === "found";
    const itemName = form.itemName.trim();
    if (!itemName) return dialog.alert("Missing Item Name", "Please enter the item name.", "edit");
    if (form.file && form.file.size > 5 * 1024 * 1024) {
      return dialog.alert("Photo Too Large", "Please choose an image smaller than 5 MB.", "image");
    }

    const fields = {
      postType: mode,
      itemName,
      [isFound ? "foundLocation" : "lostLocation"]: form.location,
      lostWhen: isFound ? undefined : form.lostWhen.trim(),
      category: form.category.trim(),
      description: form.description.trim(),
    };
    if (!editId) {
      Object.assign(fields, {
        status: MODES[mode].status,
        reporterName: displayName || "GC Student",
        reporterEmail: user.email,
        reporterUid: user.uid,
      });
    }

    setSubmitting(true);
    try {
      if (editId) await updateItem(editId, fields, form.file);
      else await createItem(fields, form.file);
      await dialog.alert(
        editId ? "Post Updated" : "Posted!",
        editId ? "Post updated successfully!" : "Success! Your item has been posted.",
        "check_circle",
      );
      navigate(editId ? "/history" : "/home");
    } catch (err) {
      console.error("Post Error:", err);
      await dialog.alert("Error", err.message, "error");
      setSubmitting(false);
    }
  };

  const cfg = MODES[mode];
  const form = forms[mode];
  const isLost = mode === "lost";

  return (
    <div className={`form-page${isLost ? " mode-lost" : ""}`}>
      <BrandHeader />
      <Waves />

      <div className="form-card post-form-card">
        <div className="type-toggle-bar">
          {Object.entries(MODES).map(([m, c]) => (
            <button
              key={m}
              className={`type-tab${mode === m ? ` active-${m}` : ""}`}
              onClick={() => setMode(m)}
              // An existing post can't switch between lost and found.
              disabled={Boolean(editId) && mode !== m}
            >
              <span className="material-symbols-outlined">{c.tabIcon}</span>
              {c.tab}
            </button>
          ))}
        </div>

        <div className="card-header">
          <div className="user-header">
            <h2>{displayName}</h2>
            <p>{editId ? "Editing your post" : cfg.subtitle}</p>
          </div>
          <div className="status-badge">{cfg.status}</div>
        </div>

        <div className="card-body">
          {loadingEdit ? (
            <div className="state-panel">
              <div className="spinner" />
              <span>Loading post…</span>
            </div>
          ) : (
            <div className="form-panel">
              <div className="inputs-area">
                <span className="field-label">{cfg.nameLabel}</span>
                <AutoTextarea
                  placeholder={cfg.namePlaceholder}
                  value={form.itemName}
                  onChange={(e) => setField(mode, "itemName", e.target.value)}
                />

                <span className="field-label">{cfg.locationLabel}</span>
                <div className="select-container">
                  <select value={form.location} onChange={(e) => setField(mode, "location", e.target.value)}>
                    <option value="" disabled>
                      Select Room / Location
                    </option>
                    {ROOMS.map((room) => (
                      <option key={room} value={room}>
                        {room}
                      </option>
                    ))}
                  </select>
                </div>

                {isLost && (
                  <>
                    <span className="field-label">When did you lose it?</span>
                    <input
                      type="text"
                      className="lost-location-input"
                      placeholder="e.g. This morning, Last Tuesday..."
                      value={form.lostWhen}
                      onChange={(e) => setField(mode, "lostWhen", e.target.value)}
                    />
                  </>
                )}

                <span className="field-label">Category</span>
                <CategoryInput value={form.category} onChange={(v) => setField(mode, "category", v)} />

                <span className="field-label">{cfg.descLabel}</span>
                <AutoTextarea
                  placeholder={cfg.descPlaceholder}
                  value={form.description}
                  onChange={(e) => setField(mode, "description", e.target.value)}
                />
              </div>

              <label className="upload-box">
                <input type="file" accept="image/*" hidden onChange={(e) => pickImage(mode, e.target.files[0])} />
                {form.preview ? (
                  <img src={form.preview} alt="Selected item" />
                ) : (
                  <div className="upload-placeholder">
                    <span className="material-symbols-outlined">upload</span>
                    <p>{cfg.uploadText}</p>
                  </div>
                )}
              </label>
              {isLost && (
                <p className="upload-optional-note">
                  Photo is optional for lost items — but helps others identify it faster.
                </p>
              )}

              <div className="action-footer">
                <button className="btn-cancel" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button className={`btn-submit${isLost ? " lost-mode" : ""}`} onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Posting..." : editId ? "Update Post" : cfg.submit}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
