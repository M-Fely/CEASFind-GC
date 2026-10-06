import { createContext, useCallback, useContext, useState } from "react";

// Promise-based replacement for the appAlert/appConfirm helpers each HTML page
// used to define: `await dialog.alert(...)`, `if (await dialog.confirm(...))`.
const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const open = useCallback(
    (options) => new Promise((resolve) => setDialog({ ...options, resolve })),
    [],
  );

  const alert = useCallback(
    (title, message, icon = "info") => open({ kind: "alert", title, message, icon }),
    [open],
  );

  const confirm = useCallback(
    (title, message, { icon = "help", danger = false, confirmLabel = "Confirm" } = {}) =>
      open({ kind: "confirm", title, message, icon, danger, confirmLabel }),
    [open],
  );

  const close = (result) => {
    dialog.resolve(result);
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {dialog && (
        <div className="dialog-overlay" role="dialog" aria-modal="true">
          <div className="dialog-box">
            <span className="material-symbols-outlined dialog-icon">{dialog.icon}</span>
            <div className="dialog-title">{dialog.title}</div>
            {dialog.message && <div className="dialog-message">{dialog.message}</div>}
            <div className="dialog-actions">
              {dialog.kind === "confirm" ? (
                <>
                  <button className="dialog-btn dialog-btn-cancel" onClick={() => close(false)}>
                    Cancel
                  </button>
                  <button
                    className={`dialog-btn dialog-btn-confirm${dialog.danger ? " danger" : ""}`}
                    onClick={() => close(true)}
                    autoFocus
                  >
                    {dialog.confirmLabel}
                  </button>
                </>
              ) : (
                <button className="dialog-btn dialog-btn-ok" onClick={() => close()} autoFocus>
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  return useContext(DialogContext);
}
