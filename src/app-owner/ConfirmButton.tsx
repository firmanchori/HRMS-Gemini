import React, { useState } from "react";

/**
 * Standard wrapper for any state-changing action (activate, suspend,
 * approve, reject, reset password, toggle active, etc.) — the action never
 * fires on click alone, it always shows this confirmation modal first.
 */
export function ConfirmButton({
  label,
  confirmTitle,
  confirmMessage,
  confirmLabel = "Ya, Lanjutkan",
  danger,
  className,
  disabled,
  onConfirm,
}: {
  label: React.ReactNode;
  confirmTitle: string;
  confirmMessage: string;
  confirmLabel?: string;
  danger?: boolean;
  className: string;
  disabled?: boolean;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" disabled={disabled} onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50" onClick={() => !busy && setOpen(false)}>
          <div className="w-full max-w-sm bg-white rounded-xl shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-sm text-slate-900 mb-1">{confirmTitle}</h3>
            <p className="text-xs text-slate-600 mb-4">{confirmMessage}</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="text-xs font-semibold text-slate-600 px-3 py-2 disabled:opacity-60">
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={busy}
                className={`text-xs font-semibold text-white px-3 py-2 rounded-md disabled:opacity-60 ${danger ? "bg-rose-600 hover:bg-rose-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
              >
                {busy ? "Memproses..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
