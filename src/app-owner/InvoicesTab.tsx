import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, type Invoice } from "./api";
import { ConfirmButton } from "./ConfirmButton";

function StatusBadge({ status }: { status: Invoice["status"] }) {
  const styles: Record<Invoice["status"], string> = {
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const labels: Record<Invoice["status"], string> = { Pending: "Belum Lunas", Paid: "Lunas", Cancelled: "Dibatalkan" };
  return <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${styles[status]}`}>{labels[status]}</span>;
}

export function InvoiceDetailModal({ invoice, onClose, onChanged }: { invoice: Invoice; onClose: () => void; onChanged: () => void }) {
  async function markPaid() {
    await api.markInvoicePaid(invoice.id);
    onChanged();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm">{invoice.tenantName ?? "Invoice"}</h3>
            <p className="text-xs text-slate-300">
              {new Date(invoice.periodStart).toLocaleDateString("id-ID")} – {new Date(invoice.periodEnd).toLocaleDateString("id-ID")}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-1 text-xs">
            {invoice.lineItems.map((li, i) => (
              <div key={i} className="flex justify-between">
                <span className={li.amountIdr < 0 ? "text-emerald-700" : "text-slate-600"}>{li.description}</span>
                <span className={li.amountIdr < 0 ? "text-emerald-700" : "text-slate-700"}>
                  {li.amountIdr < 0 ? "- " : ""}Rp {Math.abs(li.amountIdr).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-sm pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>Rp {invoice.totalAmountIdr.toLocaleString("id-ID")}</span>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <StatusBadge status={invoice.status} />
            {invoice.status === "Pending" && (
              <ConfirmButton
                label="Tandai Lunas"
                confirmTitle="Tandai Invoice Ini Lunas?"
                confirmMessage={`Invoice ${invoice.tenantName ?? ""} senilai Rp ${invoice.totalAmountIdr.toLocaleString("id-ID")} akan ditandai sudah dibayar.`}
                onConfirm={markPaid}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-3 py-1.5"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function InvoicesTab() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  async function load() {
    const invoices = await api.listAllInvoices();
    setRows(invoices);
    if (detailInvoice) setDetailInvoice(invoices.find((i) => i.id === detailInvoice.id) ?? null);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Tenant</th>
              <th className="text-left px-4 py-2.5 font-semibold">Periode</th>
              <th className="text-left px-4 py-2.5 font-semibold">Total</th>
              <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((inv) => (
              <tr key={inv.id} onClick={() => setDetailInvoice(inv)} className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer">
                <td className="px-4 py-2.5 font-semibold text-slate-800">{inv.tenantName ?? "-"}</td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">
                  {new Date(inv.periodStart).toLocaleDateString("id-ID")} – {new Date(inv.periodEnd).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-2.5 font-mono text-slate-700">Rp {inv.totalAmountIdr.toLocaleString("id-ID")}</td>
                <td className="px-4 py-2.5"><StatusBadge status={inv.status} /></td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{new Date(inv.createdAt).toLocaleDateString("id-ID")}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-xs">
                  Belum ada invoice yang dibuat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {detailInvoice && <InvoiceDetailModal invoice={detailInvoice} onClose={() => setDetailInvoice(null)} onChanged={load} />}
    </div>
  );
}
