import { isImageFile } from "./IsEmriDetayHelpers";

export default function IsEmriDetayDosyalar({ dosyalar = [], onAddFile }) {
  const photoFiles = dosyalar.filter(
    (f) =>
      f.turAd === "Foto" ||
      isImageFile(f.url || "") ||
      isImageFile(f.dosyaAdi || "")
  );
  const belgeFiles = dosyalar.filter((f) => !photoFiles.includes(f));

  return (
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
              <div
                key={f.id}
                className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-[10px] dark:border-zinc-700 dark:bg-zinc-950/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.dosyaAdi || "Fotoğraf"}
                  className="h-30 w-full object-cover"
                  loading="lazy"
                />
              </div>
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
  );
}
