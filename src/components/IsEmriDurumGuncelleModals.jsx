




// src/components/IsEmriDurumGuncelleModals.jsx
import { useEffect, useState } from "react";
import { postDataAsync } from "@/utils/apiService";

const DURUM_STEPS = [
  { value: 10, label: "10% - Beklemede" },
  { value: 20, label: "20% - İşe Başlandı" },
  { value: 50, label: "50% - Malzeme Temini" },
  { value: 60, label: "60% - Devam Ediyor" },
  { value: 75, label: "75% - Son Kontroller" },
  { value: 100, label: "100% - İş Bitti" },
];

export default function IsEmriDurumGuncelleModals({
  isOpen,
  onClose,
  isEmriId,
  isEmriKod,
  currentDurumKod,
  personelId,
  onUpdated,
}) {
  const [selectedDurum, setSelectedDurum] = useState(currentDurumKod || 10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // ✅ İş Bitti onay modali
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);

  // ✅ Hangi durum için onay açıldıysa burada tutulur
  const [pendingDurum, setPendingDurum] = useState(null);

  // Modal açılınca state reset
  useEffect(() => {
    if (isOpen) {
      setSelectedDurum(currentDurumKod || 10);
      setError("");
      setSuccessMsg("");
      setConfirmOpen(false);
      setConfirmChecked(false);
      setPendingDurum(null);
    }
  }, [isOpen, currentDurumKod]);

  const current = Number(currentDurumKod ?? 0);

  // ✅ 10'dayken sadece 20'yi aç, diğerlerini kapat.
  // ✅ current>=20 iken geriye gitme yok.
  const isStepDisabled = (stepValue) => {
    if (loading) return true;

    if (current <= 10) {
      return stepValue !== 20;
    }

    return stepValue < current;
  };

  // ✅ Tek bir fonksiyon: istenen durumu backend'e gönderir
  const submitDurum = async (durumToSend) => {
    try {
      setLoading(true);
      setError("");
      setSuccessMsg("");

      const next = Number(durumToSend);

      if (next < current) {
        setError(
          `Mevcut durum ${current}% iken daha düşük bir değere dönemezsiniz.`
        );
        return;
      }

      if (current <= 10 && next !== 20) {
        setError("Önce 20% - İşe Başlandı gönderilmelidir.");
        return;
      }

      const path = `Personeller/${personelId}/is-emirleri/${isEmriId}/durum`;
      await postDataAsync(path, { yeniDurumKod: next });

      setSuccessMsg("Durum başarıyla güncellendi.");

      if (typeof onUpdated === "function") onUpdated(next);

      setTimeout(() => onClose?.(), 500);
    } catch (err) {
      console.error("Durum güncellenirken hata:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Durum güncelleme sırasında beklenmeyen bir hata oluştu."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmClose = () => {
    if (loading) return;
    setConfirmOpen(false);
    setConfirmChecked(false);
    setPendingDurum(null);
  };

  const handleConfirmAccept = async () => {
    if (!pendingDurum) return;
    if (!confirmChecked) return;

    setConfirmOpen(false);
    setSelectedDurum(pendingDurum);

    await submitDurum(pendingDurum);
  };

  // ✅ Hooklardan sonra early return
  if (!isOpen) return null;
  if (!personelId || !isEmriId) return null;

  const handleSubmit = () => {
    if (Number(selectedDurum) === 100) {
      setPendingDurum(100);
      setConfirmChecked(false);
      setConfirmOpen(true);
      return;
    }

    submitDurum(selectedDurum);
  };

  return (
    <>
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

              {current <= 10 && (
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                  Başlamak için{" "}
                  <span className="font-semibold">20% - İşe Başlandı</span>{" "}
                  gönderilecek.
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

          {/* Liste */}
          <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
            {DURUM_STEPS.map((step) => {
              const isCurrent = step.value === currentDurumKod;
              const isSelected = step.value === selectedDurum;
              const disabled = isStepDisabled(step.value);

              return (
                <button
                  key={step.value}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    // ✅ Beklemede iken 20'ye tıklandıysa: anında backend'e gönder
                    if (current <= 10 && step.value === 20) {
                      submitDurum(20);
                      return;
                    }

                    // ✅ 100'e tıklanınca önce onay modali aç
                    if (step.value === 100) {
                      setPendingDurum(100);
                      setConfirmChecked(false);
                      setConfirmOpen(true);
                      return;
                    }

                    // ✅ Normal akış: sadece seçim yap
                    setSelectedDurum(step.value);
                  }}
                  className={[
                    "flex w-full items-center justify-between gap-2 rounded-lg border px-2 py-1.5 text-left text-xs transition",
                    "dark:border-zinc-700",
                    disabled
                      ? "cursor-not-allowed border-dashed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-500"
                      : isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                      : "border-zinc-200 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  <span>{step.label}</span>

                  <div className="flex items-center gap-2">
                    {isCurrent && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                        Mevcut
                      </span>
                    )}

                    {current <= 10 && step.value === 20 && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        Başlat
                      </span>
                    )}

                    {step.value === 100 && !disabled && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-200">
                        Onaylı
                      </span>
                    )}
                  </div>
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

          {/* Butonlar */}
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
              disabled={loading || current <= 10}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {loading ? "Kaydediliyor..." : "Durumu Güncelle"}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ 100% İş Bitti onay modali */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/70 p-3">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                İş Bitirme Onayı
              </div>
              
            </div>

            <div className="space-y-3 px-4 py-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                <div className="font-semibold">Değerli Personelimiz</div>

                <div className="mt-2">
                  Kullanılan Malzeme Durumunu kontrol edin ve eksiksiz girin.
                </div>

                <div className="mt-2">
                  Ayrıca işi anlatan detaylı notlar bıraktığınızdan emin olun.
                </div>

                <div className="mt-2">
                  İşin mesuliyeti size aittir.
                </div>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-100">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  disabled={loading}
                  className="mt-0.5 h-4 w-4 rounded border-zinc-300"
                />
                <span className="font-medium">
                  Onaylıyorum, işi eksiksiz ve doğru şekilde bitirdiğime eminim.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={loading}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Kontrol Edeceğim
              </button>

              <button
                type="button"
                onClick={handleConfirmAccept}
                disabled={loading || !confirmChecked}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? "Onaylanıyor..." : "Onayla ve Bitir"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}