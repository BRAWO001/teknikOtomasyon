function formatTR(date) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleString("tr-TR");
  } catch {
    return "-";
  }
}

function initials(name = "") {
  const parts = name.trim().split(" ").filter(Boolean);
  const a = parts[0]?.[0] ?? "";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default function PeyzajIsEmriDetayNotlar({ notlar = [], onAddNote }) {
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
        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
          {notlar.map((n) => {
            const personel = n?.personel || n?.Personel || null;
            const fullName = `${personel?.ad ?? personel?.Ad ?? ""} ${personel?.soyad ?? personel?.Soyad ?? ""}`.trim();

            return (
              <div
                key={n?.id ?? n?.Id}
                className="rounded-lg bg-zinc-50 p-2 text-[11px] text-zinc-700 ring-1 ring-zinc-100 dark:bg-zinc-950/40 dark:text-zinc-200 dark:ring-zinc-800"
              >
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-[9px] font-semibold text-white dark:bg-zinc-50 dark:text-black">
                      {fullName ? initials(fullName) : "?"}
                    </span>
                    <span className="max-w-[200px] truncate font-semibold">
                      {fullName || "Bilinmeyen Personel"}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {formatTR(n?.olusturmaTarihiUtc ?? n?.OlusturmaTarihiUtc)}
                  </span>
                </div>

                <div className="whitespace-pre-wrap break-words text-[11px] leading-snug text-zinc-700 dark:text-zinc-200">
                  {n?.metin ?? n?.Metin}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}