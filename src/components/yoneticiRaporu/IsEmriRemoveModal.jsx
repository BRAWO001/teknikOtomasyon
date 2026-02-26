import { useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

function safeText(v) {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  return s.length ? s : "-";
}

export default function IsEmriRemoveModal({ isOpen, onClose, onDeleted }) {
  if (!isOpen) return null;

  const [kod, setKod] = useState("");
  const [single, setSingle] = useState(null);

  const [loadingGet, setLoadingGet] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [err, setErr] = useState("");

 

  const close = () => {
    setErr("");
    setKod("");
    setSingle(null);
    setLoadingGet(false);
    setLoadingDelete(false);
    onClose?.();
  };

  const getByKod = async () => {
    const k = (kod ?? "").trim();
    if (!k) return;

    setErr("");
    setSingle(null);
    setLoadingGet(true);

    try {
      const res = await getDataAsync(`is-emirleri/by-kod?kod=${encodeURIComponent(k)}`);
      setSingle(res || null);
    } catch (e) {
      console.error(e);
      setSingle(null);
      const status = e?.response?.status;
      setErr(status === 404 ? "Kod bulunamadı." : "Getirme hatası oluştu.");
    } finally {
      setLoadingGet(false);
    }
  };

  const removeByKod = async () => {
    const sureKod = (single?.kod ?? single?.Kod ?? kod ?? "").trim();
    if (!sureKod) return;

   

    const ok = window.confirm(`${sureKod} kodlu iş emrini SİLMEK istiyor musun?`);
    if (!ok) return;

    setErr("");
    setLoadingDelete(true);

    try {
      await postDataAsync(`is-emirleri/remove`, {
        kod: sureKod,
        reason: "Yönetici raporu üzerinden silindi",
      });

      onDeleted?.();
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      setErr(
        status === 401
          ? "401: Token yok/expired."
          : status === 403
          ? "403: Yetkin yok."
          : status
          ? `Silme hatası: ${status}`
          : "Silme hatası oluştu."
      );
    } finally {
      setLoadingDelete(false);
    }
  };

  const busy = loadingGet || loadingDelete;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      <div className="relative w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-extrabold text-zinc-800 dark:text-zinc-100">
            İş Emri Silme (Kod ile)
          </div>

          <button
            type="button"
            onClick={close}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-[12px] font-bold text-zinc-700 hover:bg-zinc-50
                       dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            ✕ Kapat
          </button>
        </div>

        {err ? (
          <div className="mt-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-100">
            {err}
          </div>
        ) : null}

        {/* Kod ile getir */}
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
          <input
            value={kod}
            onChange={(e) => setKod(e.target.value)}
            placeholder="EOS-XXX-... kod"
            className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-[13px] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />

          <button
            type="button"
            disabled={busy || !kod.trim()}
            onClick={getByKod}
            className="h-9 rounded-md bg-indigo-600 px-3 text-[12px] font-extrabold text-white disabled:opacity-50"
          >
            {loadingGet ? "Getiriliyor…" : "Getir"}
          </button>
        </div>

        {/* Sonuç */}
        <div className="mt-3 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
          {single ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[12px] font-extrabold text-zinc-800 dark:text-zinc-100">
                    {safeText(single.kod ?? single.Kod)}
                  </div>
                  <div className="text-[12px] text-zinc-600 dark:text-zinc-300">
                    {safeText(single.kisaBaslik ?? single.KisaBaslik)}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={removeByKod}
                  className="rounded-md bg-red-600 px-3 py-2 text-[12px] font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loadingDelete ? "Siliniyor…" : "🗑 Sil"}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-[12px] text-zinc-500 dark:text-zinc-400">
              Kod giriniz ve "Getir" butonuna basınız.
            </div>
          )}
        </div>

        <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
          Not: Silme işlemi geri alınamaz.
        </div>
      </div>
    </div>
  );
}