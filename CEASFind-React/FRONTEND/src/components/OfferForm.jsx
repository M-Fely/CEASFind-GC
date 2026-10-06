import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Waves, { BrandHeader } from "./Waves.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDialog } from "../context/DialogContext.jsx";
import { getItem } from "../lib/api.js";
import "../styles/form-page.css";

// Shared shell for the Claim page (found items) and the Return page (lost items):
// item banner + loading / error / form / success states.
//
// config: {
//   variant, bannerLabel, title, subtitle, successTitle, successText, submitLabel,
//   validateItem(item, user) → error string | null,
//   initialValues(user) → values, fields: [{ name, label, placeholder, type?, multiline?, hint? }],
//   required: [[name, message]], submit(item, values) → Promise
// }
export default function OfferForm({ config }) {
  const { postId } = useParams();
  const { user } = useAuth();
  const dialog = useDialog();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [state, setState] = useState("loading"); // loading | form | success | error
  const [error, setError] = useState("");
  const [values, setValues] = useState(() => config.initialValues(user));
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getItem(postId)
      .then((found) => {
        if (!found) throw new Error("Item not found. It may have been removed.");
        const problem = config.validateItem(found, user);
        if (problem) throw new Error(problem);
        setItem(found);
        setState("form");
      })
      .catch((err) => {
        setError(err.message);
        setState("error");
      });
  }, [postId, config, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const [name, message] of config.required) {
      if (!values[name].trim()) return dialog.alert("Missing Information", message, "edit");
    }
    setSending(true);
    try {
      const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
      await config.submit(item, trimmed);
      setState("success");
    } catch (err) {
      console.error(err);
      await dialog.alert("Sending Failed", err.message, "error");
      setSending(false);
    }
  };

  return (
    <div className={`form-page offer-page offer-${config.variant}`}>
      <BrandHeader />
      <Waves />

      <div className="form-card offer-card">
        {item && state !== "success" && (
          <div className="item-banner">
            {item.img_url && <img src={item.img_url} alt="item" onError={(e) => (e.currentTarget.style.display = "none")} />}
            <div className="item-banner-info">
              <div className="label">{config.bannerLabel}</div>
              <div className="name">{item.itemName || "Unknown Item"}</div>
              <div className="meta">
                {[item.category, item.foundLocation || item.lostLocation].filter(Boolean).join(" · ")}
              </div>
            </div>
          </div>
        )}

        <div className="card-body">
          {state === "loading" && (
            <div className="state-panel">
              <div className="spinner" />
              <span>Loading item details…</span>
            </div>
          )}

          {state === "error" && (
            <div className="state-panel">
              <span className="material-symbols-outlined error-icon">error_outline</span>
              <p>{error}</p>
              <button className="btn-solid" onClick={() => navigate(-1)}>
                Go Back
              </button>
            </div>
          )}

          {state === "success" && (
            <div className="state-panel">
              <span className="material-symbols-outlined success-icon">check_circle</span>
              <h3>{config.successTitle}</h3>
              <p>{config.successText}</p>
              <button className="btn-solid" onClick={() => navigate("/home")}>
                Back to Home
              </button>
            </div>
          )}

          {state === "form" && (
            <form className="offer-form" onSubmit={handleSubmit}>
              <p className="section-title">{config.title}</p>
              <p className="section-sub">{config.subtitle}</p>

              {config.fields.map((f) => (
                <div key={f.name}>
                  {f.hint && <div className="hint-box">{f.hint}</div>}
                  <label className="field-label" htmlFor={`offer-${f.name}`}>
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <textarea
                      id={`offer-${f.name}`}
                      className="field-input"
                      rows={3}
                      placeholder={f.placeholder}
                      value={values[f.name]}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  ) : (
                    <input
                      id={`offer-${f.name}`}
                      type={f.type || "text"}
                      className="field-input"
                      placeholder={f.placeholder}
                      value={values[f.name]}
                      onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}

              <div className="action-footer">
                <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={sending}>
                  {sending ? (
                    <>
                      <div className="spinner spinner-sm" /> Sending…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">send</span> {config.submitLabel}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
