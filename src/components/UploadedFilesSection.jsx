




// src/components/UploadedFilesSection.jsx
import { useEffect, useMemo, useState } from "react";
import { postDataAsync } from "../utils/apiService";

// Basit görüntü tipi kontrolü
function isImageFile(urlOrName = "") {
  const lower = String(urlOrName || "").toLowerCase();
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp")
  );
}

export default function UploadedFilesSection({
  isEmriId,
  files = [],
  loadingFiles = false,
  filesError = "",
  onFilesUpdated,
}) {
  const [localFiles, setLocalFiles] = useState(files || []);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    setLocalFiles(Array.isArray(files) ? files : []);
  }, [files]);

  const photoFiles = useMemo(() => {
    return localFiles.filter((f) => {
      const turAd = f.turAd || f.TurAd;
      const url = f.url || f.Url || "";
      const name = f.dosyaAdi || f.DosyaAdi || "";
      return turAd === "Foto" || isImageFile(url) || isImageFile(name);
    });
  }, [localFiles]);

  const otherFiles = useMemo(() => {
    return localFiles.filter((f) => !photoFiles.includes(f));
  }, [localFiles, photoFiles]);

  const totalCount = localFiles.length;

  const openDeleteModal = (file, e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setDeleteError("");
    setDeleteTarget(file);
  };

  const closeDeleteModal = () => {
    if (deleteLoading) return;
    setDeleteTarget(null);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id && !deleteTarget?.Id) {
      setDeleteError("Silinecek dosya kimliği bulunamadı.");
      return;
    }

    if (!isEmriId) {
      setDeleteError("isEmriId bulunamadı.");
      return;
    }

    try {
      setDeleteLoading(true);
      setDeleteError("");

      const dosyaId = deleteTarget.id ?? deleteTarget.Id;

      const res = await postDataAsync(
        `IsEmriDosyaEkle/${isEmriId}/remove`,
        { dosyaId }
      );

      if (Array.isArray(res?.files)) {
        setLocalFiles(res.files);
        onFilesUpdated?.(res.files);
      } else {
        const next = localFiles.filter((x) => (x.id ?? x.Id) !== dosyaId);
        setLocalFiles(next);
        onFilesUpdated?.(next);
      }

      setDeleteTarget(null);
    } catch (err) {
      console.error("Dosya silinirken hata:", err);
      setDeleteError(err?.message || "Dosya silinirken bir hata oluştu.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <div>
        <div className="mb-2 flex items-center justify-between text-xs">
          <div className="font-semibold text-zinc-700 dark:text-zinc-300">
            Yüklenmiş Dosyalar
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            Toplam: <span className="font-semibold">{totalCount}</span>
          </div>
        </div>

        {loadingFiles && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300">
            Dosyalar yükleniyor...
          </div>
        )}

        {filesError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {filesError}
          </div>
        )}

        {!loadingFiles && !filesError && totalCount === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-200 p-3 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Dosya bulunamadı.
          </div>
        )}

        {(photoFiles.length > 0 || otherFiles.length > 0) && (
          <div className="space-y-4">
            {/* FOTOĞRAFLAR */}
            {photoFiles.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  Fotoğraflar
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                  {photoFiles.map((f, idx) => {
                    const url = f.url || f.Url;
                    const name = f.dosyaAdi || f.DosyaAdi || url;
                    const fileId = f.id ?? f.Id ?? idx;

                    return (
                      <div key={fileId} className="flex flex-col">
                        <div className="relative">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative block aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={url}
                              alt={name}
                              className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                              loading="lazy"
                            />

                            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <div className="line-clamp-2 text-[11px] font-medium text-white">
                                {name}
                              </div>
                            </div>
                          </a>

                          <button
                            type="button"
                            onClick={(e) => openDeleteModal(f, e)}
                            className="absolute right-2 top-2 z-10 grid h-7 w-7 place-items-center rounded-full border border-red-200 bg-white/95 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900/90 dark:text-red-300 dark:hover:bg-zinc-800"
                            title="Dosyayı sil"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-1 break-all text-[10px] text-zinc-500 dark:text-zinc-400">
                          {url}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* BELGELER */}
            {otherFiles.length > 0 && (
              <div>
                <div className="mb-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
                  Belgeler
                </div>

                <div className="space-y-2">
                  {otherFiles.map((f, idx) => {
                    const url = f.url || f.Url;
                    const name = f.dosyaAdi || f.DosyaAdi || url;
                    const turAd = f.turAd || f.TurAd || "Belge";
                    const fileId = f.id ?? f.Id ?? idx;

                    return (
                      <div key={fileId} className="flex flex-col">
                        <div className="relative">
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 pr-12 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-zinc-900 text-[11px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                                {turAd.substring(0, 2).toUpperCase()}
                              </span>

                              <div className="min-w-0">
                                <div className="truncate font-semibold">
                                  {name}
                                </div>
                                <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                  {turAd}
                                </div>
                              </div>
                            </div>
                          </a>

                          <button
                            type="button"
                            onClick={(e) => openDeleteModal(f, e)}
                            className="absolute right-3 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-red-200 bg-white text-sm font-bold text-red-600 shadow-sm hover:bg-red-50 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-zinc-800"
                            title="Dosyayı sil"
                          >
                            ×
                          </button>
                        </div>

                        <div className="mt-1 break-all text-[10px] text-zinc-500 dark:text-zinc-400">
                          {url}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SİLME MODALI */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3"
          onClick={closeDeleteModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Dosyayı Sil
              </div>
              <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Bu işlem geri alınamaz.
              </div>
            </div>

            <div className="px-4 py-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-800 dark:bg-zinc-950/40">
                <div className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {deleteTarget.dosyaAdi ||
                    deleteTarget.DosyaAdi ||
                    deleteTarget.url ||
                    deleteTarget.Url ||
                    "Dosya"}
                </div>

                {(deleteTarget.url || deleteTarget.Url) && (
                  <div className="mt-1 break-all text-[11px] text-zinc-500 dark:text-zinc-400">
                    {deleteTarget.url || deleteTarget.Url}
                  </div>
                )}
              </div>

              {deleteError && (
                <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
                  {deleteError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Vazgeç
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}