import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Send } from "lucide-react";
import { api, ApiError } from "./api";

export function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.submitContact(form);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengirim pesan, coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h1 className="font-bold text-slate-900 mb-1">Pesan Terkirim</h1>
          <p className="text-sm text-slate-600 mb-4">Tim kami akan membalas lewat email secepatnya.</p>
          <a href="/" className="text-xs font-semibold text-indigo-600 hover:underline">&larr; Kembali ke Beranda</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-md">
      <a href="/" className="block text-center text-xs text-slate-400 hover:text-slate-200 mb-3">&larr; Kembali ke Beranda</a>
      <form onSubmit={handleSubmit} className="w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 bg-slate-900 text-white border-b border-slate-800">
          <h1 className="font-extrabold text-base">Hubungi Kami</h1>
          <p className="text-xs text-slate-400 mt-1">Pertanyaan tentang paket, demo, atau dukungan teknis.</p>
        </div>
        <div className="p-6 space-y-3.5">
          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nama</label>
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subjek</label>
            <input
              required
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pesan</label>
            <textarea
              required
              rows={4}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              className="w-full rounded-md border border-slate-300 py-2 px-3 text-sm focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? "Mengirim..." : <>Kirim Pesan <Send className="w-4 h-4" /></>}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
