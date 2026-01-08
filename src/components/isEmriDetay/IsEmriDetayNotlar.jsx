import { formatTR, initials } from "./IsEmriDetayHelpers";

export default function IsEmriDetayNotlar({ notlar = [], onAddNote }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-3 text-[11px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200">
          Tüm Notlar
        </div>

        <button
          type="button"
          onClick={onAddNote}
          className="rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] text-zinc-500 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 print:hidden"
        >
          Not ekle
        </button>
      </div>

      {notlar.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 p-2 text-[11px] text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          Bu iş emri için not eklenmemiş.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
          {notlar.map((n) => {
            const fullName = `${n?.personel?.ad ?? ""} ${n?.personel?.soyad ?? ""}`.trim();
            return (
              <div
                key={n.id}
                className="rounded-lg bg-zinc-50 p-2 text-[11px] text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
              >
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                      {fullName ? initials(fullName) : "?"}
                    </span>
                    <span className="max-w-[200px] truncate font-semibold">
                      {fullName || "Bilinmeyen Personel"}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {formatTR(n.olusturmaTarihiUtc)}
                  </span>
                </div>

                <div className="text-[11px] leading-snug text-zinc-700 dark:text-zinc-200">
                  {n.metin}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
