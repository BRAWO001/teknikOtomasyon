import { useState } from "react";
import { isImageFile } from "./IsEmriDetayHelpers";

export default function IsEmriDetayDosyalar({ dosyalar = [], onAddFile }) {
  const [selectedImage, setSelectedImage] = useState(null);

  const photoFiles = dosyalar.filter(
    (f) =>
      f.turAd === "Foto" ||
      isImageFile(f.url || "") ||
      isImageFile(f.dosyaAdi || "")
  );

  const belgeFiles = dosyalar.filter((f) => !photoFiles.includes(f));

  const closeModal = () => setSelectedImage(null);

  return (
    <>
      <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
            Belgeler / Fotoğraflar
          </div>

          <button
            type="button"
            onClick={onAddFile}
            className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 print:hidden"
          >
            Belge / Foto ekle
          </button>
        </div>

        {photoFiles.length > 0 && (
          <div className="mb-1">
            <div className="mb-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
              Fotoğraflar
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {photoFiles.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    setSelectedImage({
                      url: f.url,
                      dosyaAdi: f.dosyaAdi || "Fotoğraf",
                    })
                  }
                  className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-[10px] cursor-pointer dark:border-zinc-700 dark:bg-zinc-950/40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={f.url}
                    alt={f.dosyaAdi || "Fotoğraf"}
                    className="h-30 w-full object-cover transition hover:scale-[1.02]"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {belgeFiles.length > 0 && (
          <div className="mt-1">
            <div className="mb-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
              Belgeler
            </div>

            <ul className="space-y-0.5">
              {belgeFiles.map((f) => (
                <li
                  key={f.id}
                  className="truncate text-[11px] text-zinc-700 dark:text-zinc-200"
                >
                  • {f.dosyaAdi || f.url || `Belge #${f.id}`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {photoFiles.length === 0 && belgeFiles.length === 0 && (
          <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            Dosya eklenmemiş.
          </div>
        )}
      </div>

      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-5xl rounded-xl bg-white p-3 shadow-2xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {selectedImage.dosyaAdi}
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Kapat
              </button>
            </div>

            <div className="flex max-h-[80vh] items-center justify-center overflow-auto rounded-lg bg-zinc-100 p-2 dark:bg-zinc-950">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.url}
                alt={selectedImage.dosyaAdi}
                className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}