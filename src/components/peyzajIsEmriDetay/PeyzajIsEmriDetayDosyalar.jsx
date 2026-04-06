import { isImageFile } from "./PeyzajIsEmriDetayHelpers";

export default function PeyzajIsEmriDetayDosyalar({
  dosyalar = [],
  onAddFile,
}) {
  const canEdit = typeof onAddFile === "function";

  const normalizedFiles = (dosyalar || []).map((f, idx) => ({
    id: f.id ?? f.Id ?? idx,
    url: f.url ?? f.Url ?? "",
    dosyaAdi: f.dosyaAdi ?? f.DosyaAdi ?? "",
    turAd: f.turAd ?? f.TurAd ?? "",
  }));

  const photoFiles = normalizedFiles.filter(
    (f) =>
      f.turAd === "Foto" ||
      isImageFile(f.url || "") ||
      isImageFile(f.dosyaAdi || "")
  );

  const belgeFiles = normalizedFiles.filter((f) => !photoFiles.includes(f));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Belgeler / Fotoğraflar
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={onAddFile}
            className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 print:hidden"
          >
            Belge / Foto Düzenle
          </button>
        )}
      </div>

      {photoFiles.length > 0 && (
        <div className="mb-1">
          <div className="mb-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            Fotoğraflar
          </div>

          <div className="grid grid-cols-2 gap-1.5 md:grid-cols-4">
            {photoFiles.map((f) => (
              <a
                key={f.id}
                href={f.url}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-[10px] transition hover:opacity-95 dark:border-zinc-700 dark:bg-zinc-950/40"
                title={f.dosyaAdi || "Fotoğraf"}
              >
                <img
                  src={f.url}
                  alt={f.dosyaAdi || "Fotoğraf"}
                  className="h-28 w-full object-cover object-center"
                  loading="lazy"
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {belgeFiles.length > 0 && (
        <div className="mt-1">
          <div className="mb-1 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
            Belgeler
          </div>

          <ul className="space-y-1">
            {belgeFiles.map((f) => (
              <li key={f.id}>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900"
                  title={f.dosyaAdi || f.url || `Belge #${f.id}`}
                >
                  • {f.dosyaAdi || f.url || `Belge #${f.id}`}
                </a>
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