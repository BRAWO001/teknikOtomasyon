import { useEffect, useMemo, useState } from "react";

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

export default function PeyzajUploadedFilesSection({
  files = [],
  loadingFiles = false,
  filesError = "",
}) {
  const [localFiles, setLocalFiles] = useState(files || []);

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

  return (
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
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
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

                      <div className="mt-1 break-all text-[10px] text-zinc-500 dark:text-zinc-400">
                        {url}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
                    <a
                      key={fileId}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-3 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-200 dark:ring-blue-900">
                            {turAd}
                          </span>
                        </div>

                        <div className="mt-1 break-all text-[11px] font-medium text-zinc-800 dark:text-zinc-100">
                          {name}
                        </div>

                        <div className="mt-1 break-all text-[10px] text-zinc-500 dark:text-zinc-400">
                          {url}
                        </div>
                      </div>

                      <div className="shrink-0 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                        Aç
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}