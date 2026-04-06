import { useEffect, useState } from "react";
import { postDataAsync } from "@/utils/apiService";
import { getCookie as getClientCookie } from "@/utils/cookieService";

const DURUM_OPTIONS = [
  "Seçiniz...",
  "İncelemede",
  "Kontrol Ediliyor",
  "Tamamlandı",
];

export default function PeyzajSurecDurumuGuncelleModals({
  isOpen,
  onClose,
  isEmriId,
  alan,
  alanTitle,
  initialDurum,
  initialNot,
  onSaved,
}) {
  const [personelId, setPersonelId] = useState(null);
  const [durum, setDurum] = useState(initialDurum || "");
  const [notText, setNotText] = useState(initialNot || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setDurum(initialDurum || "");
    setNotText(initialNot || "");
    setError("");
    setSuccessMsg("");

    try {
      const c = getClientCookie("PersonelUserInfo");
      if (!c) return;
      const parsed = JSON.parse(c);
      const personel = parsed?.personel ?? parsed;
      const pid =
        personel?.id ??
        personel?.Id ??
        parsed?.id ??
        parsed?.Id ??
        null;

      if (pid != null) setPersonelId(Number(pid));
    } catch (e) {
      console.error("PersonelUserInfo parse error:", e);
      setPersonelId(null);
    }
  }, [isOpen, initialDurum, initialNot]);

  if (!isOpen) return null;
  if (!isEmriId || !alan) return null;

  const handleSubmit = async () => {
    setError("");
    setSuccessMsg("");

    if (!personelId) {
      setError("Personel bilgisi okunamadı.");
      return;
    }

    if (!durum || durum === "Seçiniz...") {
      setError("Lütfen bir süreç durumu seçin.");
      return;
    }

    try {
      setLoading(true);

      await postDataAsync(`peyzaj-is-emri-formu/${isEmriId}/surec`, {
        personelId,
        alan,
        durum,
        not: notText?.trim() || null,
      });

      setSuccessMsg("Süreç durumu güncellendi.");

      if (typeof onSaved === "function") {
        await onSaved();
      }

      setTimeout(() => {
        onClose?.();
      }, 400);
    } catch (err) {
      console.error("Peyzaj süreç durumu güncellenirken hata:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Süreç güncellenirken bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-2">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Süreç Durumu Güncelle
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {alanTitle || alan}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Kapat
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
              Durum
            </label>
            <select
              value={durum}
              onChange={(e) => setDurum(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {DURUM_OPTIONS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
              Not
            </label>
            <textarea
              rows={5}
              value={notText}
              onChange={(e) => setNotText(e.target.value)}
              placeholder="Açıklama / not girin..."
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-800 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-2 py-1 text-[11px] text-red-700 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
              {successMsg}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            İptal
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}