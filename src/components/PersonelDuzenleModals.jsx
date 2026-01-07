// src/components/PersonelDuzenleModals.jsx
import { useEffect, useState } from "react";
import { getDataAsync, postDataAsync } from "../utils/apiService";

function initials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

/**
 * PersonelDuzenleModals
 *
 * Props:
 * - isOpen
 * - onClose
 * - isEmriId
 * - isEmriKod?
 */
export default function PersonelDuzenleModals({
  isOpen,
  onClose,
  isEmriId,
  isEmriKod,
}) {
  const [personeller, setPersoneller] = useState([]);
  const [personelLoading, setPersonelLoading] = useState(false);
  const [personelError, setPersonelError] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  // ESC ile kapatma
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Modal açıldığında personeller + mevcut atamalar
  useEffect(() => {
    if (!isOpen || !isEmriId) return;

    const loadAll = async () => {
      setPersonelError("");
      setSaveError("");
      setSaveSuccess("");
      setSelectedIds([]); // farklı iş emirleri arasında eski seçim kalmasın

      try {
        setPersonelLoading(true);
        const all = await getDataAsync(
          "Personeller/ByDurum?rolKod=30&aktifMi=true"
        );
        setPersoneller(Array.isArray(all) ? all : []);
      } catch (err) {
        console.error("Personel listesi alınırken hata:", err);
        setPersonelError(
          err?.message || "Personel listesi alınırken bir hata oluştu."
        );
      } finally {
        setPersonelLoading(false);
      }

      try {
        setLoadingAssigned(true);
        // İş emrine atanmış personeller (sadece Id'leri çekip seçime yansıtıyoruz)
        // DİKKAT: Artık burası Personeller/... (is-emirleri değil)
        const assigned = await getDataAsync(
          `Personeller/${isEmriId}/personeller`
        );
        const ids =
          Array.isArray(assigned) && assigned.length > 0
            ? assigned
                .map((p) => p.personelId || p.personel?.id)
                .filter(Boolean)
            : [];
        setSelectedIds(ids);
      } catch (err) {
        console.error("Atanan personeller alınırken hata:", err);
        // Sessiz geçebilir
      } finally {
        setLoadingAssigned(false);
      }
    };

    loadAll();
  }, [isOpen, isEmriId]);

  const togglePersonel = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
    const handleCloseAndReload = () => {
      onClose?.();
      window.location.reload();
    };


  const handleSave = async () => {
    setSaveError("");
    setSaveSuccess("");

    try {
      setSaving(true);

      // Backend'e TAM SET gönderiyoruz:
      // selectedIds boş ise, backend o iş emrine bağlı tüm personelleri silecek.
      const body = selectedIds.map((pid) => ({ personelId: pid }));

      // POST: api/Personeller/{isEmriId}/personeller
      await postDataAsync(`Personeller/${isEmriId}/personeller`, body);

      setSaveSuccess("Personel atamaları güncellendi.");
    } catch (err) {
      console.error("Personel kaydedilirken hata:", err);
      setSaveError(
        err?.message ||
          "Personel atamaları kaydedilirken bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black p-2"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Personel Düzenle
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {isEmriKod
                ? `${isEmriKod} (ID: ${isEmriId})`
                : `İş Emri ID: ${isEmriId}`}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseAndReload}
            className="rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Kapat
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
          <div className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Bu ekrandan iş emrine atanacak personelleri seçebilirsin. Birden
            fazla personel seçilebilir. Kaydedince, seçili olmayanlar iş emrinden
            kaldırılır.
          </div>

          {personelLoading && (
            <div className="mb-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
              Personeller yükleniyor...
            </div>
          )}

          {personelError && (
            <div className="mb-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {personelError}
            </div>
          )}

          {loadingAssigned && (
            <div className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
              Atanan personeller getiriliyor...
            </div>
          )}

          {!personelLoading && personeller.length === 0 && !personelError && (
            <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              Kayıtlı personel bulunamadı.
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {personeller.map((p) => {
              const id = p.id;
              const adSoyad =
                p.adSoyad || `${p.ad || ""} ${p.soyad || ""}`.trim();
              const selected = selectedIds.includes(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => togglePersonel(id)}
                  className={[
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition",
                    selected
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-zinc-900 text-[10px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                    {initials(adSoyad || `P${id}`)}
                  </span>
                  <span>{adSoyad || `Personel #${id}`}</span>
                </button>
              );
            })}
          </div>

          {/* Hata / başarı ve kaydet butonu */}
          <div className="mt-4 border-t border-dashed border-zinc-200 pt-3 text-xs dark:border-zinc-800">
            {saveError && (
              <div className="mb-2 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                {saveError}
              </div>
            )}
            {saveSuccess && (
              <div className="mb-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                {saveSuccess}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Seçilen personel:{" "}
                <span className="font-semibold">
                  {selectedIds.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
