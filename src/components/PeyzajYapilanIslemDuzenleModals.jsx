import { useEffect, useMemo, useState } from "react";
import { getDataAsync, postDataAsync } from "../utils/apiService";

export default function PeyzajYapilanIslemDuzenleModals({
  isOpen,
  onClose,
  peyzajIsEmriId,
  peyzajIsEmriKod,
}) {
  const [islemListesi, setIslemListesi] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [loadingList, setLoadingList] = useState(false);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !peyzajIsEmriId) return;

    const loadAll = async () => {
      setError("");
      setSaveSuccess("");
      setSelectedIds([]);

      try {
        setLoadingList(true);
        const all = await getDataAsync(
          `peyzaj-is-emri-formu/islem-tanimlari?sadeceAktif=true`
        );
        setIslemListesi(Array.isArray(all) ? all : []);
      } catch (err) {
        console.error("İşlem tanımları alınırken hata:", err);
        setError(
          err?.message || "İşlem tanımları alınırken bir hata oluştu."
        );
      } finally {
        setLoadingList(false);
      }

      try {
        setLoadingSelected(true);
        const assigned = await getDataAsync(
          `peyzaj-is-emri-formu/${peyzajIsEmriId}/yapilan-islemler-secim`
        );

        const ids =
          Array.isArray(assigned) && assigned.length > 0
            ? assigned
                .map((x) => x.peyzajIslemId ?? x.PeyzajIslemId)
                .filter(Boolean)
            : [];

        setSelectedIds(ids);
      } catch (err) {
        console.error("Seçili işlemler alınırken hata:", err);
      } finally {
        setLoadingSelected(false);
      }
    };

    loadAll();
  }, [isOpen, peyzajIsEmriId]);

  const toggleItem = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setError("");
    setSaveSuccess("");

    try {
      setSaving(true);

      const body = selectedIds.map((id) => ({
        peyzajIslemId: id,
      }));

      await postDataAsync(
        `peyzaj-is-emri-formu/${peyzajIsEmriId}/yapilan-islemler-set`,
        body
      );

      setSaveSuccess("Yapılan işlemler güncellendi.");
      setTimeout(() => {
        window.location.reload();
      }, 400);
    } catch (err) {
      console.error("Yapılan işlemler kaydedilirken hata:", err);
      setError(
        err?.message ||
          "Yapılan işlemler kaydedilirken bir hata oluştu."
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedCount = useMemo(() => selectedIds.length, [selectedIds]);

  const getItemTheme = (isinAdi = "", checked = false) => {
    const text = String(isinAdi).trim().toLowerCase();

    const isPeyzaj = text.startsWith("[peyzaj]");
    const isHavuz = text.startsWith("[havuz]");

    if (isPeyzaj) {
      return checked
        ? {
            wrapper:
              "border-emerald-300 bg-emerald-50 shadow-[0_0_0_1px_rgba(16,185,129,0.06)] dark:border-emerald-800 dark:bg-emerald-950/25",
            badge:
              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
            checkbox:
              "accent-emerald-600",
          }
        : {
            wrapper:
              "border-emerald-100 bg-emerald-50/55 hover:bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/10 dark:hover:bg-emerald-950/20",
            badge:
              "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
            checkbox:
              "accent-emerald-600",
          };
    }

    if (isHavuz) {
      return checked
        ? {
            wrapper:
              "border-sky-300 bg-sky-50 shadow-[0_0_0_1px_rgba(14,165,233,0.06)] dark:border-sky-800 dark:bg-sky-950/25",
            badge:
              "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
            checkbox:
              "accent-sky-600",
          }
        : {
            wrapper:
              "border-sky-100 bg-sky-50/55 hover:bg-sky-50 dark:border-sky-900/60 dark:bg-sky-950/10 dark:hover:bg-sky-950/20",
            badge:
              "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
            checkbox:
              "accent-sky-600",
          };
    }

    return checked
      ? {
          wrapper:
            "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/40",
          badge:
            "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
          checkbox:
            "accent-zinc-700",
        }
      : {
          wrapper:
            "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50",
          badge:
            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
          checkbox:
            "accent-zinc-700",
        };
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-black/70 p-2"
      onClick={onClose}
    >
      <div
        className="relative flex h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Yapılan İşlem Düzenle
            </div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {peyzajIsEmriKod
                ? `${peyzajIsEmriKod} (ID: ${peyzajIsEmriId})`
                : `Peyzaj İş Emri ID: ${peyzajIsEmriId}`}
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

        <div className="flex flex-1 flex-col overflow-y-auto px-4 py-4">
          <div className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Bu ekrandan iş emrine ait yapılan işlemleri seçebilirsin.
            Kaydet dediğinde seçilmeyen eski kayıtlar kaldırılır, seçilenler yeniden eklenir.
          </div>

          <div className="mb-3 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
            <span className="text-zinc-600 dark:text-zinc-300">
              Seçili işlem sayısı
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedCount}
            </span>
          </div>

          {(loadingList || loadingSelected) && (
            <div className="mb-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
              Veriler yükleniyor...
            </div>
          )}

          {error && (
            <div className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          )}

          {saveSuccess && (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
              {saveSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {islemListesi.map((item) => {
              const id = item?.id ?? item?.Id;
              const isinAdi = item?.isinAdi ?? item?.IsinAdi ?? `İşlem #${id}`;
              const checked = selectedIds.includes(id);
              const theme = getItemTheme(isinAdi, checked);

              return (
                <label
                  key={id}
                  className={`cursor-pointer rounded-xl border p-3 transition ${theme.wrapper}`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleItem(id)}
                      className={`mt-0.5 h-4 w-4 ${theme.checkbox}`}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {isinAdi}
                        </div>


                       
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
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