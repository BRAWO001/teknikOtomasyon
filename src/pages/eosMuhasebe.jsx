/* =========================================
   ✅ 1) PAGE
   Path: src/pages/gemini-json.jsx
========================================= */
import { useMemo, useState } from "react";

export default function GeminiJsonPage() {
  const [rawText, setRawText] = useState("");
  const [aciklama, setAciklama] = useState(""); // ✅ önemli
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [jsonResult, setJsonResult] = useState(null);

  const pretty = useMemo(() => {
    if (!jsonResult) return "";
    try {
      return JSON.stringify(jsonResult, null, 2);
    } catch {
      return "";
    }
  }, [jsonResult]);

  const handleGenerate = async () => {
    const t = (rawText || "").trim();
    const a = (aciklama || "").trim();

    if (!t) {
      setErr("Metin zorunlu");
      return;
    }
    if (!a) {
      setErr("Açıklama zorunlu (boş bırakma).");
      return;
    }

    setLoading(true);
    setErr(null);
    setJsonResult(null);

    try {
      const res = await fetch("/api/gemini/extract-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: t,
          aciklama: a, // ✅ gönderiyoruz
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);

      setJsonResult(data?.json ?? data);
    } catch (e) {
      setErr(e?.message || "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(pretty || "");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[14px] font-bold tracking-tight">• Fatura JSON</div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-[12px] font-semibold text-white shadow-sm
                  hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {loading ? "Üretiliyor..." : "JSON Üret"}
              </button>

              <button
                type="button"
                onClick={copyJson}
                disabled={!pretty}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-[12px] font-semibold text-zinc-700 shadow-sm
                  hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                Kopyala
              </button>
            </div>
          </div>

          {/* ✅ Açıklama inputu (zorunlu yaptık) */}
          <div className="mt-4">
            <div className="mb-1 text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">
              Açıklama (zorunlu)
            </div>
            <input
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Örn: Şubat 2026 temizlik alımı / Yönetim gideri / vb."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[13px] outline-none
                focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
                dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <div className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">Metin</div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={16}
                placeholder="Karışık fatura metnini buraya yapıştır..."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[13px] leading-relaxed outline-none
                  focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200
                  dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-zinc-600 dark:focus:ring-zinc-800"
              />

              {err ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-100">
                  {err}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-[12px] font-semibold text-zinc-700 dark:text-zinc-200">JSON</div>
              <textarea
                value={pretty}
                readOnly
                rows={16}
                placeholder="..."
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-[12px] leading-relaxed outline-none
                  dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
