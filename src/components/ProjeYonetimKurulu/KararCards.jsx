




// src/components/ProjeYonetimKurulu/KararCards.jsx
export default function KararCards({ list, isPatron, formatTR, onOpen, onToggleDuzenleme }) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {list.map((k) => {
        const duz = !!k.duzenlemeDurumu;

        // ✅ Site bazlı numara (yoksa global id’ye düş)
        const kararNo = k.siteBazliNo ?? k.siteBazliNo === 0 ? k.siteBazliNo : null;
        const showNo = (typeof kararNo === "number" && kararNo > 0) ? kararNo : k.id;

        return (
          <div
            key={k.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {/* ✅ Burayı değiştirdik */}
                  <div className="text-sm font-semibold tracking-tight">
                    {/* İstersen: #{k.siteId}-{showNo} şeklinde de yaparız */}
                    Karar No: #   {showNo} • {k.kararKonusu}
                  </div>

                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${
                      duz
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/15 dark:text-emerald-200"
                        : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/15 dark:text-amber-100"
                    }`}
                    title="Patron düzenleme izni"
                  >
                    {duz ? "Düzenleme Açık" : "Düzenleme Kapalı"}
                  </span>
                </div>

                <div className="mt-1 text-[12px] text-zinc-500 dark:text-zinc-400">
                  {k.site?.ad ? `${k.site.ad} • ` : ""}
                  {formatTR(k.tarih)}
                </div>

                <div className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {k.kararAciklamasi}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                    Nihai:{" "}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {k.nihaiSonuc ?? "-"}
                    </span>
                  </span>

                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                    Öneren:{" "}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {k.onerenKisiSayisi ?? 0}
                    </span>
                  </span>

                  {/* ✅ İstersen extra chip olarak da gösterebiliriz */}
                  {typeof k.siteBazliNo === "number" && k.siteBazliNo > 0 && (
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                      Site No:{" "}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                        {k.siteBazliNo}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right actions */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  onClick={() => onOpen?.(k.publicToken)}
                  disabled={!k.publicToken}
                  title="Detaya git"
                >
                  Detay
                </button>

                {isPatron && (
                  <button
                    className={`h-9 rounded-md px-3 text-sm font-semibold shadow-sm transition active:scale-[0.99] ${
                      duz
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-amber-500 text-white hover:bg-amber-600"
                    }`}
                    onClick={() => onToggleDuzenleme?.(k.id, !duz)}
                    title="Düzenleme iznini aç/kapat"
                  >
                    {duz ? "Kapat" : "Aç"}
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
