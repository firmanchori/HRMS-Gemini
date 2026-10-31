import React, { useEffect, useState } from "react";
import { api, ApiError, type PaymentVerificationRow } from "./api";
import { ConfirmButton } from "./ConfirmButton";

function StatusBadge({ status }: { status: PaymentVerificationRow["status"] }) {
  const styles: Record<PaymentVerificationRow["status"], string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Rejected: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${styles[status]}`}>{status}</span>;
}

export function PaymentVerificationTab() {
  const [rows, setRows] = useState<PaymentVerificationRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setRows(await api.listPaymentVerifications());
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id: string) {
    setBusyId(id);
    setNotice(null);
    try {
      await api.approvePaymentVerification(id);
      setNotice("Pembayaran disetujui, tenant diaktifkan.");
      await load();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Terjadi kesalahan");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    if (!reason.trim()) return;
    setBusyId(id);
    setNotice(null);
    try {
      await api.rejectPaymentVerification(id, reason);
      setNotice("Verifikasi ditolak, tenant diberi tahu lewat email.");
      setRejectingId(null);
      setReason("");
      await load();
    } catch (err) {
      setNotice(err instanceof ApiError ? err.message : "Terjadi kesalahan");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      {notice && <div className="mb-4 text-xs bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-lg p-2.5">{notice}</div>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-slate-800 text-sm">
                  {r.tenantName} <span className="text-slate-400 font-normal">({r.subdomain})</span>
                </div>
                <div className="text-xs text-slate-500">Paket: {r.planName ?? "-"} &middot; Rp {r.amountIdr.toLocaleString("id-ID")}</div>
              </div>
              <StatusBadge status={r.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
              <div>
                <span className="text-slate-400">Bank:</span> <span className="font-medium text-slate-700">{r.bankName}</span>
              </div>
              <div>
                <span className="text-slate-400">No. Referensi:</span>{" "}
                <span className="font-mono font-medium text-slate-700">{r.referenceNumber}</span>
              </div>
            </div>
            {r.note && <p className="text-xs text-slate-500 mt-2 bg-slate-50 rounded-lg p-2">{r.note}</p>}
            {r.rejectionReason && (
              <p className="text-xs text-rose-700 mt-2 bg-rose-50 border border-rose-200 rounded-lg p-2">
                Alasan ditolak: {r.rejectionReason}
              </p>
            )}

            {r.status === "Pending" && (
              <div className="mt-3 flex items-center gap-2">
                <ConfirmButton
                  disabled={busyId === r.id}
                  label="Setujui & Aktifkan"
                  confirmTitle="Setujui Pembayaran Ini?"
                  confirmMessage={`Tenant ${r.tenantName} akan langsung diaktifkan setelah pembayaran ini disetujui.`}
                  onConfirm={() => approve(r.id)}
                  className="text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-1.5 disabled:opacity-60"
                />
                {rejectingId === r.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Alasan penolakan..."
                      className="flex-1 text-xs border border-slate-300 rounded-md px-2 py-1.5"
                    />
                    <ConfirmButton
                      disabled={busyId === r.id || !reason.trim()}
                      label="Kirim"
                      confirmTitle="Tolak Verifikasi Ini?"
                      confirmMessage={`Tenant ${r.tenantName} akan diberi tahu lewat email bahwa pembayaran mereka ditolak dengan alasan yang Anda tulis.`}
                      confirmLabel="Ya, Tolak"
                      danger
                      onConfirm={() => reject(r.id)}
                      className="text-[11px] font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-md px-3 py-1.5 disabled:opacity-60"
                    />
                    <button onClick={() => setRejectingId(null)} className="text-[11px] text-slate-500">
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setRejectingId(r.id)}
                    className="text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md px-3 py-1.5"
                  >
                    Tolak
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <div className="text-xs text-slate-400 p-4">Belum ada pengajuan verifikasi pembayaran.</div>}
      </div>
    </div>
  );
}
