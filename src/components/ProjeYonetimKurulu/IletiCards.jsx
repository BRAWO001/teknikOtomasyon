// src/components/ProjeYonetimKurulu/IletiCards.jsx
export default function IletiCards({
  list,
  isPatron,
  formatTR,
  onOpen,
  onToggleDuzenleme,
}) {
  return (
    <div className="grid grid-cols-1 gap-3">
      {list.map((x) => {
        const duz = !!x.duzenlemeDurumu;

        // ✅ Site bazlı numara (yoksa global id fallback)
        const iletiNo =
          x.siteBazliNo ?? x.siteBazliNo === 0 ? x.siteBazliNo : null;
        const showNo =
          typeof iletiNo === "number" && iletiNo > 0 ? iletiNo : x.id;

        return (
          <div
            key={x.id}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold tracking-tight">
                    İleti No: #{showNo} • {x.iletiBaslik}
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
                  {x.site?.ad ? `${x.site.ad} • ` : ""}
                  {formatTR(x.tarihUtc)}
                </div>

                <div className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-200">
                  {x.iletiAciklama}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                    Durum:{" "}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {x.durum ?? "-"}
                    </span>
                  </span>

                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                    Yorum:{" "}
                    <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                      {x.yorumSayisi ?? 0}
                    </span>
                  </span>

                  {typeof x.siteBazliNo === "number" && x.siteBazliNo > 0 && (
                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                      Site No:{" "}
                      <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                        {x.siteBazliNo}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Right actions */}
              <div className="flex shrink-0 flex-col items-end gap-2">
                <button
                  className="h-9 rounded-md bg-zinc-900 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                  onClick={() => onOpen?.(x.publicToken)}
                  disabled={!x.publicToken}
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
                    onClick={() => onToggleDuzenleme?.(x.id, !duz)}
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
