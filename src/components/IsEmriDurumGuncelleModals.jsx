// src/components/IsEmriDurumGuncelleModals.jsx
import { useEffect, useState } from "react";
import { postDataAsync } from "@/utils/apiService";

// Backend enum ile uyumlu adımlar (10,20,30,50,60,75,90,100)
const DURUM_STEPS = [
  { value: 10, label: "10% - Beklemede" },
  { value: 20, label: "20% - İşe Başlandı" },
  { value: 50, label: "50% - Malzeme Temini" },
  { value: 60, label: "60% - Devam Ediyor" },
  { value: 75, label: "75% - Son Kontroller" },
  { value: 90, label: "90% - Bitmek Üzere" },
  { value: 100, label: "100% - İş Bitti" },
];

export default function IsEmriDurumGuncelleModals({
  isOpen,
  onClose,
  isEmriId,
  isEmriKod,
  currentDurumKod,
  personelId,
  onUpdated, // optional: parent listeyi yenilesin diye
}) {
  const [selectedDurum, setSelectedDurum] = useState(currentDurumKod || 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal her açıldığında mevcut duruma göre seçimi yenile
  useEffect(() => {
    if (isOpen) {
      setSelectedDurum(currentDurumKod || 10);
      setError("");
      setSuccessMsg("");
    }
  }, [isOpen, currentDurumKod]);

  if (!isOpen) return null;
  if (!personelId || !isEmriId) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMsg("");

      // Geriye gitmeye çalışma kontrolünü front-end'de de yapalım
      const current = Number(currentDurumKod || 0);
      if (selectedDurum < current) {
        setError(
          `Mevcut durum ${current}% iken daha düşük bir değere dönemezsiniz.`
        );
        setLoading(false);
        return;
      }

      const path = `Personeller/${personelId}/is-emirleri/${isEmriId}/durum`;

      // Backend JSON case-insensitive ama yine de düzgün gönderelim
      await postDataAsync(path, { yeniDurumKod: selectedDurum });

      setSuccessMsg("Durum başarıyla güncellendi.");
      if (typeof onUpdated === "function") {
        onUpdated(selectedDurum);
      }

      // Küçük bir gecikmeyle modal kapat
      setTimeout(() => {
        onClose?.();
      }, 800);
    } catch (err) {
      console.error("Durum güncellenirken hata:", err);
      setError(
        err?.message || "Durum güncelleme sırasında beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black p-2">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Başlık */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              İş İlerleme Durumu
            </p>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {isEmriKod || `İş Emri #${isEmriId}`}
            </p>
            {typeof currentDurumKod === "number" && (
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                Mevcut durum:{" "}
                <span className="font-semibold">{currentDurumKod}%</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Kapat
          </button>
        </div>

        {/* Durum seçim listesi */}
        <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
          {DURUM_STEPS.map((step) => {
            const isCurrent = step.value === currentDurumKod;
            const isSelected = step.value === selectedDurum;
            const isDisabled =
              typeof currentDurumKod === "number" &&
              step.value < currentDurumKod; // geriye gitme yok

            return (
              <button
                key={step.value}
                type="button"
                disabled={isDisabled || loading}
                onClick={() => setSelectedDurum(step.value)}
                className={[
                  "flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition",
                  "dark:border-zinc-700",
                  isDisabled
                    ? "cursor-not-allowed border-dashed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500"
                    : isSelected
                    ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <span>{step.label}</span>
                {isCurrent && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                    Mevcut
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Hata / başarı */}
        <div className="mt-2 space-y-1 text-[11px]">
          {error && (
            <p className="rounded-md bg-red-50 px-2 py-1 text-red-700 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          )}
          {successMsg && (
            <p className="rounded-md bg-emerald-50 px-2 py-1 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
              {successMsg}
            </p>
          )}
        </div>

        {/* Alt butonlar */}
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {loading ? "Kaydediliyor..." : "Durumu Güncelle"}
          </button>
        </div>
      </div>
    </div>
  );
}
