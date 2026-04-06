import { useEffect, useState } from "react";
import { postDataAsync } from "../utils/apiService";

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split(";").map((p) => p.trim());
  const found = parts.find((p) => p.startsWith(`${name}=`));
  if (!found) return null;
  return decodeURIComponent(found.split("=").slice(1).join("="));
}

export default function PeyzajNotEkleModals({
  isOpen,
  onClose,
  isEmriId,
  isEmriKod,
}) {
  const [currentPersonelId, setCurrentPersonelId] = useState(null);
  const [metin, setMetin] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    setMetin("");
    setError("");
    setSuccess("");
    setCurrentPersonelId(null);

    try {
      const raw = getCookie("PersonelUserInfo");
      if (!raw) return;

      const obj = JSON.parse(raw);

      const pid =
        obj?.id ??
        obj?.Id ??
        obj?.personelId ??
        obj?.PersonelId ??
        obj?.personel?.id ??
        obj?.personel?.Id ??
        null;

      if (pid != null) {
        setCurrentPersonelId(Number(pid));
      }
    } catch {
      // ignore
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setError("");
    setSuccess("");

    if (!currentPersonelId) {
      setError("Personel bilgisi bulunamadı.");
      return;
    }

    if (!metin.trim()) {
      setError("Not metni zorunlu.");
      return;
    }

    try {
      setSaving(true);

      await postDataAsync(`peyzaj-is-emri-formu/${isEmriId}/notlar`, {
        personelId: currentPersonelId,
        metin: metin.trim(),
      });

      setSuccess("Not eklendi.");

      setTimeout(() => {
        window.location.reload();
      }, 350);
    } catch (err) {
      console.error("Peyzaj not eklenirken hata:", err);
      setError(err?.message || "Not eklenirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/70 p-2"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Not Ekle
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {isEmriKod ? `${isEmriKod} (ID: ${isEmriId})` : `İş Emri ID: ${isEmriId}`}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>
        </div>

        <div className="p-4">
          <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
            Bu not seçili peyzaj iş emrine eklenecek.
          </div>

          <textarea
            value={metin}
            onChange={(e) => setMetin(e.target.value)}
            rows={6}
            placeholder="Notunuzu yazın..."
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {success}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg border border-zinc-900 bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}